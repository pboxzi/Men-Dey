import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import {
  Mail, Send, Loader2, Search, X, CheckCircle, AlertCircle, Users, ChevronDown
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  body_preview: string;
  status: string;
  created_at: string;
}

export default function AdminDirectEmail({ showToast }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentEmails, setRecentEmails] = useState<EmailLog[]>([]);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .order('name', { ascending: true });
    if (!error && data) setUsers(data);
    setLoading(false);
  }, []);

  const fetchRecentEmails = useCallback(async () => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('id, recipient_email, subject, body_preview, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) setRecentEmails(data);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRecentEmails();
  }, [fetchUsers, fetchRecentEmails]);

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !subject.trim() || !body.trim()) return;

    setSending(true);
    setSendResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: subject.trim(),
          html: body.includes('<!DOCTYPE') || body.includes('<html')
            ? body
            : `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#050505;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
  <tr><td style="padding:0 0 1px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:16px 16px 0 0;">
    <tr><td style="padding:28px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#d4af37,#b8860b);text-align:center;line-height:40px;font-size:16px;font-weight:800;color:#050505;">GA</div></td>
        <td style="padding-left:14px;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;letter-spacing:0.5px;">Gillian Anderson</p>
          <p style="margin:2px 0 0;font-size:10px;color:#666;letter-spacing:1.5px;text-transform:uppercase;">Fan Community</p>
        </td>
      </tr></table>
    </td></tr>
    </table>
  </td></tr>
  <tr><td style="height:2px;background:linear-gradient(90deg,#d4af37,transparent);"></td></tr>
  <tr><td style="background:#0a0a0a;padding:44px 40px;">
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">${subject.trim()}</h1>
    <div style="font-size:14px;line-height:1.8;color:#a0a0a0;">${body.trim().replace(/\n/g, '<br>')}</div>
  </td></tr>
  <tr><td style="background:#080808;padding:28px 40px;border-radius:0 0 16px 16px;border-top:1px solid #1a1a1a;">
    <p style="margin:0 0 8px;font-size:10px;color:#444;letter-spacing:1px;text-transform:uppercase;">The Gillian Anderson Community</p>
    <p style="margin:0;font-size:11px;color:#333;"><a href="https://www.cmagency.me" style="color:#d4a853;text-decoration:none;">Visit Portal</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errMsg = result.details?.message || result.error || 'Failed to send email';
        setSendResult({ ok: false, message: errMsg });
        showToast(`Email failed: ${errMsg}`, 'error');
      } else {
        setSendResult({ ok: true, message: `Email sent to ${selectedUser.email}` });
        showToast(`Email sent to ${selectedUser.name || selectedUser.email}`, 'success');
        setSubject('');
        setBody('');
        setSelectedUser(null);
        setSearchQuery('');
        fetchRecentEmails();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setSendResult({ ok: false, message: msg });
      showToast(`Email failed: ${msg}`, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Direct Email</h2>
        <p className="text-xs text-neutral-500 font-mono">Send emails to users via Resend.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSend} className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 space-y-4">
            {/* To: User Selector */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">TO</label>
              <div className="relative">
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-xs text-left cursor-pointer hover:border-neutral-700 transition-colors flex items-center justify-between"
                >
                  {selectedUser ? (
                    <span className="text-white">
                      <span className="font-semibold">{selectedUser.name || 'Unnamed'}</span>
                      <span className="text-neutral-500 ml-2">{selectedUser.email}</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500">Select a user...</span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-neutral-900">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded pl-7 pr-3 py-1.5 text-xs text-white outline-none focus:border-red-500/40"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {loading ? (
                        <div className="px-4 py-6 text-center text-xs text-neutral-500">Loading users...</div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-neutral-500">No users found</div>
                      ) : (
                        filteredUsers.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDropdown(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-neutral-900/60 transition-colors flex items-center gap-3"
                          >
                            <div className="h-7 w-7 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-mono font-bold text-neutral-400">
                                {(u.name || u.email || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{u.name || 'Unnamed'}</p>
                              <p className="text-[10px] text-neutral-500 truncate">{u.email}</p>
                            </div>
                            {u.role === 'admin' && (
                              <span className="text-[8px] font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">ADMIN</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">SUBJECT</label>
              <input
                type="text"
                required
                placeholder="Email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-red-500/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">MESSAGE</label>
              <textarea
                rows={10}
                required
                placeholder="Write your email content here... Plain text or HTML supported."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-xs text-white outline-none focus:border-red-500/40 placeholder:text-neutral-600 leading-relaxed font-sans resize-none"
              />
              <p className="text-[9px] font-mono text-neutral-600">
                Supports plain text or HTML. If HTML, include full &lt;!DOCTYPE&gt; wrapper.
              </p>
            </div>

            {/* Send Result */}
            {sendResult && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded text-xs ${
                sendResult.ok
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {sendResult.ok ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                <span>{sendResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {selectedUser && (
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setSearchQuery(''); }}
                    className="px-3 py-1.5 text-[10px] font-mono text-neutral-500 hover:text-white border border-neutral-800 rounded transition-colors"
                  >
                    Clear recipient
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={sending || !selectedUser || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold text-xs rounded shadow-lg shadow-amber-500/10 transition-all"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Emails Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Recent Emails</h3>
            <button onClick={fetchRecentEmails} className="p-1 text-neutral-600 hover:text-white transition-colors">
              <Mail className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {recentEmails.length === 0 ? (
              <div className="rounded-xl border border-neutral-900 p-6 text-center text-neutral-500 text-xs font-mono">
                No emails sent yet.
              </div>
            ) : (
              recentEmails.map(e => (
                <div key={e.id} className="rounded-lg border border-neutral-900 bg-neutral-950/40 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono text-neutral-400 truncate">{e.recipient_email}</p>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      e.status === 'sent' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {e.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-white font-semibold truncate">{e.subject}</p>
                  <p className="text-[9px] text-neutral-600">{new Date(e.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
