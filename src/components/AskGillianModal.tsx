/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Modal from './Modal';
import { Send, User, MessageCircle, HelpCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalState } from '../utils/StateContext';

interface AskGillianModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'gillian';
  text: string;
  timestamp: string;
}

export default function AskGillianModal({ isOpen, onClose }: AskGillianModalProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'gillian',
      text: "Hello, thank you for reaching out. It's a pleasure to connect with you. What is on your mind? Ask me anything.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const { askGillian } = useGlobalState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = messages.map(m => ({ sender: m.sender, text: m.text }));

    setMessages((prev) => [...prev, userMessage]);
    const userQ = question;
    setQuestion('');
    setIsTyping(true);
    setWarning(null);

    try {
      const result = await askGillian(userQ, currentHistory);

      const gillianMessage: Message = {
        id: `gillian-${Date.now()}`,
        sender: 'gillian',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (result.warning) {
        setWarning(result.warning);
      }

      setMessages((prev) => [...prev, gillianMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'gillian',
        text: "I am having trouble connecting right now. Please try again in a few moments.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask Gillian" maxWidth="max-w-xl">
      <div className="flex h-[450px] flex-col rounded-lg border border-neutral-900 bg-neutral-950 p-4">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    msg.sender === 'user'
                      ? 'border-neutral-700 bg-neutral-900 text-white'
                      : 'border-gold-800/50 bg-neutral-900 text-gold-500'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : 'GA'}
                </div>

                {/* Bubble */}
                <div className="max-w-[75%] space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gold-500 text-neutral-950 font-medium'
                        : 'bg-neutral-900 text-neutral-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p
                    className={`text-[10px] text-neutral-500 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 flex-row"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-800/50 bg-neutral-900 text-xs font-medium text-gold-500">
                  GA
                </div>
                <div className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Warning Indicator */}
        {warning && (
          <div className="mt-2 flex items-center gap-2 rounded bg-gold-950/40 border border-gold-900/30 px-3 py-1.5 text-[11px] text-gold-500">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{warning}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-neutral-900 pt-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isTyping}
            placeholder="Ask about theater, characters, life, mentoring..."
            className="flex-1 rounded-md border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-gold-500/50 focus:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={!question.trim() || isTyping}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-gold-500 text-neutral-950 transition-all hover:bg-gold-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
}
