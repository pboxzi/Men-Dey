import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Clock, CheckCircle2, XCircle, RefreshCw, ShieldAlert, AlertTriangle, Loader2, Download, Copy, User, ArrowUp, MessageCircle, Mail, Check } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { openWhatsApp, openEmail } from '../utils/contactSettings';

interface MembershipData {
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

interface Props {
  userId?: string;
  authName: string;
  rank: { name: string; min: number; max: number; next: string };
  progressPercent: number;
  content: any;
}

const TIER_ORDER = ['scully', 'gibson', 'milburn'];

function normalizeMembership(row: any): MembershipData | null {
  if (!row) return null;
  let msg: any = {};
  try { msg = typeof row.message === 'string' ? JSON.parse(row.message) : (row.message || {}); } catch {}
  let nts: any = {};
  try { nts = typeof row.notes === 'string' ? JSON.parse(row.notes) : (row.notes || {}); } catch {}
  return {
    id: row.id, user_id: row.user_id,
    status: row.status === 'suspended' ? 'expired' : row.status,
    tier_id: msg.tier_id || row.tier,
    tier_name: msg.tier_name || row.tier,
    tier_price: msg.tier_price || msg.price || '',
    card_name: row.full_name || '',
    card_serial: msg.card_serial || '',
    member_name: msg.member_name || row.full_name || '',
    member_email: row.email || '',
    member_phone: msg.phone || '',
    member_country: row.country || '',
    profile_photo: msg.profile_photo || '',
    comm_method: msg.comm_method || '',
    membership_number: nts.membership_number || '',
    activation_date: row.reviewed_at || '',
    expiration_date: nts.expiration_date || '',
    cancel_reason: nts.cancel_reason || '',
    admin_notes: nts.admin_notes || '',
    created_at: row.created_at,
  };
}

export default function MyMembershipDashboard({ userId, authName, rank, progressPercent, content }: Props) {
  const navigate = useNavigate();
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<string>('');
  const [upgradeCommMethod, setUpgradeCommMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const tiers: any[] = (content?.membershipTiers || []).filter((t: any) => TIER_ORDER.includes(t.id)).sort((a: any, b: any) => TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id));

  const higherTiers = tiers.filter((t: any) => {
    if (!membership) return true;
    const currentIdx = TIER_ORDER.indexOf(membership.tier_id);
    const tierIdx = TIER_ORDER.indexOf(t.id);
    return tierIdx > currentIdx;
  });

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    void (async () => {
      const { data } = await supabase.from('membership_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setMembership(normalizeMembership(data));
      setLoading(false);
    })();
  }, [userId]);

  const handleUpgrade = async () => {
    if (!userId || !upgradeTier || !upgradeCommMethod) return;
    setUpgrading(true);
    try {
      const t = tiers.find((x: any) => x.id === upgradeTier);
      const body = {
        user_id: userId,
        tier_id: upgradeTier,
        tier_name: t?.name || '',
        tier_price: t?.price || '',
        card_name: membership?.card_name || authName || 'Member',
        card_serial: membership?.card_serial || '',
        member_name: membership?.member_name || authName || '',
        member_email: membership?.member_email || '',
        member_phone: membership?.member_phone || '',
        member_country: membership?.member_country || 'Global',
        profile_photo: membership?.profile_photo || '',
        comm_method: upgradeCommMethod,
      };
      const tierMap: Record<string, string> = { scully: 'basic', gibson: 'premium', milburn: 'vip', upgrade_pending: 'upgrade_pending' };
      const messageData = { card_serial: body.card_serial, comm_method: body.comm_method, tier_price: body.tier_price, tier_name: body.tier_name, tier_id: body.tier_id, profile_photo: body.profile_photo, phone: body.member_phone || '', member_name: body.member_name || '' };
      const { data, error } = await supabase.from('membership_applications').insert({
        user_id: body.user_id, email: body.member_email || '', full_name: body.card_name,
        country: body.member_country || 'Global', tier: tierMap[body.tier_id] || 'basic',
        status: 'pending', message: JSON.stringify(messageData), notes: '',
      }).select('*').single();
      if (error) { showToast(error.message || 'Upgrade failed', 'error'); setUpgrading(false); return; }
      setMembership(normalizeMembership(data));
      setShowUpgradeModal(false);
      showToast('Upgrade request submitted!', 'success');
      const msg = encodeURIComponent(
        `Hello, I'd like to upgrade my membership to ${t?.name}.\n\n` +
        `Name: ${membership?.card_name || authName}\n` +
        `Current Tier: ${membership?.tier_name}\n` +
        `Requested Tier: ${t?.name} (${t?.price})\n` +
        `Membership Number: ${membership?.membership_number || 'N/A'}\n\n` +
        `Looking forward to hearing from the Sanctuary team.`
      );
      setTimeout(() => {
        if (upgradeCommMethod === 'whatsapp') {
          openWhatsApp(msg);
        } else {
          openEmail('Membership Upgrade - ' + (t?.name || ''), msg);
        }
      }, 800);
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    }
    setUpgrading(false);
  };

