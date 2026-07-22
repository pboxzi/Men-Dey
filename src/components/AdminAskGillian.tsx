import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import {
  MessageCircle, Send, Loader2, Clock, CheckCircle, Users,
  Wifi, WifiOff, RefreshCw, Search
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  adminUserId?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'gillian';
  text: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  last_message_at: string;
  created_at: string;
  profiles?: { name: string; email: string };
  unread_count?: number;
  last_message?: string;
}

interface GillianStatus {
  id: string;
  status: 'available' | 'busy' | 'away';
  message: string;
}

export default function AdminAskGillian({ showToast, adminUserId }: Props) {
  const [gillianStatus, setGillianStatus] = useState<GillianStatus>({ id: '', status: 'available', message: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'active'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

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

  // Fetch Gillian's status
  const fetchStatus = async () => {
    const { data } = await supabase.from('ask_gillian_status').select('*').limit(1).maybeSingle();
    if (data) {
      setGillianStatus(data);
      setStatusMessage(data.message || '');
    }
  };

  // Fetch all conversations with user info
  const fetchConversations = async () => {
    let query = supabase
      .from('ask_gillian_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    // Filter out admin's own conversation
    if (adminUserId) {
      query = query.neq('user_id', adminUserId);
    }

    const { data: convs } = await query;

    if (convs) {
      // Get user profiles for each conversation
      const convsWithProfiles = await Promise.all(
        convs.map(async (conv) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', conv.user_id)
            .single();

          // Get unread count
          const { count } = await supabase
            .from('ask_gillian_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender', 'user')
            .eq('read', false);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('ask_gillian_messages')
            .select('text')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            profiles: profile || { name: 'Unknown', email: '' },
            unread_count: count || 0,
            last_message: lastMsg?.text || '',
          };
        })
      );

      setConversations(convsWithProfiles);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('ask_gillian_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);

      // Mark user messages as read
      await supabase
        .from('ask_gillian_messages')
        .update({ read: true })
        .eq('conversation_id', convId)
        .eq('sender', 'user')
        .eq('read', false);

      // Refresh conversations to update unread count
      fetchConversations();
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchStatus();
      await fetchConversations();
      setLoading(false);
    };
    init();
  }, []);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchConversations();
      if (selectedConv) {
        await fetchMessages(selectedConv.id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  // Select a conversation
  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv(conv);
    await fetchMessages(conv.id);
  };

  // Send message as Gillian
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;

    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('ask_gillian_messages').insert({
      conversation_id: selectedConv.id,
      sender: 'gillian',
      text: msgText,
    });

    if (error) {
      showToast('Failed to send message', 'error');
    } else {
      await fetchMessages(selectedConv.id);
      showToast('Message sent', 'success');
    }

    setSending(false);
    inputRef.current?.focus();
  };

  // Toggle Gillian's status
  const handleToggleStatus = async (newStatus: 'available' | 'busy' | 'away') => {
    const { error } = await supabase
      .from('ask_gillian_status')
      .update({ status: newStatus, message: statusMessage, updated_at: new Date().toISOString() })
      .eq('id', gillianStatus.id);

    if (error) {
      showToast('Failed to update status', 'error');
      return;
    }

    setGillianStatus(prev => ({ ...prev, status: newStatus }));
    showToast(`Status updated to ${newStatus}`, 'success');
  };

  // Save status message
  const handleSaveStatusMessage = async () => {
    const { error } = await supabase
      .from('ask_gillian_status')
      .update({ message: statusMessage, updated_at: new Date().toISOString() })
      .eq('id', gillianStatus.id);

    if (error) {
      showToast('Failed to update status message', 'error');
    } else {
      setGillianStatus(prev => ({ ...prev, message: statusMessage }));
      showToast('Status message updated', 'success');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' ||
      conv.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === 'all' ||
      (filter === 'unread' && (conv.unread_count || 0) > 0) ||
      (filter === 'active' && conv.status === 'active');

    return matchesSearch && matchesFilter;
  });

  const statusConfig = {
    available: { color: 'bg-emerald-500', label: 'Available', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', icon: Wifi },
    busy: { color: 'bg-amber-500', label: 'Busy', textColor: 'text-amber-400', borderColor: 'border-amber-500/30', icon: Clock },
    away: { color: 'bg-neutral-500', label: 'Away', textColor: 'text-neutral-400', borderColor: 'border-neutral-500/30', icon: WifiOff },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gold-400 tracking-widest uppercase mb-1">
            <MessageCircle className="h-3 w-3" />
            Ask Gillian
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Fan Conversations</h2>
          <p className="text-xs text-neutral-500 font-mono">Chat with fans and manage your availability.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchConversations(); fetchStatus(); }}
            className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
          ><RefreshCw className="h-3.5 w-3.5 group-hover/btn:rotate-180 transition-transform duration-500" /> Refresh</button>
        </div>
      </div>

      {/* Status Control */}
      <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Your Availability</h3>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${currentStatus.borderColor} bg-neutral-950`}>
            <div className={`h-2 w-2 rounded-full ${currentStatus.color}`} />
            <span className={`text-[9px] font-mono uppercase ${currentStatus.textColor}`}>{currentStatus.label}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['available', 'busy', 'away'] as const).map((status) => {
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            return (
              <button
                key={status}
                onClick={() => handleToggleStatus(status)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-widest transition-all ${
                  gillianStatus.status === status
                    ? `${cfg.borderColor} ${cfg.textColor} bg-neutral-900 font-bold`
                    : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="Status message (e.g., In rehearsal until 3pm)"
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
          />
          <button
            onClick={handleSaveStatusMessage}
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 hover:text-white uppercase tracking-widest transition-all"
          >Save</button>
        </div>
      </div>

      {/* Main Content: Conversations + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden min-h-[500px]">
        {/* Conversations List */}
        <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-neutral-900 flex flex-col">
          <div className="p-3 border-b border-neutral-900 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white outline-none focus:border-gold-500/40"
              />
            </div>
            <div className="flex gap-1">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'unread' as const, label: 'Unread' },
                { id: 'active' as const, label: 'Active' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider transition-all ${
                    filter === f.id ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
                  }`}
                >{f.label}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-6 w-6 text-neutral-700 mx-auto mb-2" />
                <p className="text-[10px] text-neutral-500">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full text-left px-3 py-3 border-b border-neutral-900/50 transition-all hover:bg-neutral-900/50 ${
                    selectedConv?.id === conv.id ? 'bg-neutral-900/80 border-l-2 border-l-gold-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-mono font-bold text-gold-500">
                        {(conv.profiles?.name || 'U').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-white truncate">{conv.profiles?.name || 'Unknown'}</p>
                        {(conv.unread_count || 0) > 0 && (
                          <span className="h-4 min-w-4 rounded-full bg-gold-500 text-neutral-950 text-[8px] font-mono font-bold flex items-center justify-center px-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-neutral-500 truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                    </div>
                  </div>
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
                <MessageCircle className="h-10 w-10 text-neutral-700 mx-auto" />
                <p className="text-sm text-neutral-500">Select a conversation to start chatting</p>
                <p className="text-[10px] text-neutral-600 font-mono">Choose from the list on the left</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-neutral-900 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-gold-500">
                    {(selectedConv.profiles?.name || 'U').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{selectedConv.profiles?.name || 'Unknown'}</p>
                  <p className="text-[9px] text-neutral-500 font-mono">{selectedConv.profiles?.email || ''}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[8px] font-mono uppercase ${
                  selectedConv.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  selectedConv.status === 'waiting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-neutral-900 text-neutral-500 border border-neutral-800'
                }`}>
                  {selectedConv.status}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px]"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[10px] text-neutral-600 font-mono">No messages yet. Send the first response!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender === 'gillian' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-mono font-medium text-[9px] ${
                        msg.sender === 'gillian'
                          ? 'bg-neutral-950 border-gold-800/35 text-gold-500'
                          : 'bg-neutral-900 border-neutral-800 text-white'
                      }`}>
                        {msg.sender === 'gillian' ? 'GA' : (selectedConv.profiles?.name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] space-y-1 ${msg.sender === 'gillian' ? 'text-right' : 'text-left'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'gillian'
                            ? 'bg-gold-500 text-neutral-950 font-bold'
                            : 'bg-neutral-900 text-neutral-200'
                        }`}>
                          {msg.text}
                        </div>
                        <p className="text-[9px] text-neutral-600 font-mono">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender === 'gillian' && msg.read && (
                            <CheckCircle className="inline h-3 w-3 ml-1 text-emerald-500" />
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-neutral-900">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response..."
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
