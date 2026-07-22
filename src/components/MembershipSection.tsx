import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, IdCard, Check, Upload, User, ShieldCheck, Download, Copy, MessageCircle, Mail, Loader2, ArrowUp, Clock } from 'lucide-react';
import { openWhatsApp, openEmail } from '../utils/contactSettings';
import { useAuth } from '../utils/AuthContext';
import { useGlobalState } from '../utils/StateContext';
import { supabase } from '../utils/supabase';

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

export default function MembershipSection() {
  const { user, profile } = useAuth();
  const { content } = useGlobalState();

  const tiers = (content?.membershipTiers || []).filter((t: any) => TIER_ORDER.includes(t.id)).sort((a: any, b: any) => TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id));
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [cardName, setCardName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commMethod, setCommMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [showCommModal, setShowCommModal] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [myMembership, setMyMembership] = useState<MembershipData | null>(null);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [photoError, setPhotoError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<string>('');
  const [upgradeCommMethod, setUpgradeCommMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (tiers.length > 0 && !selectedTier) setSelectedTier(tiers[0].id); }, [tiers]);
  useEffect(() => { if (profile?.name) setCardName(profile.name); }, [profile]);

  useEffect(() => {
    if (!user) { setCheckingMembership(false); return; }
    void (async () => {
      const { data } = await supabase.from('membership_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setMyMembership(normalizeMembership(data));
      setCheckingMembership(false);
    })();
  }, [user]);

  const activeTier = tiers.find((t: any) => t.id === selectedTier) || tiers[0] || null;

  const generateSerial = (tierName: string) => {
    const cleanTier = tierName.toUpperCase().replace(/\s+/g, '').substring(0, 3);
    return `GA-${cleanTier}-${new Date().getFullYear()}-${(cardName || profile?.name || 'GUEST').replace(/\s+/g, '').substring(0, 4).toUpperCase()}`;
  };

  const cardSerial = activeTier ? generateSerial(activeTier.name) : '';

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => { if (event.target?.result) { setUserPhoto(event.target.result as string); setPhotoError(''); } };
      reader.readAsDataURL(file);
    }
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; processFile(file); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) processFile(file); };

  const handleRegisterClick = () => {
    if (!user) { showToast('Please sign in to register for a membership.', 'error'); return; }
    if (!activeTier) { showToast('Please select a membership tier.', 'error'); return; }
    if (!cardName.trim()) { showToast('Please enter your member name.', 'error'); return; }
    if (!userPhoto) { setPhotoError('A profile photo is required to continue.'); return; }
    setShowCommModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!user || !activeTier || !commMethod) return;
    setSubmitting(true);
    try {
      const body = {
        user_id: user.id,
        tier_id: activeTier.id,
        tier_name: activeTier.name,
        tier_price: activeTier.price,
        card_name: cardName || profile?.name || 'Member',
        card_serial: cardSerial,
        member_name: profile?.name || user.email || '',
        member_email: profile?.email || user.email || '',
        member_phone: '',
        member_country: (profile as any)?.country || 'Global',
        profile_photo: userPhoto || profile?.avatar_text || '',
        comm_method: commMethod,
      };
      const tierMap: Record<string, string> = { scully: 'basic', gibson: 'premium', milburn: 'vip', upgrade_pending: 'upgrade_pending' };
      const messageData = { card_serial: body.card_serial, comm_method: body.comm_method, tier_price: body.tier_price, tier_name: body.tier_name, tier_id: body.tier_id, profile_photo: body.profile_photo, phone: body.member_phone || '', member_name: body.member_name || '' };
      const { data, error } = await supabase.from('membership_applications').insert({
        user_id: body.user_id, email: body.member_email || '', full_name: body.card_name,
        country: body.member_country || 'Global', tier: tierMap[body.tier_id] || 'basic',
        status: 'pending', message: JSON.stringify(messageData), notes: '',
      }).select('*').single();
      if (error) { showToast(error.message || 'Submission failed', 'error'); setSubmitting(false); return; }

      setMyMembership(normalizeMembership(data));
      setShowCommModal(false);
      setSubmitDone(true);
      showToast('Membership request submitted successfully!', 'success');

      const msg = encodeURIComponent(
        `Hello, I'd like to apply for the ${activeTier.name} membership.\n\n` +
        `Name: ${cardName || profile?.name}\n` +
        `Email: ${profile?.email || user.email}\n` +
        `Selected Tier: ${activeTier.name} (${activeTier.price})\n` +
        `Card Serial: ${cardSerial}\n\n` +
        `Looking forward to hearing from the Sanctuary team.`
      );
      setTimeout(() => {
        if (commMethod === 'whatsapp') {
          openWhatsApp(msg);
        } else {
          openEmail('Membership Application - ' + activeTier.name, msg);
        }
      }, 800);
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    }
    setSubmitting(false);
  };

  const handleUpgrade = async () => {
    if (!user || !upgradeTier || !upgradeCommMethod) return;
    setUpgrading(true);
    try {
      const t = tiers.find((x: any) => x.id === upgradeTier);
      const body = {
        user_id: user.id,
        tier_id: upgradeTier,
        tier_name: t?.name || '',
        tier_price: t?.price || '',
        card_name: myMembership?.card_name || profile?.name || 'Member',
        card_serial: myMembership?.card_serial || generateSerial(t?.name || ''),
        member_name: profile?.name || user.email || '',
        member_email: profile?.email || user.email || '',
        member_phone: '',
        member_country: (profile as any)?.country || 'Global',
        profile_photo: myMembership?.profile_photo || profile?.avatar_text || '',
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
      setMyMembership(normalizeMembership(data));
      setShowUpgradeModal(false);
      showToast('Upgrade request submitted!', 'success');
      const msg = encodeURIComponent(
        `Hello, I'd like to upgrade my membership to ${t?.name}.\n\n` +
        `Name: ${myMembership?.card_name || profile?.name}\n` +
        `Current Tier: ${myMembership?.tier_name}\n` +
        `Requested Tier: ${t?.name} (${t?.price})\n` +
        `Membership Number: ${myMembership?.membership_number || 'N/A'}\n\n` +
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
    if (!activeTier) return;
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
      const c = bgColors[activeTier.id] || ['#1a1a1a', '#2a2a2a'];
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
      const name = cardName || profile?.name || 'Member';
      ctx.fillText(name, 160, 240);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(activeTier.name, 160, 264);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px monospace';
      ctx.fillText('ISSUED ' + new Date().getFullYear(), 160, 282);

      if (userPhoto) {
        const img = new Image();
        img.src = userPhoto;
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
      ctx.fillText(cardSerial || 'GA-MEMBER', 40, 416);

      const blob = await new Promise<Blob>(r => canvas.toBlob(r!, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GA-Membership-${name.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Membership card downloaded!', 'success');
    } catch {
      showToast('Could not download. Try again.', 'error');
    }
  };

  const higherTiers = tiers.filter((t: any) => {
    if (!myMembership) return true;
    const currentIdx = TIER_ORDER.indexOf(myMembership.tier_id);
    const tierIdx = TIER_ORDER.indexOf(t.id);
    return tierIdx > currentIdx;
  });

  // ── Loading ──
  if (checkingMembership) {
    return <section className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[400px] flex items-center justify-center"><Loader2 className="h-6 w-6 text-gold-500 animate-spin" /></section>;
  }

  // ── Pending after submission ──
  if (submitDone && myMembership?.status === 'pending') {
    return (
      <section id="membership-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <ShieldCheck className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">Application Under Review</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Your membership request has been submitted successfully. Please continue your conversation with the administrator through your selected communication method while your application is being reviewed.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs font-mono">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </div>
          <div className="border border-neutral-900 rounded-xl bg-neutral-950 p-5 space-y-3 max-w-sm mx-auto text-left">
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Tier</span><span className="text-gold-500 font-bold">{myMembership.tier_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Card Name</span><span className="text-white">{myMembership.card_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Serial</span><span className="text-white font-mono text-[10px]">{myMembership.card_serial}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Submitted</span><span className="text-white">{new Date(myMembership.created_at).toLocaleDateString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Communication</span><span className="text-white capitalize">{myMembership.comm_method}</span></div>
          </div>
          <button onClick={() => window.location.hash = '#PORTAL'} className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all">Go to Membership Dashboard</button>
        </div>
      </section>
    );
  }

  // ── Active member view with upgrade option ──
  if (user && myMembership?.status === 'active') {
    const tierStyle = (id: string) => {
      const t = tiers.find((x: any) => x.id === id);
      return { bg: t?.bg_color || 'from-neutral-900 via-neutral-950 to-neutral-950', border: t?.border_color || 'border-neutral-800', icon: t?.icon_color || 'text-neutral-400' };
    };
    const ts = tierStyle(myMembership.tier_id);
    return (
      <section id="membership-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-3xl space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
              <Crown className="h-3.5 w-3.5" /> ACTIVE MEMBERSHIP
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
              Welcome, <span className="text-gold-500">{myMembership.card_name}</span>
            </h2>
            <p className="text-xs text-neutral-400 max-w-lg mx-auto font-mono leading-relaxed">
              You are an official Sanctuary member. Present your digital card for exclusive access.
            </p>
          </div>

          {/* Digital Membership Card */}
          <div className={`relative w-full max-w-[420px] mx-auto aspect-[1.58/1] rounded-2xl border bg-gradient-to-br ${ts.bg} ${ts.border} p-6 flex flex-col justify-between overflow-hidden shadow-2xl`}>
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/5 blur-[60px] pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-gold-500/5 blur-[60px] pointer-events-none" />
            
            {/* Top section */}
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg font-bold tracking-widest text-white">GA</span>
                <div className="h-5 w-px bg-neutral-800" />
                <div className="flex flex-col">
                  <span className="font-serif text-[10px] font-bold tracking-wider text-neutral-300">GILLIAN ANDERSON</span>
                  <span className="font-mono text-[6px] tracking-[0.2em] text-gold-500">OFFICIAL SANCTUARY</span>
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold text-neutral-500 tracking-wider">MEMBER CARD</span>
            </div>

            {/* Middle section with photo */}
            <div className="flex gap-4 items-center z-10 pt-2">
              <div className="h-16 w-16 rounded-full border-2 border-gold-500/30 bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                {myMembership.profile_photo ? (
                  <img src={myMembership.profile_photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-neutral-700" />
                )}
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-mono text-neutral-500 uppercase">OFFICIAL MEMBER</span>
                <h5 className="font-serif text-base font-bold text-white tracking-wide truncate max-w-[220px]">{myMembership.card_name}</h5>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase ${ts.icon}`}>{myMembership.tier_name}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-800" />
                  <span className="text-[9px] font-mono text-neutral-400">#{myMembership.membership_number?.split('-').pop() || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex justify-between items-end border-t border-neutral-900/60 pt-3 z-10">
              <div className="text-left font-mono text-[8px] text-neutral-500 space-y-0.5">
                <span className="block">MEMBER SINCE</span>
                <span className="font-semibold text-neutral-300 text-[10px]">{myMembership.activation_date ? new Date(myMembership.activation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
              </div>
              <div className="text-right font-mono text-[8px] text-neutral-500 space-y-0.5">
                <span className="block">EXPIRES</span>
                <span className={`font-semibold text-[10px] ${myMembership.expiration_date && new Date(myMembership.expiration_date) < new Date() ? 'text-red-400' : 'text-neutral-300'}`}>
                  {myMembership.expiration_date ? new Date(myMembership.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Lifetime'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-end gap-0.5 h-3 opacity-60">
                  {[...Array(6)].map((_, i) => <div key={i} className={`w-0.5 bg-neutral-300 ${i % 3 === 1 ? 'h-2/3' : i % 3 === 2 ? 'h-3/4' : 'h-full'}`} />)}
                </div>
                <span className="font-mono text-[5px] text-neutral-500 mt-0.5">SECURE-BAR</span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {[
              { label: 'Membership #', value: myMembership.membership_number || 'N/A', mono: true },
              { label: 'Card Serial', value: myMembership.card_serial || 'N/A', mono: true },
              { label: 'Activated', value: myMembership.activation_date ? new Date(myMembership.activation_date).toLocaleDateString() : 'N/A', mono: false },
              { label: 'Expires', value: myMembership.expiration_date ? new Date(myMembership.expiration_date).toLocaleDateString() : 'Lifetime', mono: false },
            ].map(d => (
              <div key={d.label} className="rounded-lg border border-neutral-900 bg-neutral-950/40 p-3 text-center space-y-0.5">
                <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">{d.label}</p>
                <p className={`text-[10px] text-white font-semibold ${d.mono ? 'font-mono' : ''} truncate`}>{d.value}</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          {tiers.find((t: any) => t.id === myMembership.tier_id)?.benefits?.length > 0 && (
            <div className="max-w-lg mx-auto w-full space-y-3">
              <h4 className="text-[10px] font-mono text-gold-500 uppercase tracking-widest font-bold text-center">Your {myMembership.tier_name} Benefits</h4>
              <div className="grid gap-2">
                {tiers.find((t: any) => t.id === myMembership.tier_id).benefits.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-300 bg-neutral-950/20 border border-neutral-900 rounded-lg px-3.5 py-2.5">
                    <Check className="h-3.5 w-3.5 text-gold-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => window.location.hash = '#PORTAL'} className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all">
              Membership Dashboard
            </button>
            <button onClick={downloadCard} className="border border-gold-500/40 hover:bg-gold-500/10 text-gold-500 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download Card
            </button>
            {higherTiers.length > 0 && (
              <button onClick={() => { setUpgradeTier(''); setUpgradeCommMethod(null); setShowUpgradeModal(true); }} className="border border-gold-500/40 hover:bg-gold-500/10 text-gold-500 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all flex items-center gap-1.5">
                <ArrowUp className="h-3.5 w-3.5" /> Upgrade
              </button>
            )}
          </div>
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
                  <p className="text-xs text-neutral-500">Choose your new tier. You will be upgraded from <span className="text-gold-500">{myMembership.tier_name}</span>.</p>
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
      </section>
    );
  }

  // ── Pending (non-submit-done) ──
  if (user && myMembership?.status === 'pending' && !submitDone) {
    return (
      <section id="membership-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <ShieldCheck className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">Application Under Review</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Your membership request has been submitted successfully. Please continue your conversation with the administrator through your selected communication method while your application is being reviewed.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs font-mono">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </div>
          <div className="border border-neutral-900 rounded-xl bg-neutral-950 p-5 space-y-3 max-w-sm mx-auto text-left">
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Tier</span><span className="text-gold-500 font-bold">{myMembership.tier_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Card Name</span><span className="text-white">{myMembership.card_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Serial</span><span className="text-white font-mono text-[10px]">{myMembership.card_serial}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Submitted</span><span className="text-white">{new Date(myMembership.created_at).toLocaleDateString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-neutral-500">Communication</span><span className="text-white capitalize">{myMembership.comm_method}</span></div>
          </div>
          <button onClick={() => window.location.hash = '#PORTAL'} className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all">Go to Membership Dashboard</button>
        </div>
      </section>
    );
  }

  // ── Upgrade Pending ──
  if (user && myMembership?.status === 'upgrade_pending') {
    return (
      <section id="membership-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <ArrowUp className="h-12 w-12 text-blue-500 mx-auto" />
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">Upgrade Under Review</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Your upgrade request has been submitted. Please continue your conversation with the administrator through your selected communication method while your upgrade is being processed.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-500 text-xs font-mono">
            <Clock className="h-3.5 w-3.5" /> Upgrade Pending
          </div>
          <button onClick={() => window.location.hash = '#PORTAL'} className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all">Go to Membership Dashboard</button>
        </div>
      </section>
    );
  }

  // ── Main registration UI ──
  return (
    <section id="membership-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute left-10 top-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Page Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Crown className="h-3.5 w-3.5" /> OFFICIAL MEMBERSHIP TIERS
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Sanctuary <span className="text-gold-500">Membership</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Choose your tier, configure your digital credentials, and submit your membership request for admin approval.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {tiers.map((tier: any) => {
            const isSelected = tier.id === selectedTier;
            return (
              <div key={tier.id} onClick={() => setSelectedTier(tier.id)}
                className={`p-6 rounded-xl border flex flex-col justify-between transition-all cursor-pointer h-full relative overflow-hidden group ${isSelected ? `bg-gradient-to-br ${tier.bg_color} ${tier.border_color} shadow-lg scale-[1.01]` : 'bg-neutral-950/40 border-neutral-900 hover:border-neutral-800'}`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono border border-neutral-800 px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 uppercase">
                      Tier {tier.sort_order}
                    </span>
                    <Crown className={`h-4.5 w-4.5 ${isSelected ? tier.icon_color : 'text-neutral-700'}`} />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-serif text-lg font-bold tracking-wide ${isSelected ? tier.icon_color : 'text-white'}`}>{tier.name}</h3>
                    <p className="text-[11px] font-mono text-gold-500 font-semibold">{tier.price}</p>
                  </div>
                  <ul className="space-y-2 pt-4 border-t border-neutral-900/40">
                    {(tier.benefits || []).map((b: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                        <Check className="h-3.5 w-3.5 text-gold-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6 mt-auto">
                  <button className={`w-full py-2 rounded text-[10px] font-mono tracking-widest uppercase font-bold transition-colors ${isSelected ? 'bg-gold-500 text-neutral-950 hover:bg-gold-400' : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'}`}>
                    {isSelected ? 'SELECTED' : 'SELECT TIER'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Configurator */}
        <div className="grid gap-8 lg:grid-cols-12 items-center bg-neutral-950/60 border border-neutral-900 rounded-xl p-8 shadow-xl text-left">
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <h3 className="font-serif text-lg font-extrabold text-white flex items-center gap-2">
                <IdCard className="h-5 w-5 text-gold-500" /> CARD CONFIGURATOR
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">Personalize your membership credentials.</p>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">MEMBER NAME <span className="text-red-500">*</span></label>
                <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Your name on card" maxLength={30}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3.5 py-2.5 text-white outline-none focus:border-gold-500/40" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">PROFILE PHOTO <span className="text-red-500">*</span></label>
                <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 bg-neutral-900/40 ${isDragOver ? 'border-gold-500 bg-gold-500/5' : photoError ? 'border-red-500/50' : 'border-neutral-800 hover:border-neutral-700'}`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  {userPhoto ? (
                    <div className="flex items-center gap-2.5">
                      <img src={userPhoto} alt="Preview" className="h-8 w-8 rounded-full object-cover border border-neutral-800" />
                      <span className="text-[10px] font-mono text-emerald-400">PHOTO MOUNTED</span>
                    </div>
                  ) : (
                    <><Upload className="h-4.5 w-4.5 text-neutral-500 mb-1" /><p className="font-mono text-[9px] text-neutral-400">DRAG & DROP OR BROWSE PHOTO</p></>
                  )}
                </div>
                {photoError && <p className="text-[10px] text-red-500 font-mono">{photoError}</p>}
              </div>
              <button onClick={handleRegisterClick} disabled={!activeTier}
                className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" /> REGISTER DIGITAL CARD
              </button>
            </div>
          </div>

          {/* Live Card Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-5">
            <h4 className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">LIVE CREDENTIALS PREVIEW</h4>
            {activeTier && (
              <div className={`relative w-full max-w-[380px] aspect-[1.58/1] rounded-2xl border bg-gradient-to-br ${activeTier.bg_color} ${activeTier.border_color} p-5 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 group/card`}>
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
                    {userPhoto ? <img src={userPhoto} alt="Face" className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-neutral-700" />}
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[8px] font-mono text-neutral-500 uppercase">OFFICIAL MEMBER</span>
                    <h5 className="font-serif text-sm font-bold text-white tracking-wide truncate max-w-[180px]">{cardName || 'Member'}</h5>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-mono font-bold uppercase ${activeTier.icon_color}`}>{activeTier.name}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-800" />
                      <span className="text-[8px] font-mono text-neutral-400">ISSUED {new Date().getFullYear()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-end border-t border-neutral-900 pt-3 z-10">
                  <div className="text-left font-mono text-[7px] text-neutral-500">
                    <span className="block">SERIAL NUMBER</span>
                    <span className="font-semibold text-neutral-300 flex items-center gap-1">
                      {cardSerial}
                      <button onClick={() => { navigator.clipboard.writeText(cardSerial); setCopiedSerial(true); setTimeout(() => setCopiedSerial(false), 2000); }} className="hover:text-gold-500 transition-colors"><Copy className="h-2.5 w-2.5" /></button>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-end gap-0.5 h-4 opacity-70">
                      {[...Array(8)].map((_, i) => <div key={i} className={`w-0.5 bg-neutral-300 ${i % 3 === 1 ? 'h-2/3' : i % 3 === 2 ? 'h-3/4' : 'h-full'}`} />)}
                    </div>
                    <span className="font-mono text-[5px] text-neutral-500 mt-0.5">SECURE-BAR</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={downloadCard}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-900 rounded-lg text-xs font-mono font-semibold transition-all">
                <Download className="h-3.5 w-3.5 text-gold-500" /> DOWNLOAD CARD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Method Modal */}
      <AnimatePresence>
        {showCommModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0a0a0c] p-6 space-y-5 shadow-2xl"
            >
              <div className="text-center space-y-1">
                <h3 className="font-serif text-lg font-bold text-white">Choose Communication Method</h3>
                <p className="text-xs text-neutral-500">How would you like to send your membership request?</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => setCommMethod('whatsapp')}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${commMethod === 'whatsapp' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-900 hover:border-neutral-800 bg-neutral-950'}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${commMethod === 'whatsapp' ? 'bg-emerald-500 text-white' : 'bg-neutral-900 text-neutral-400'}`}>
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div><p className="text-sm font-bold text-white">WhatsApp</p><p className="text-[10px] text-neutral-500">Instant messaging via WhatsApp</p></div>
                  {commMethod === 'whatsapp' && <Check className="h-5 w-5 text-emerald-500 ml-auto" />}
                </button>
                <button onClick={() => setCommMethod('email')}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${commMethod === 'email' ? 'border-gold-500/50 bg-gold-500/5' : 'border-neutral-900 hover:border-neutral-800 bg-neutral-950'}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${commMethod === 'email' ? 'bg-gold-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400'}`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <div><p className="text-sm font-bold text-white">Email</p><p className="text-[10px] text-neutral-500">Send via your default email app</p></div>
                  {commMethod === 'email' && <Check className="h-5 w-5 text-gold-500 ml-auto" />}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCommModal(false)}
                  className="flex-1 py-2.5 rounded border border-neutral-900 text-neutral-400 text-xs font-mono font-bold uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                <button onClick={handleSubmitRequest} disabled={!commMethod || submitting}
                  className="flex-1 py-2.5 rounded bg-gold-500 text-neutral-950 text-xs font-mono font-bold uppercase tracking-widest hover:bg-gold-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</> : <><ShieldCheck className="h-3.5 w-3.5" /> Submit Membership Request</>}
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
    </section>
  );
}
