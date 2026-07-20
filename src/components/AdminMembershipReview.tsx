import React, { useState, useEffect } from 'react';
import { Check, X, Search, Loader2, User, Mail, MessageCircle } from 'lucide-react';

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

export default function AdminMembershipReview() {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    fetch('/api/admin/membership-requests')
      .then(r => r.json())
      .then(data => { setRequests(data || []); setLoading(false); })
      .catch(() => setLoading(false));
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
      const r = await fetch('/api/admin/membership-requests/' + id, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        setRequests(prev => prev.map(req => req.id === id ? d.membership : req));
        if (selectedRequest?.id === id) setSelectedRequest(d.membership);
      }
    } catch {}
    setActionLoading(null);
  };

  const filtered = requests.filter(r =>
    r.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.member_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.tier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.card_serial?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-900 pb-4">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white">Membership Requests Review</h2>
        <p className="text-xs text-neutral-500 leading-normal font-mono">Review, approve, or reject membership applications. All changes sync in real-time.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
        <input type="text" placeholder="Search by name, email, tier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-900 p-12 text-center text-neutral-500 text-xs">No membership requests found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(req => (
            <div key={req.id}
              className={`rounded-xl border p-4 space-y-3 transition-all cursor-pointer ${selectedRequest?.id === req.id ? 'border-gold-500/40 bg-neutral-900/40' : 'border-neutral-900 bg-neutral-950 hover:border-neutral-800'}`}
              onClick={() => setSelectedRequest(req)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-neutral-900 flex items-center justify-center">
                    {req.profile_photo ? <img src={req.profile_photo} className="h-8 w-8 rounded-full object-cover" /> : <User className="h-4 w-4 text-neutral-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{req.member_name || req.card_name}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">{req.member_email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  req.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                  req.status === 'upgrade_pending' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                  req.status === 'expired' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  'bg-neutral-900 text-neutral-500 border border-neutral-800'
                }`}>{req.status === 'upgrade_pending' ? 'Upgrade Pending' : req.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div><span className="text-neutral-500 block">Tier</span><span className="text-gold-500 font-bold">{req.tier_name}</span></div>
                <div><span className="text-neutral-500 block">Card</span><span className="text-white font-mono">{req.card_name}</span></div>
                <div><span className="text-neutral-500 block">Serial</span><span className="text-white font-mono">{req.card_serial}</span></div>
                <div><span className="text-neutral-500 block">Submitted</span><span className="text-white">{new Date(req.created_at).toLocaleDateString()}</span></div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {req.member_email}</span>
                {req.comm_method && <span className="flex items-center gap-1 capitalize"><MessageCircle className="h-3 w-3" /> {req.comm_method}</span>}
              </div>

              {/* Action buttons */}
              {(req.status === 'pending' || req.status === 'upgrade_pending') && (
                <div className="flex gap-2 pt-1">
                  <button onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'active'); }} disabled={actionLoading === req.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-neutral-950 border border-green-500/20 text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                  >{actionLoading === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" /> {req.status === 'upgrade_pending' ? 'Approve Upgrade' : 'Approve'}</>}</button>
                  <button onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'cancelled'); }} disabled={actionLoading === req.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                  ><X className="h-3 w-3" /> Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
