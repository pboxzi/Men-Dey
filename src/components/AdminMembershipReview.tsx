import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { notifyMembershipStatus } from '../utils/notifications';
import {
  Check, X, Search, Loader2, User, Mail, RefreshCw,
  Crown, Calendar, Ban, ChevronRight, AlertTriangle, PauseCircle, Play, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MembershipRequest {
  id: string; user_id: string; status: string;
  tier_id: string; tier_name: string; tier_price: string;
  card_name: string; card_serial: string;
  member_name: string; member_email: string; member_phone: string; member_country: string;
  profile_photo: string;
  comm_method: string;
  membership_number: string;
  activation_date: string; expiration_date: string;
  cancel_reason: string; admin_notes: string;
  created_at: string;
}

const normalizeMembership = (r: any): MembershipRequest => {
  const msg = typeof r.message === 'string' ? JSON.parse(r.message || '{}') : (r.message || {});
  const notes = typeof r.notes === 'string' ? JSON.parse(r.notes || '{}') : (r.notes || {});
  return {
    id: r.id, user_id: r.user_id || '', status: r.status || 'pending',
    tier_id: msg.tier_id || '', tier_name: msg.tier_name || '', tier_price: msg.tier_price || '',
    card_name: r.full_name || msg.card_name || r.card_name || '',
    card_serial: msg.card_serial || r.card_serial || '',
    member_name: msg.member_name || r.member_name || '',
    member_email: r.email || msg.member_email || '',
    member_phone: msg.phone || r.phone || '',
    member_country: r.country || msg.member_country || '',
    profile_photo: msg.profile_photo || r.profile_photo || '',
    comm_method: msg.comm_method || r.comm_method || 'email',
    membership_number: notes.membership_number || r.membership_number || '',
    activation_date: r.reviewed_at || notes.activation_date || '',
    expiration_date: notes.expiration_date || r.expiration_date || '',
    cancel_reason: notes.cancel_reason || r.cancel_reason || '',
    admin_notes: notes.admin_notes || r.admin_notes || '',
    created_at: r.created_at || '',
  };
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'expired', label: 'Expired' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  upgrade_pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  suspended: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  expired: 'bg-red-500/10 text-red-500 border-red-500/20',
  cancelled: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  upgrade_pending: 'Upgrade Pending',
  active: 'Active',
  suspended: 'Suspended',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export default function AdminMembershipReview() {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('membership_applications').select('*').order('created_at', { ascending: false });
      if (!error) setRequests((data || []).map(normalizeMembership));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    const body: any = { status };
    if (status === 'active') {
      body.membership_number = `GA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      body.activation_date = new Date().toISOString();
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      body.expiration_date = exp.toISOString();
    }
    try {
      const { data: current } = await supabase.from('membership_applications').select('*').eq('id', id).single();
      let notes: any = {};
      try { notes = typeof current?.notes === 'string' ? JSON.parse(current.notes) : (current?.notes || {}); } catch {}
      notes.membership_number = body.membership_number || notes.membership_number;
      notes.expiration_date = body.expiration_date || notes.expiration_date;
      if (adminNote.trim()) notes.admin_notes = notes.admin_notes ? notes.admin_notes + '\n' + adminNote.trim() : adminNote.trim();
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'active') {
        updates.reviewed_at = new Date().toISOString();
        updates.notes = JSON.stringify(notes);
      } else if (status === 'suspended' || status === 'expired' || status === 'cancelled') {
        updates.notes = JSON.stringify(notes);
      }
      const { data, error } = await supabase.from('membership_applications').update(updates).eq('id', id).select('*').single();
      if (!error && data) {
        const norm = normalizeMembership(data);
        setRequests(prev => prev.map(req => req.id === id ? norm : req));
        if (selectedRequest?.id === id) setSelectedRequest(norm);

        // Notify the fan
        notifyMembershipStatus(data.user_id, status, data.tier || 'Membership');
      }
    } catch {}
    setActionLoading(null);
  };

  const extendMembership = async (id: string) => {
    setActionLoading(id);
    try {
      const { data: current } = await supabase.from('membership_applications').select('*').eq('id', id).single();
      let notes: any = {};
      try { notes = typeof current?.notes === 'string' ? JSON.parse(current.notes) : (current?.notes || {}); } catch {}
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      notes.expiration_date = exp.toISOString();
      const { data, error } = await supabase.from('membership_applications').update({
        status: 'active', notes: JSON.stringify(notes), updated_at: new Date().toISOString(),
      }).eq('id', id).select('*').single();
      if (!error && data) {
        setRequests(prev => prev.map(r => r.id === id ? normalizeMembership(data) : r));
        if (selectedRequest?.id === id) setSelectedRequest(normalizeMembership(data));
      }
    } catch {}
    setActionLoading(null);
  };

  const deleteRequest = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('membership_applications').delete().eq('id', id);
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selectedRequest?.id === id) setShowDetail(false);
    } else {
      alert('Failed to delete: ' + error.message);
    }
    setActionLoading(null);
    setConfirmDelete(null);
  };

  const filtered = requests.filter(r => {
    if (filterTab !== 'all' && r.status !== filterTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.member_name?.toLowerCase().includes(q) ||
        r.member_email?.toLowerCase().includes(q) ||
        r.tier_name?.toLowerCase().includes(q) ||
        r.card_serial?.toLowerCase().includes(q) ||
        r.membership_number?.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending' || r.status === 'upgrade_pending').length,
    active: requests.filter(r => r.status === 'active').length,
    suspended: requests.filter(r => r.status === 'suspended').length,
    cancelled: requests.filter(r => r.status === 'cancelled' || r.status === 'expired').length,
  };

  const openDetail = (r: MembershipRequest) => {
    setSelectedRequest(r);
    setAdminNote('');
    setShowDetail(true);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div>
          <h2 className="font-serif text-xl font-bold tracking-wider text-white">Membership Management</h2>
          <p className="text-xs text-neutral-500 font-mono">Review, approve, and manage all membership applications.</p>
        </div>
        <button onClick={fetchRequests} disabled={loading}
          className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} /> Refresh
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-500' },
          { label: 'Active', value: stats.active, color: 'text-emerald-500' },
          { label: 'Suspended', value: stats.suspended, color: 'text-purple-400' },
          { label: 'Closed', value: stats.cancelled, color: 'text-neutral-500' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-neutral-900 bg-neutral-950/40 p-3 text-center">
            <p className={'text-lg font-bold font-mono ' + s.color}>{s.value}</p>
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input type="text" placeholder="Search name, email, tier, serial..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
        </div>
        <div className="flex gap-1 bg-neutral-950 border border-neutral-900 rounded-lg p-0.5">
          {FILTER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-widest uppercase transition-all ${
                filterTab === tab.key ? 'bg-gold-500 text-neutral-950 font-bold' : 'text-neutral-500 hover:text-white'
              }`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-900 p-12 text-center space-y-2">
          <Crown className="h-8 w-8 text-neutral-700 mx-auto" />
          <p className="text-sm text-neutral-500">No membership requests found.</p>
          <p className="text-[10px] font-mono text-neutral-600">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(req => (
            <div key={req.id} onClick={() => openDetail(req)}
              className="rounded-xl border border-neutral-900 bg-neutral-950 hover:border-neutral-800 transition-all cursor-pointer p-4 space-y-3 group"
            >
              {/* Top row */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                    {req.profile_photo ? (
                      <img src={req.profile_photo} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-neutral-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{req.member_name || req.card_name}</p>
                    <p className="text-[9px] text-neutral-500 font-mono truncate">{req.member_email}</p>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${STATUS_STYLES[req.status] || 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                  {STATUS_LABELS[req.status] || req.status}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                <div><span className="text-neutral-500">Tier</span><p className="text-gold-500 font-bold truncate">{req.tier_name || '-'}</p></div>
                <div><span className="text-neutral-500">Serial</span><p className="text-white font-mono truncate">{req.card_serial || '-'}</p></div>
                {req.membership_number && <div className="col-span-2"><span className="text-neutral-500">Membership #</span><p className="text-white font-mono">{req.membership_number}</p></div>}
                <div><span className="text-neutral-500">Submitted</span><p className="text-white">{new Date(req.created_at).toLocaleDateString()}</p></div>
                <div><span className="text-neutral-500">Comm</span><p className="text-white capitalize">{req.comm_method || '-'}</p></div>
              </div>

              {/* Active membership extras */}
              {req.status === 'active' && (
                <div className="flex items-center gap-3 text-[9px] font-mono text-neutral-500 pt-1.5 border-t border-neutral-900/60">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Exp: {req.expiration_date ? new Date(req.expiration_date).toLocaleDateString() : 'N/A'}</span>
                  {req.membership_number && <span className="flex items-center gap-1"><Crown className="h-3 w-3" /> #{req.membership_number.split('-').pop()}</span>}
                </div>
              )}

              <div className="flex items-center justify-end gap-1 pt-1 border-t border-neutral-900/60 text-[9px] font-mono uppercase tracking-wider text-neutral-600 group-hover:text-gold-400 transition-all duration-300 group-hover:gap-2">
                Click to manage <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {showDetail && selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowDetail(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-neutral-900 bg-[#0a0a0c] p-6 shadow-2xl space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
                    {selectedRequest.profile_photo ? (
                      <img src={selectedRequest.profile_photo} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">{selectedRequest.member_name || selectedRequest.card_name}</h3>
                    <p className="text-xs text-neutral-500 font-mono">{selectedRequest.member_email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase border ${STATUS_STYLES[selectedRequest.status] || ''}`}>
                  {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                </span>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Application Details</h4>
                  <div className="space-y-2 text-[11px]">
                    {[
                      ['Tier', selectedRequest.tier_name, 'text-gold-500 font-bold'],
                      ['Price', selectedRequest.tier_price, ''],
                      ['Card Name', selectedRequest.card_name, ''],
                      ['Card Serial', selectedRequest.card_serial, 'font-mono'],
                      ['Membership #', selectedRequest.membership_number || 'N/A', 'font-mono'],
                      ['Submitted', new Date(selectedRequest.created_at).toLocaleString(), ''],
                    ].map(([l, v, c]) => (
                      <div key={String(l)} className="flex justify-between">
                        <span className="text-neutral-500">{String(l)}</span>
                        <span className={`text-white text-right max-w-[55%] truncate ${c}`}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Member Info</h4>
                  <div className="space-y-2 text-[11px]">
                    {[
                      ['Name', selectedRequest.member_name],
                      ['Email', selectedRequest.member_email],
                      ['Phone', selectedRequest.member_phone || '-'],
                      ['Country', selectedRequest.member_country],
                      ['Comm Method', selectedRequest.comm_method],
                    ].map(([l, v]) => (
                      <div key={String(l)} className="flex justify-between">
                        <span className="text-neutral-500">{String(l)}</span>
                        <span className="text-white text-right max-w-[55%] truncate">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  {selectedRequest.status === 'active' && (
                    <div className="pt-2 space-y-2">
                      <h4 className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold">Validity</h4>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Activated</span>
                          <span className="text-white">{selectedRequest.activation_date ? new Date(selectedRequest.activation_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Expires</span>
                          <span className={`font-mono ${selectedRequest.expiration_date && new Date(selectedRequest.expiration_date) < new Date() ? 'text-red-400' : 'text-white'}`}>
                            {selectedRequest.expiration_date ? new Date(selectedRequest.expiration_date).toLocaleDateString() : 'Lifetime'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancel Reason */}
              {selectedRequest.cancel_reason && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.02] p-3 space-y-1">
                  <h4 className="text-[9px] font-mono text-red-400 uppercase tracking-widest font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Cancellation Reason
                  </h4>
                  <p className="text-[11px] text-neutral-300">{selectedRequest.cancel_reason}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Admin Notes</h4>
                {selectedRequest.admin_notes ? (
                  <p className="text-[11px] text-neutral-300 whitespace-pre-line bg-neutral-950/40 border border-neutral-900 rounded-lg p-3">{selectedRequest.admin_notes}</p>
                ) : (
                  <p className="text-[10px] text-neutral-600 italic">No notes yet.</p>
                )}
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 resize-none" rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-900/60">
                {(selectedRequest.status === 'pending' || selectedRequest.status === 'upgrade_pending') && (
                  <>
                    <button onClick={() => handleAction(selectedRequest.id, 'active')} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest shadow-[0_0_16px_-6px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_-6px_rgba(16,185,129,0.7)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >{actionLoading === selectedRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> {selectedRequest.status === 'upgrade_pending' ? 'Approve Upgrade' : 'Approve & Activate'}</>}</button>
                    <button onClick={() => handleAction(selectedRequest.id, 'cancelled')} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/[0.04] text-red-400 hover:bg-red-500 hover:text-white font-bold text-[10px] font-mono uppercase tracking-widest hover:shadow-[0_0_28px_-8px_rgba(239,68,68,0.5)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >{actionLoading === selectedRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> Reject</>}</button>
                    <span className="h-6 w-px bg-neutral-800/60" />
                    <a href={`mailto:${selectedRequest.member_email}`}
                      className="group/btn flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700/40 bg-neutral-800/20 text-neutral-400 hover:bg-neutral-700 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
                    ><Mail className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" /> Contact</a>
                  </>
                )}
                {selectedRequest.status === 'active' && (
                  <>
                    <button onClick={() => extendMembership(selectedRequest.id)} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-gold-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest shadow-[0_0_16px_-6px_rgba(245,158,11,0.3)] hover:shadow-[0_0_28px_-6px_rgba(245,158,11,0.6)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >{actionLoading === selectedRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Crown className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> Extend 1 Year</>}</button>
                    <button onClick={() => handleAction(selectedRequest.id, 'suspended')} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/[0.04] text-purple-400 hover:bg-purple-500 hover:text-white font-bold text-[10px] font-mono uppercase tracking-widest hover:shadow-[0_0_28px_-8px_rgba(168,85,247,0.5)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    ><PauseCircle className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> Suspend</button>
                    <button onClick={() => handleAction(selectedRequest.id, 'expired')} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/[0.04] text-red-400 hover:bg-red-500 hover:text-white font-bold text-[10px] font-mono uppercase tracking-widest hover:shadow-[0_0_28px_-8px_rgba(239,68,68,0.5)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    ><Ban className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> Expire</button>
                    <span className="h-6 w-px bg-neutral-800/60" />
                    <a href={`mailto:${selectedRequest.member_email}`}
                      className="group/btn flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700/40 bg-neutral-800/20 text-neutral-400 hover:bg-neutral-700 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
                    ><Mail className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" /> Email</a>
                  </>
                )}
                {selectedRequest.status === 'suspended' && (
                  <>
                    <button onClick={() => handleAction(selectedRequest.id, 'active')} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest shadow-[0_0_16px_-6px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_-6px_rgba(16,185,129,0.7)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >{actionLoading === selectedRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> Reactivate</>}</button>
                    <button onClick={() => handleAction(selectedRequest.id, 'expired')} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/[0.04] text-red-400 hover:bg-red-500 hover:text-white font-bold text-[10px] font-mono uppercase tracking-widest hover:shadow-[0_0_28px_-8px_rgba(239,68,68,0.5)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    ><Ban className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> Mark Expired</button>
                    <span className="h-6 w-px bg-neutral-800/60" />
                    <a href={`mailto:${selectedRequest.member_email}`}
                      className="group/btn flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700/40 bg-neutral-800/20 text-neutral-400 hover:bg-neutral-700 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
                    ><Mail className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" /> Email</a>
                  </>
                )}
                {(selectedRequest.status === 'expired' || selectedRequest.status === 'cancelled') && (
                  <>
                    <button onClick={() => handleAction(selectedRequest.id, 'pending')} disabled={actionLoading === selectedRequest.id}
                      className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] text-amber-400 hover:bg-gradient-to-r hover:from-amber-500 hover:to-gold-500 hover:text-neutral-950 font-bold text-[10px] font-mono uppercase tracking-widest hover:shadow-[0_0_28px_-8px_rgba(245,158,11,0.5)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >{actionLoading === selectedRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> Reopen</>}</button>
                    <span className="h-6 w-px bg-neutral-800/60" />
                    <a href={`mailto:${selectedRequest.member_email}`}
                      className="group/btn flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700/40 bg-neutral-800/20 text-neutral-400 hover:bg-neutral-700 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
                    ><Mail className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" /> Email</a>
                  </>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {confirmDelete === selectedRequest.id ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                      <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider whitespace-nowrap">Confirm delete?</span>
                      <button onClick={() => deleteRequest(selectedRequest.id)} disabled={actionLoading === selectedRequest.id}
                        className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-neutral-950 font-bold text-[9px] font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                      >{actionLoading === selectedRequest.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}</button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="px-2.5 py-1 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white text-[9px] font-mono uppercase transition-all"
                      >No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(selectedRequest.id)}
                      className="group/btn flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.03] text-red-500/60 hover:bg-red-500 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
                    ><Trash2 className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" /></button>
                  )}
                  <button onClick={() => setShowDetail(false)}
                    className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:bg-neutral-800 hover:text-white text-[10px] font-mono uppercase tracking-widest active:scale-[0.97] transition-all duration-200"
                  >Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
