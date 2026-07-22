import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import {
  Send, Loader2, MessageSquare, Clock, CheckCircle, Wifi, WifiOff, Plus
} from 'lucide-react';

interface Props {
  userId: string;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Conversation {
  id: string;
  subject: string;
  status: string;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'admin';
  text: string;
  read: boolean;
  created_at: string;
}

export default function FanAdminChat({ userId, showToast }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const convIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    if (!isUserScrolling.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isUserScrolling.current = !atBottom;
  };

  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from('fan_admin_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (data) setConversations(data);
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('fan_admin_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchConversations();
      setLoading(false);
    };
    init();
  }, [fetchConversations]);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      await fetchConversations();
      if (convIdRef.current) {
        await fetchMessages(convIdRef.current);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [loading, fetchConversations, fetchMessages]);

  // Select conversation
  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv(conv);
    convIdRef.current = conv.id;
    isUserScrolling.current = false;
    await fetchMessages(conv.id);
    setTimeout(scrollToBottom, 100);
  };

  // Create new conversation
  const handleCreateConv = async () => {
    if (!newSubject.trim()) return;
    const { data, error } = await supabase
      .from('fan_admin_conversations')
      .insert({ user_id: userId, subject: newSubject.trim() })
      .select('id')
      .maybeSingle();

    if (error) {
      showToast('Failed to start conversation', 'error');
      return;
    }

    if (data) {
      await fetchConversations();
      const conv = conversations.find(c => c.id === data.id) || {
        id: data.id, subject: newSubject.trim(), status: 'active',
        last_message_at: new Date().toISOString(), created_at: new Date().toISOString()
      };
      setSelectedConv(conv);
      convIdRef.current = data.id;
      setShowNewChat(false);
      setNewSubject('');
      setMessages([]);
      showToast('Conversation started', 'success');
    }
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !convIdRef.current) return;

    const msgText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic add
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: convIdRef.current,
      sender: 'user',
      text: msgText,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    isUserScrolling.current = false;
    setTimeout(scrollToBottom, 50);

    const { error } = await supabase.from('fan_admin_messages').insert({
      conversation_id: convIdRef.current,
      sender: 'user',
      text: msgText,
    });

    if (error) {
      showToast('Failed to send message', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } else {
      await supabase
        .from('fan_admin_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convIdRef.current);
      await fetchMessages(convIdRef.current);
      await fetchConversations();
      setTimeout(scrollToBottom, 100);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1 border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gold-500" />
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Messages</h2>
        </div>
        <p className="text-xs text-neutral-500 font-mono">
          Direct line to the platform administration team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden min-h-[500px]">
        {/* Conversations List */}
        <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-neutral-900 flex flex-col">
          <div className="p-3 border-b border-neutral-900 flex justify-between items-center">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Conversations</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-gold-500 hover:bg-neutral-900 transition-all"
            >
              <Plus className="h-3 w-3" /> New
            </button>
          </div>

          {showNewChat && (
            <div className="p-3 border-b border-neutral-900 space-y-2">
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="Subject (e.g. Membership Question)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateConv()}
              />
              <div className="flex gap-2">
                <button onClick={handleCreateConv}
                  className="flex-1 py-1.5 rounded bg-gold-500 text-neutral-950 text-[9px] font-mono font-bold uppercase">Start</button>
                <button onClick={() => { setShowNewChat(false); setNewSubject(''); }}
                  className="px-3 py-1.5 rounded border border-neutral-800 text-neutral-500 text-[9px] font-mono uppercase">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-6 w-6 text-neutral-700 mx-auto mb-2" />
                <p className="text-[10px] text-neutral-500">No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full text-left px-3 py-3 border-b border-neutral-900/50 transition-all hover:bg-neutral-900/50 ${
                    selectedConv?.id === conv.id ? 'bg-neutral-900/80 border-l-2 border-l-gold-500' : ''
                  }`}
                >
                  <p className="text-[11px] font-bold text-white truncate">{conv.subject}</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5">
                    {new Date(conv.last_message_at).toLocaleDateString()} · {conv.status}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-3">
                <MessageSquare className="h-10 w-10 text-neutral-700 mx-auto" />
                <p className="text-sm text-neutral-500">Select or start a conversation</p>
                <p className="text-[10px] text-neutral-600 font-mono">Click "New" to message the admin team</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-neutral-900 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-gold-500">GA</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{selectedConv.subject}</p>
                  <p className="text-[9px] text-neutral-500 font-mono">
                    {selectedConv.status === 'active' ? 'Active' : 'Closed'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px]">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[10px] text-neutral-600 font-mono">No messages yet. Say hello!</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-mono font-medium text-[9px] ${
                      msg.sender === 'user' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-neutral-950 border-gold-800/35 text-gold-500'
                    }`}>
                      {msg.sender === 'user' ? 'YOU' : 'GA'}
                    </div>
                    <div className={`max-w-[75%] space-y-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user' ? 'bg-gold-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-200'
                      }`}>
                        {msg.text}
                      </div>
                      <p className="text-[9px] text-neutral-600 font-mono">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.sender === 'user' && msg.read && <CheckCircle className="inline h-3 w-3 ml-1 text-emerald-500" />}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedConv.status === 'active' && (
                <div className="border-t border-neutral-900 px-4 py-3">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sending}
                      className="flex-1 rounded border border-neutral-900 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-gold-500/40 disabled:opacity-50 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="h-10 w-10 flex items-center justify-center rounded bg-gold-500 text-neutral-950 hover:bg-gold-400 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
