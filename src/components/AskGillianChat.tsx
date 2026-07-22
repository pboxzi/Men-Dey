import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { notifyAdmins } from '../utils/notifications';
import {
  Send, Loader2, MessageCircle, Clock, CheckCircle, Wifi, WifiOff
} from 'lucide-react';

interface Props {
  userId: string;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'gillian';
  text: string;
  read: boolean;
  created_at: string;
}

interface GillianStatus {
  status: 'available' | 'busy' | 'away';
  message: string;
}

export default function AskGillianChat({ userId, showToast }: Props) {
  const [gillianStatus, setGillianStatus] = useState<GillianStatus>({ status: 'available', message: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gillianTyping, setGillianTyping] = useState(false);
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

  const fetchStatus = async () => {
    try {
      const { data } = await supabase.from('ask_gillian_status').select('*').limit(1).maybeSingle();
      if (data) setGillianStatus(data);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  };

  const fetchMessages = useCallback(async () => {
    const convId = convIdRef.current;
    if (!convId) return;
    try {
      const { data } = await supabase
        .from('ask_gillian_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  }, []);

  const ensureConversation = async (): Promise<string | null> => {
    // If we already have a conversation ID, return it
    if (convIdRef.current) return convIdRef.current;

    try {
      // Check if user has an existing conversation
      const { data: existing } = await supabase
        .from('ask_gillian_conversations')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (existing && existing.length > 0) {
        convIdRef.current = existing[0].id;
        return existing[0].id;
      }

      // Create new conversation
      const { data: newConv } = await supabase
        .from('ask_gillian_conversations')
        .insert({ user_id: userId, status: 'waiting' })
        .select('id')
        .maybeSingle();

      if (newConv) {
        convIdRef.current = newConv.id;
        return newConv.id;
      }
    } catch (e) {
      console.error('Failed to ensure conversation:', e);
    }
    return null;
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        await fetchStatus();
        const convId = await ensureConversation();
        if (convId) await fetchMessages();
      } catch (e) {
        console.error('Init failed:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(async () => {
      await fetchStatus();
      await fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [loading, fetchMessages]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const msgText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Ensure we have a conversation
    const convId = await ensureConversation();
    if (!convId) {
      showToast('Failed to start conversation', 'error');
      setSending(false);
      return;
    }

    // Optimistic add
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: convId,
      sender: 'user',
      text: msgText,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    // Reset scroll tracking so we auto-scroll to new message
    isUserScrolling.current = false;
    setTimeout(scrollToBottom, 50);

    // Insert message
    const { error } = await supabase.from('ask_gillian_messages').insert({
      conversation_id: convId,
      sender: 'user',
      text: msgText,
    });

    if (error) {
      showToast('Failed to send message', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } else {
      // Update conversation
      await supabase
        .from('ask_gillian_conversations')
        .update({ status: 'active', last_message_at: new Date().toISOString() })
        .eq('id', convId);

      // Fetch real messages
      await fetchMessages();
      setTimeout(scrollToBottom, 100);

      // Notify admin of new fan question
      notifyAdmins('message', 'New Fan Question', `A fan asked Gillian: "${msgText.slice(0, 100)}..."`);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  // Typing indicator
  useEffect(() => {
    if (gillianStatus.status !== 'available' || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender !== 'user' || lastMsg.id.startsWith('temp-')) return;
    const lastGillianMsg = [...messages].reverse().find(m => m.sender === 'gillian');
    if (!lastGillianMsg || new Date(lastMsg.created_at) > new Date(lastGillianMsg.created_at)) {
      setGillianTyping(true);
      const timeout = setTimeout(() => setGillianTyping(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [messages.length]);

  const statusConfig = {
    available: { color: 'bg-emerald-500', label: 'Online', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
    busy: { color: 'bg-amber-500', label: 'Busy', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
    away: { color: 'bg-neutral-500', label: 'Away', textColor: 'text-neutral-400', borderColor: 'border-neutral-500/30' },
  };

  const currentStatus = statusConfig[gillianStatus.status];

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
          <MessageCircle className="h-4 w-4 text-gold-500" />
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Ask Gillian</h2>
        </div>
        <p className="text-xs text-neutral-500 font-mono">
          Have a direct conversation with Gillian. She loves hearing from her community.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden">
        {/* Status Bar */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b border-neutral-900 ${gillianStatus.status === 'available' ? 'bg-emerald-500/5' : gillianStatus.status === 'busy' ? 'bg-amber-500/5' : 'bg-neutral-900/30'}`}>
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <span className="text-sm font-serif font-bold text-gold-500">GA</span>
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${currentStatus.color} border-2 border-neutral-950`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Gillian Anderson</p>
            <p className={`text-[10px] font-mono ${currentStatus.textColor}`}>
              {currentStatus.label}
              {gillianStatus.message && ` — ${gillianStatus.message}`}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${currentStatus.borderColor} bg-neutral-950`}>
            {gillianStatus.status === 'available' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span className={`text-[9px] font-mono uppercase ${currentStatus.textColor}`}>{currentStatus.label}</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="h-[400px] overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <MessageCircle className="h-7 w-7 text-gold-500/50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-400">Start a conversation with Gillian</p>
                <p className="text-[10px] text-neutral-600 font-mono">Ask about her work, life, or just say hello</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
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

          {gillianTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full border bg-neutral-950 border-gold-800/35 text-gold-500 flex items-center justify-center shrink-0 font-mono font-medium text-[9px]">GA</div>
              <div className="bg-neutral-900 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-neutral-900 px-4 py-3">
          {gillianStatus.status !== 'available' && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${currentStatus.borderColor} ${
              gillianStatus.status === 'busy' ? 'bg-amber-500/5' : 'bg-neutral-900/30'
            }`}>
              <Clock className={`h-4 w-4 ${currentStatus.textColor} shrink-0`} />
              <div className="flex-1">
                <p className={`text-xs font-medium ${currentStatus.textColor}`}>
                  {gillianStatus.status === 'busy' ? 'Gillian is currently busy' : 'Gillian is currently away'}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">You can still send a message — she will respond when available.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2 mt-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={gillianStatus.status === 'available' ? "Type your message to Gillian..." : "Leave a message for Gillian..."}
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
      </div>

      <div className="rounded-xl border border-neutral-900 bg-neutral-950/50 p-4 space-y-3">
        <h3 className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-widest">Conversation Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🎭', label: 'Ask about her craft', desc: 'Acting, directing, creative process' },
            { icon: '📚', label: 'Literary discussions', desc: 'Books, writing, the Want anthology' },
            { icon: '💪', label: 'Advocacy & causes', desc: 'NF, gender equality, charity work' },
          ].map((tip) => (
            <div key={tip.label} className="flex items-start gap-2 p-2 rounded-lg bg-neutral-900/30 border border-neutral-900/50">
              <span className="text-base">{tip.icon}</span>
              <div>
                <p className="text-[10px] font-bold text-white">{tip.label}</p>
                <p className="text-[9px] text-neutral-500">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