  const downloadCard = async () => {
    if (!membership) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const bgColors: Record<string, [string, string]> = {
        scully: ['#1a1a2e', '#16213e'],
        gibson: ['#1c1c1c', '#2d2d2d'],
        milburn: ['#1a0a0a', '#2d1515'],
      };
      const c = bgColors[membership.tier_id] || ['#1a1a1a', '#2a2a2a'];
      grad.addColorStop(0, c[0]);
      grad.addColorStop(1, c[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(212,175,55,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 28px serif';
      ctx.fillText('GA', 40, 60);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px monospace';
      ctx.fillText('OFFICIAL SANCTUARY', 40, 78);

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('MEMBER CARD', canvas.width - 40, 50);
      ctx.textAlign = 'left';

      ctx.font = 'bold 24px serif';
      ctx.fillStyle = '#ffffff';
      const name = membership.card_name || authName || 'Member';
      ctx.fillText(name, 160, 240);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(membership.tier_name, 160, 264);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px monospace';
      ctx.fillText('ISSUED ' + new Date(membership.activation_date).getFullYear(), 160, 282);

      if (membership.profile_photo) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = membership.profile_photo;
        await new Promise(r => { img.onload = r; img.onerror = r; });
        ctx.save();
        ctx.beginPath();
        ctx.arc(90, 230, 45, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 45, 185, 90, 90);
        ctx.restore();
        ctx.strokeStyle = 'rgba(212,175,55,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(90, 230, 45, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(90, 230, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', 90, 242);
        ctx.textAlign = 'left';
      }

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px monospace';
      ctx.fillText('SERIAL NUMBER', 40, 400);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(membership.card_serial || membership.membership_number || 'GA-MEMBER', 40, 416);

      const blob = await new Promise<Blob>(r => canvas.toBlob(r!, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GA-Membership-${name.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Membership card downloaded!', 'success');
    } catch {
      showToast('Could not download card. Try again.', 'error');
    }
  };

  const getTierBenefits = (tierId: string) => {
    return tiers.find((t: any) => t.id === tierId)?.benefits || [];
  };

  const getTierStyle = (tierId: string) => {
    const t = tiers.find((x: any) => x.id === tierId);
    return {
      bg_color: t?.bg_color || 'from-neutral-900 via-neutral-950 to-neutral-950',
      border_color: t?.border_color || 'border-neutral-800',
      icon_color: t?.icon_color || 'text-neutral-400',
    };
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></div>;

  // ── No membership ──
  if (!membership) {
    return (
      <div className="space-y-6 text-left">
        <div className="space-y-1 border-b border-neutral-900 pb-4">
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Membership Dashboard</h2>
          <p className="text-xs text-neutral-500 font-mono">Your Sanctuary membership status</p>
        </div>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-12 text-center space-y-4">
          <Crown className="h-10 w-10 text-neutral-700 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-white">You don't have a membership yet.</h3>
          <p className="text-xs text-neutral-500">Explore the membership tiers and apply to become an official member.</p>
          <button onClick={() => navigate('/membership')}
            className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all"
          >Explore Membership</button>
        </div>
      </div>
    );
  }

  // ── Pending ──
  if (membership.status === 'pending' || membership.status === 'upgrade_pending') {
    const style = getTierStyle(membership.tier_id);
    const isUpgrade = membership.status === 'upgrade_pending';
    return (
      <div className="space-y-6 text-left">
        <div className="space-y-1 border-b border-neutral-900 pb-4">
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Membership Dashboard</h2>
          <p className="text-xs text-neutral-500 font-mono">Your Sanctuary membership status</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-neutral-950 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <h3 className="font-bold text-white">{isUpgrade ? 'Upgrade Request Submitted' : 'Membership Request Submitted'}</h3>
              <p className="text-xs text-neutral-500">Submitted {new Date(membership.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-mono">
            <Clock className="h-3 w-3" /> {isUpgrade ? 'Upgrade Pending' : 'Pending Review'}
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Your membership request has been submitted successfully. Please continue your conversation with the administrator through your selected communication method while your application is being reviewed.
          </p>

          {/* Membership Card Preview */}
          <div className={`relative w-full max-w-[340px] mx-auto aspect-[1.58/1] rounded-2xl border bg-gradient-to-br ${style.bg_color} ${style.border_color} p-5 flex flex-col justify-between overflow-hidden shadow-xl`}>
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gold-500/5 blur-[50px] pointer-events-none" />
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-base font-bold tracking-widest text-white">GA</span>
                <div className="h-3 w-[1px] bg-neutral-800" />
                <div className="flex flex-col">
                  <span className="font-serif text-[9px] font-bold tracking-wider text-neutral-300">GILLIAN ANDERSON</span>
                  <span className="font-mono text-[5px] tracking-[0.2em] text-gold-500">OFFICIAL SANCTUARY</span>
                </div>
              </div>
              <span className="font-mono text-[8px] font-bold text-neutral-500 tracking-wider">MEMBER CARD</span>
            </div>
            <div className="flex gap-4 items-center z-10 pt-4">
              <div className="h-14 w-14 rounded-full border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0">
                {membership.profile_photo ? <img src={membership.profile_photo} alt="" className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-neutral-700" />}
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[8px] font-mono text-neutral-500 uppercase">OFFICIAL MEMBER</span>
                <h5 className="font-serif text-sm font-bold text-white tracking-wide truncate max-w-[180px]">{membership.card_name || 'Member'}</h5>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-mono font-bold uppercase ${style.icon_color}`}>{membership.tier_name}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-800" />
                  <span className="text-[8px] font-mono text-neutral-400">PENDING</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-neutral-900 pt-3 z-10">
              <div className="text-left font-mono text-[7px] text-neutral-500">
                <span className="block">SERIAL NUMBER</span>
                <span className="font-semibold text-neutral-300">{membership.card_serial}</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-end gap-0.5 h-4 opacity-70">
                  {[...Array(8)].map((_, i) => <div key={i} className={`w-0.5 bg-neutral-300 ${i % 3 === 1 ? 'h-2/3' : i % 3 === 2 ? 'h-3/4' : 'h-full'}`} />)}
                </div>
                <span className="font-mono text-[5px] text-neutral-500 mt-0.5">SECURE-BAR</span>
              </div>
            </div>
          </div>

          <div className="border border-neutral-900 rounded-xl bg-neutral-950/60 p-4 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Tier</span><span className="text-gold-500 font-bold">{membership.tier_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Card Name</span><span className="text-white">{membership.card_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Serial</span><span className="text-white font-mono text-[10px]">{membership.card_serial}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Communication</span><span className="text-white capitalize">{membership.comm_method}</span></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active ──
  if (membership.status === 'active') {
    const style = getTierStyle(membership.tier_id);
    return (
      <div className="space-y-6 text-left">
        <div className="space-y-1 border-b border-neutral-900 pb-4">
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Membership Dashboard</h2>
          <p className="text-xs text-neutral-500 font-mono">Your Sanctuary membership status</p>
        </div>

        {/* Official Digital Membership Card */}
        <div className={`relative w-full max-w-[380px] mx-auto aspect-[1.58/1] rounded-2xl border-2 bg-gradient-to-br ${style.bg_color} ${style.border_color} p-5 md:p-6 flex flex-col justify-between overflow-hidden shadow-2xl`}>
          <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/[0.03] via-transparent to-gold-500/[0.05] pointer-events-none" />
          <div className="absolute -inset-y-12 -inset-x-32 bg-gradient-to-r from-transparent via-gold-500/[0.02] to-transparent rotate-12 pointer-events-none animate-pulse" />
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-lg font-bold tracking-widest text-white">GA</span>
              <div className="h-4 w-[1px] bg-neutral-800" />
              <div className="flex flex-col">
                <span className="font-serif text-[10px] font-bold tracking-wider text-neutral-300">GILLIAN ANDERSON</span>
                <span className="font-mono text-[6px] tracking-[0.2em] text-gold-500">OFFICIAL SANCTUARY</span>
              </div>
            </div>
            <Crown className="h-5 w-5 text-gold-500" />
          </div>
          <div className="flex gap-4 items-center z-10 pt-4">
            <div className="h-16 w-16 rounded-full border-2 border-gold-500/40 bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0 shadow-lg shadow-gold-500/10">
              {membership.profile_photo ? <img src={membership.profile_photo} alt="" className="h-full w-full object-cover" /> : <User className="h-7 w-7 text-neutral-700" />}
            </div>
            <div className="space-y-1 text-left">
              <span className="text-[8px] font-mono text-neutral-500 uppercase">OFFICIAL MEMBER</span>
              <h5 className="font-serif text-base font-bold text-white tracking-wide truncate max-w-[200px]">{membership.card_name || 'Member'}</h5>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] font-mono font-bold uppercase ${style.icon_color}`}>{membership.tier_name}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-800" />
                <span className="text-[8px] font-mono text-green-500">ACTIVE</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-neutral-900/60 pt-3 z-10 text-left">
            <div><span className="text-[7px] font-mono text-neutral-500 uppercase block">Membership #</span><span className="text-[10px] font-mono font-bold text-neutral-200">{membership.membership_number || 'N/A'}</span></div>
            <div><span className="text-[7px] font-mono text-neutral-500 uppercase block">Serial</span><span className="text-[10px] font-mono font-bold text-neutral-200">{membership.card_serial}</span></div>
            <div><span className="text-[7px] font-mono text-neutral-500 uppercase block">Activated</span><span className="text-[10px] font-mono font-bold text-neutral-200">{membership.activation_date ? new Date(membership.activation_date).toLocaleDateString() : 'N/A'}</span></div>
            <div><span className="text-[7px] font-mono text-neutral-500 uppercase block">Expires</span><span className="text-[10px] font-mono font-bold text-neutral-200">{membership.expiration_date ? new Date(membership.expiration_date).toLocaleDateString() : 'Never'}</span></div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-500 text-[10px] font-mono">
            <CheckCircle2 className="h-3 w-3" /> Active
          </div>
        </div>

        {/* Membership Benefits */}
        <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-3">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Crown className="h-3.5 w-3.5 text-gold-500" /> Your Benefits
          </h3>
          <ul className="space-y-2">
            {getTierBenefits(membership.tier_id).map((b: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-gold-500 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadCard}
            className="border border-neutral-900 hover:border-gold-500/40 text-neutral-400 hover:text-white font-bold py-2.5 px-5 rounded text-xs transition-all flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 text-gold-500" /> Download Membership Card
          </button>
          {higherTiers.length > 0 && (
            <button onClick={() => { setUpgradeTier(''); setUpgradeCommMethod(null); setShowUpgradeModal(true); }}
              className="border border-gold-500/40 hover:bg-gold-500/10 text-gold-500 font-bold py-2.5 px-5 rounded text-xs transition-all flex items-center gap-1.5">
              <ArrowUp className="h-3.5 w-3.5" /> Upgrade Membership
            </button>
          )}
        </div>

        {/* Upgrade Modal */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            >
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0a0a0c] p-6 space-y-5 shadow-2xl"
              >
                <div className="text-center space-y-1">
                  <h3 className="font-serif text-lg font-bold text-white">Upgrade Membership</h3>
                  <p className="text-xs text-neutral-500">Choose your new tier. You will be upgraded from <span className="text-gold-500">{membership.tier_name}</span>.</p>
                </div>
                <div className="space-y-3">
                  {higherTiers.map((t: any) => (
                    <button key={t.id} onClick={() => setUpgradeTier(t.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left ${upgradeTier === t.id ? 'border-gold-500/50 bg-gold-500/5' : 'border-neutral-900 hover:border-neutral-800 bg-neutral-950'}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{t.name}</p>
                        <p className="text-[10px] text-neutral-500">{t.price}</p>
                      </div>
                      {upgradeTier === t.id && <Check className="h-5 w-5 text-gold-500" />}
                    </button>
                  ))}
                </div>
                {upgradeTier && (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400 text-center">How would you like to send your upgrade request?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setUpgradeCommMethod('whatsapp')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${upgradeCommMethod === 'whatsapp' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-900 hover:border-neutral-800 bg-neutral-950'}`}
                      >
                        <MessageCircle className={`h-5 w-5 ${upgradeCommMethod === 'whatsapp' ? 'text-emerald-500' : 'text-neutral-500'}`} />
                        <span className="text-[10px] font-mono text-neutral-400">WhatsApp</span>
                      </button>
                      <button onClick={() => setUpgradeCommMethod('email')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${upgradeCommMethod === 'email' ? 'border-gold-500/50 bg-gold-500/5' : 'border-neutral-900 hover:border-neutral-800 bg-neutral-950'}`}
                      >
                        <Mail className={`h-5 w-5 ${upgradeCommMethod === 'email' ? 'text-gold-500' : 'text-neutral-500'}`} />
                        <span className="text-[10px] font-mono text-neutral-400">Email</span>
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 py-2.5 rounded border border-neutral-900 text-neutral-400 text-xs font-mono font-bold uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                  <button onClick={handleUpgrade} disabled={!upgradeTier || !upgradeCommMethod || upgrading}
                    className="flex-1 py-2.5 rounded bg-gold-500 text-neutral-950 text-xs font-mono font-bold uppercase tracking-widest hover:bg-gold-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {upgrading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</> : <><ArrowUp className="h-3.5 w-3.5" /> Submit Upgrade</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-lg border border-gold-500 bg-[#0a0a0c] px-4 py-3 shadow-2xl shadow-gold-500/10 min-w-[300px]"
            >
              <div className="h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
              <div className="flex-1 text-xs text-left">
                <p className="font-mono text-gold-500 uppercase tracking-widest font-bold text-[9px]">SYSTEM MSG</p>
                <p className="text-white mt-0.5 leading-tight">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Expired ──
  if (membership.status === 'expired') {
    return (
      <div className="space-y-6 text-left">
        <div className="space-y-1 border-b border-neutral-900 pb-4">
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Membership Dashboard</h2>
          <p className="text-xs text-neutral-500 font-mono">Your Sanctuary membership status</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-neutral-950 p-6 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-mono"><XCircle className="h-3 w-3" /> Expired</div>
          <p className="text-xs text-neutral-400">Your membership has expired. Renew to regain access to benefits.</p>
          <button className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all">Renew Membership</button>
        </div>
      </div>
    );
  }

  // ── Cancelled ──
  if (membership.status === 'cancelled') {
    return (
      <div className="space-y-6 text-left">
        <div className="space-y-1 border-b border-neutral-900 pb-4">
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Membership Dashboard</h2>
          <p className="text-xs text-neutral-500 font-mono">Your Sanctuary membership status</p>
        </div>
        <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-6 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-neutral-500 mx-auto" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-500 text-[10px] font-mono"><XCircle className="h-3 w-3" /> Cancelled</div>
          {membership.cancel_reason && <p className="text-xs text-neutral-500">Reason: {membership.cancel_reason}</p>}
          <button className="border border-neutral-900 hover:border-gold-500/40 text-neutral-400 hover:text-white font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all">Reapply</button>
        </div>
      </div>
    );
  }

  return null;
}
