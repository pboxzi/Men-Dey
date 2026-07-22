import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { notifyAdminResponse } from '../utils/notifications';
import {
  MessageSquare, Send, Loader2, Clock, CheckCircle, Users,
  Search, RefreshCw, X
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  adminUserId?: string;
}

interface Conversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  last_message_at: string;
  created_at: string;
  profiles?: { name: string; email: string };
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'admin';
  text: string;
  read: boolean;
  created_at: string;
}

export default function AdminMessages({ showToast, adminUserId }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'active'>('all');
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newFirstMsg, setNewFirstMsg] = useState('');
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
    const { data: convs } = await supabase
      .from('fan_admin_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (convs) {
      const withProfiles = await Promise.all(
        convs.map(async (conv) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', conv.user_id)
            .maybeSingle();

          const { count } = await supabase
            .from('fan_admin_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender', 'user')
            .eq('read', false);

          const { data: lastMsg } = await supabase
            .from('fan_admin_messages')
            .select('text')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            profiles: profile || { name: 'Unknown', email: '' },
            unread_count: count || 0,
            last_message: lastMsg?.text || '',
          };
        })
      );
      setConversations(withProfiles);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('fan_admin_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Mark user messages as read
      await supabase
        .from('fan_admin_messages')
        .update({ read: true })
        .eq('conversation_id', convId)
        .eq('sender', 'user')
        .eq('read', false);
      fetchConversations();
    }
  }, [fetchConversations]);

  // Fetch all users for admin-initiated conversations
  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, name, email').order('name');
    if (data) setUsers(data);
  };

  // Admin creates a new conversation with a fan
  const handleCreateConvAsAdmin = async () => {
    if (!selectedUserId || !newSubject.trim() || !newFirstMsg.trim()) {
      showToast('Select a user, subject, and message', 'error');
      return;
    }

    const { data: convData, error: convError } = await supabase
      .from('fan_admin_conversations')
      .insert({ user_id: selectedUserId, subject: newSubject.trim() })
      .select('id')
      .maybeSingle();

    if (convError || !convData) {
      showToast('Failed to create conversation', 'error');
      return;
    }

    // Send the first message
    await supabase.from('fan_admin_messages').insert({
      conversation_id: convData.id,
      sender: 'admin',
      text: newFirstMsg.trim(),
    });

    showToast('Conversation started', 'success');
    setShowNewChat(false);
    setSelectedUserId('');
    setNewSubject('');
    setNewFirstMsg('');
    await fetchConversations();

    // Select the new conversation
    const newConv: Conversation = {
      id: convData.id,
      user_id: selectedUserId,
      subject: newSubject.trim(),
      status: 'active',
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setSelectedConv(newConv);
    convIdRef.current = convData.id;
    await fetchMessages(convData.id);
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchConversations(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, [fetchConversations]);

  // Poll every 5 seconds
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      await fetchConversations();
      if (selectedConv) {
        await fetchMessages(selectedConv.id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, fetchConversations, fetchMessages, selectedConv?.id]);

  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv(conv);
    convIdRef.current = conv.id;
    isUserScrolling.current = false;
    await fetchMessages(conv.id);
    setTimeout(scrollToBottom, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;

    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('fan_admin_messages').insert({
      conversation_id: selectedConv.id,
      sender: 'admin',
      text: msgText,
    });

    if (error) {
      showToast('Failed to send message', 'error');
    } else {
      await supabase
        .from('fan_admin_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConv.id);
      await fetchMessages(selectedConv.id);
      await fetchConversations();

      // Notify the fan
      notifyAdminResponse(selectedConv.user_id, 'Admin', msgText);

      showToast('Message sent', 'success');
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' ||
      conv.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'unread' && (conv.unread_count || 0) > 0) ||
      (filter === 'active' && conv.status === 'active');
    return matchesSearch && matchesFilter;
  });

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
            <MessageSquare className="h-3 w-3" />
            Fan Messages
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Direct Messages</h2>
          <p className="text-xs text-neutral-500 font-mono">Respond to fan inquiries and support requests.</p>
        </div>
        <button onClick={() => { fetchConversations(); }}
          className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
        ><RefreshCw className="h-3.5 w-3.5 group-hover/btn:rotate-180 transition-transform duration-500" /> Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'unread', 'active'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                filter === f ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden min-h-[500px]">
        {/* Conversations List */}
        <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-neutral-900 flex flex-col">
          <div className="p-3 border-b border-neutral-900 flex justify-between items-center">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              Conversations ({filteredConversations.length})
            </p>
            <button
              onClick={() => { setShowNewChat(true); fetchUsers(); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono text-gold-500 hover:bg-neutral-900 transition-all"
            >+ New</button>
          </div>

          {showNewChat && (
            <div className="p-3 border-b border-neutral-900 space-y-2">
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40"
              >
                <option value="">Select a fan...</option>
                {users.filter(u => u.id !== adminUserId).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40"
              />
              <textarea
                value={newFirstMsg}
                onChange={e => setNewFirstMsg(e.target.value)}
                placeholder="Your message..."
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-gold-500/40 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleCreateConvAsAdmin}
                  className="flex-1 py-1.5 rounded bg-gold-500 text-neutral-950 text-[9px] font-mono font-bold uppercase">Send</button>
                <button onClick={() => { setShowNewChat(false); setSelectedUserId(''); setNewSubject(''); setNewFirstMsg(''); }}
                  className="px-3 py-1.5 rounded border border-neutral-800 text-neutral-500 text-[9px] font-mono uppercase">Cancel</button>
              </div>
            </div>
          )}
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
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-white truncate">{conv.subject}</p>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="h-4 min-w-4 rounded-full bg-gold-500 text-neutral-950 text-[8px] font-mono font-bold flex items-center justify-center px-1">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-neutral-500 mt-0.5">{conv.profiles?.name || 'Unknown'}</p>
                  <p className="text-[9px] text-neutral-600 truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
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
                <p className="text-sm text-neutral-500">Select a conversation to respond</p>
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
                  <p className="text-xs font-bold text-white">{selectedConv.subject}</p>
                  <p className="text-[9px] text-neutral-500 font-mono">{selectedConv.profiles?.name || 'Unknown'} · {selectedConv.profiles?.email || ''}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[8px] font-mono uppercase ${
                  selectedConv.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-neutral-900 text-neutral-500 border border-neutral-800'
                }`}>
                  {selectedConv.status}
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px]">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[10px] text-neutral-600 font-mono">No messages yet. Send the first response!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-mono font-medium text-[9px] ${
                        msg.sender === 'admin' ? 'bg-neutral-950 border-gold-800/35 text-gold-500' : 'bg-neutral-900 border-neutral-800 text-white'
                      }`}>
                        {msg.sender === 'admin' ? 'GA' : (selectedConv.profiles?.name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] space-y-1 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'admin' ? 'bg-gold-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-200'
                        }`}>
                          {msg.text}
                        </div>
                        <p className="text-[9px] text-neutral-600 font-mono">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender === 'admin' && msg.read && (
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
              {selectedConv.status === 'active' && (
                <div className="px-4 py-3 border-t border-neutral-900">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
