import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, IdCard, Check, Upload, User, ShieldCheck, Download, Copy, MessageCircle, Mail, Loader2, ArrowUp, Clock } from 'lucide-react';
import { openWhatsApp, openEmail } from '../utils/contactSettings';
import { useAuth } from '../utils/AuthContext';
import { useGlobalState } from '../utils/StateContext';
import { supabase } from '../utils/supabase';
import { createNotification, notifyAdmins } from '../utils/notifications';
import { logger } from '../utils/logger';
import type { MembershipTier } from '../types';

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

function normalizeMembership(row: Record<string, unknown>): MembershipData | null {
  if (!row) return null;
  let msg: Record<string, unknown> = {};
  try { msg = typeof row.message === 'string' ? JSON.parse(row.message) : ((row.message as Record<string, unknown>) || {}); } catch {}
  let nts: Record<string, unknown> = {};
  try { nts = typeof row.notes === 'string' ? JSON.parse(row.notes) : ((row.notes as Record<string, unknown>) || {}); } catch {}
  return {
    id: row.id as string, user_id: row.user_id as string,
    status: (row.status === 'suspended' ? 'expired' : row.status) as string,
    tier_id: (msg.tier_id || row.tier) as string,
    tier_name: (msg.tier_name || row.tier) as string,
    tier_price: (msg.tier_price || msg.price || '') as string,
    card_name: (row.full_name || msg.card_name || row.card_name || '') as string,
    card_serial: (msg.card_serial || '') as string,
    member_name: (msg.member_name || row.full_name || '') as string,
    member_email: (row.email || '') as string,
    member_phone: (msg.phone || '') as string,
    member_country: (row.country || '') as string,
    profile_photo: (msg.profile_photo || '') as string,
    comm_method: (msg.comm_method || '') as string,
    membership_number: (nts.membership_number || '') as string,
    activation_date: (row.reviewed_at || '') as string,
    expiration_date: (nts.expiration_date || '') as string,
    cancel_reason: (nts.cancel_reason || '') as string,
    admin_notes: (nts.admin_notes || '') as string,
    created_at: row.created_at as string,
  };
}

export default function MembershipSection() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { content } = useGlobalState();

  const tiers: MembershipTier[] = (content?.membershipTiers || []).filter((t) => TIER_ORDER.includes(t.id)).sort((a, b) => TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id));
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [cardName, setCardName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
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

  // Step indicator: 1 = tier selected, 2 = name + photo filled, 3 = comm method chosen
  const applicationStep = !selectedTier ? 1 : (!cardName.trim() || !userPhoto) ? 2 : !commMethod ? 3 : 4;
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (tiers.length > 0 && !selectedTier) setSelectedTier(tiers[0].id); }, [tiers]);
  useEffect(() => { if (profile?.name) setCardName(profile.name); }, [profile]);

  useEffect(() => {
    if (!user) { setCheckingMembership(false); return; }
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase.from('membership_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error) logger.warn('membership_applications query error:', error.message);
        if (!cancelled) {
          setMyMembership(normalizeMembership(data));
          setCheckingMembership(false);
        }
      } catch (e) {
        logger.error('membership_applications fetch failed:', e);
        if (!cancelled) setCheckingMembership(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const activeTier = tiers.find((t) => t.id === selectedTier) || tiers[0] || null;

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
        member_phone: memberPhone || '',
        member_country: (profile as unknown as Record<string, unknown>)?.country || 'Global',
        profile_photo: userPhoto || profile?.avatar_text || '',
        comm_method: commMethod,
      };
      const tierMap: Record<string, string> = { scully: 'basic', gibson: 'premium', milburn: 'vip', upgrade_pending: 'upgrade_pending' };
      const messageData = { card_serial: body.card_serial, comm_method: body.comm_method, tier_price: body.tier_price, tier_name: body.tier_name, tier_id: body.tier_id, profile_photo: body.profile_photo, phone: body.member_phone || '', member_name: body.member_name || '' };
      const { data: existing } = await supabase.from('membership_applications')
        .select('id').eq('user_id', user.id).in('status', ['pending', 'upgrade_pending']).maybeSingle();
      if (existing) {
        showToast('You already have a pending application.', 'error');
        setSubmitting(false);
        return;
      }
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

      // Notify fan + admin
      createNotification({
        userId: user.id,
        type: 'membership',
        title: 'Membership Application Submitted',
        message: `Your ${activeTier.name} membership application has been submitted. We'll review it shortly.`,
        sendEmail: true,
        emailSubject: `Membership Application Received: ${activeTier.name}`,
        emailBody: `<p>Your <strong>${activeTier.name}</strong> membership application has been submitted successfully.</p><p>We'll review your application and get back to you soon.</p>`,
      });
      notifyAdmins('membership', 'New Membership Application', `New ${activeTier.name} membership application from ${profile?.name || user.email}.`);

      const msg =
        `Hi, I'd like to apply for the ${activeTier.name} membership.\n\n` +
        `Name: ${cardName || profile?.name}\n` +
        `Email: ${profile?.email || user.email}\n` +
        `Tier: ${activeTier.name} (${activeTier.price})\n` +
        `Card Serial: ${cardSerial}\n\n` +
        `Thank you.`;
      setTimeout(() => {
        if (commMethod === 'whatsapp') {
          openWhatsApp(msg);
        } else {
          openEmail('Membership Application - ' + activeTier.name, msg);
        }
      }, 800);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Network error', 'error');
    }
    setSubmitting(false);
  };

  const handleUpgrade = async () => {
    if (!user || !upgradeTier || !upgradeCommMethod) return;
    setUpgrading(true);
    try {
      const t = tiers.find((x) => x.id === upgradeTier);
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
        member_country: (profile as unknown as Record<string, unknown>)?.country || 'Global',
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

      // Notify fan + admin
      createNotification({
        userId: user.id,
        type: 'membership',
        title: 'Membership Upgrade Requested',
        message: `Your upgrade to ${t?.name} has been submitted.`,
        sendEmail: true,
        emailSubject: `Upgrade Request: ${t?.name}`,
        emailBody: `<p>Your membership upgrade to <strong>${t?.name}</strong> has been submitted.</p><p>We'll process your upgrade request shortly.</p>`,
      });
      notifyAdmins('membership', 'Membership Upgrade Request', `Upgrade request to ${t?.name} from ${profile?.name || user.email}.`);

      const msg =
        `Hi, I'd like to upgrade my membership.\n\n` +
        `Name: ${myMembership?.card_name || profile?.name}\n` +
        `Current Tier: ${myMembership?.tier_name}\n` +
        `New Tier: ${t?.name} (${t?.price})\n` +
        `Membership #: ${myMembership?.membership_number || 'N/A'}\n\n` +
        `Thank you.`;
      setTimeout(() => {
        if (upgradeCommMethod === 'whatsapp') {
          openWhatsApp(msg);
        } else {
          openEmail('Membership Upgrade - ' + (t?.name || ''), msg);
        }
      }, 800);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Network error', 'error');
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
      const year = myMembership?.activation_date ? new Date(myMembership.activation_date).getFullYear() : new Date().getFullYear();
      ctx.fillText('ISSUED ' + year, 160, 282);

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

  const higherTiers = tiers.filter((t) => {
    if (!myMembership) return true;
    const currentIdx = TIER_ORDER.indexOf(myMembership.tier_id);
    const tierIdx = TIER_ORDER.indexOf(t.id);
    return tierIdx > currentIdx;
  });

  // ── Loading ──
  if (checkingMembership) {
    return <section className="bg-[#FCFAF7] py-20 px-4 md:px-6 relative min-h-[400px] flex items-center justify-center"><Loader2 className="h-6 w-6 text-[#C89B3C] animate-spin" /></section>;
  }

  // ── Pending after submission ──
  if (submitDone && myMembership?.status === 'pending') {
    return (
      <section id="membership-page" className="bg-[#FCFAF7] section-luxury px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="inline-flex p-4 rounded-full bg-amber-50">
            <ShieldCheck className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">Application Under Review</h2>
          <p className="text-sm text-[#444] max-w-lg mx-auto leading-relaxed">
            Your membership request has been submitted successfully. Please continue your conversation with the administrator through your selected communication method while your application is being reviewed.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-xs font-mono">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </div>
          <div className="rounded-[20px] bg-white p-6 space-y-3 max-w-sm mx-auto text-left shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between text-xs"><span className="text-[#444]">Tier</span><span className="text-[#C89B3C] font-bold">{myMembership.tier_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Card Name</span><span className="text-[#1E1E1E] font-semibold">{myMembership.card_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Serial</span><span className="text-[#1E1E1E] font-mono text-[10px]">{myMembership.card_serial}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Submitted</span><span className="text-[#1E1E1E]">{new Date(myMembership.created_at).toLocaleDateString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Communication</span><span className="text-[#1E1E1E] capitalize">{myMembership.comm_method}</span></div>
          </div>
          <button onClick={() => navigate('/portal')} className="bg-[#C89B3C] hover:bg-[#A97828] text-[#333] font-semibold py-3 px-7 rounded-full text-xs tracking-[0.1em] uppercase transition-all duration-300 shadow-sm">
            Go to Membership Dashboard
          </button>
        </div>
      </section>
    );
  }

  // ── Active member view with upgrade option ──
  if (user && myMembership?.status === 'active') {
    const tierStyle = (id: string) => {
      const t = tiers.find((x) => x.id === id);
      return { bg: t?.bg_color || 'from-neutral-900 via-neutral-50 to-white', border: t?.border_color || 'border-[rgba(0,0,0,0.06)]', icon: t?.icon_color || 'text-[#444]' };
    };
    const ts = tierStyle(myMembership.tier_id);
    return (
      <section id="membership-page" className="bg-[#FCFAF7] section-luxury px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-3xl space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFE7DA] text-[#C89B3C] text-[10px] font-mono tracking-[0.2em] uppercase font-semibold">
              <Crown className="h-3.5 w-3.5" /> ACTIVE MEMBERSHIP
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">
              Welcome, <span className="text-[#C89B3C]">{myMembership.card_name}</span>
            </h2>
            <p className="text-xs text-[#444] max-w-lg mx-auto font-mono leading-relaxed">
              You are an official Sanctuary member. Present your digital card for exclusive access.
            </p>
          </div>

          {/* Digital Membership Card */}
          <div className={`relative w-full max-w-[420px] mx-auto aspect-[1.58/1] rounded-2xl border bg-gradient-to-br ${ts.bg} ${ts.border} p-6 flex flex-col justify-between overflow-hidden shadow-2xl`}>
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#C89B3C]/5 blur-[60px] pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#C89B3C]/5 blur-[60px] pointer-events-none" />
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg font-bold tracking-widest text-white">GA</span>
                <div className="h-5 w-px bg-[#F8F6F2]" />
                <div className="flex flex-col">
                  <span className="font-serif text-[10px] font-bold tracking-wider text-[#444]">GILLIAN ANDERSON</span>
                  <span className="font-mono text-[6px] tracking-[0.2em] text-[#C89B3C]">OFFICIAL SANCTUARY</span>
                </div>
              </div>
              <span className="font-mono text-[11px] font-bold text-[#444] tracking-wider">MEMBER CARD</span>
            </div>
            <div className="flex gap-4 items-center z-10 pt-2">
              <div className="h-16 w-16 rounded-full border-2 border-[#C89B3C]/30 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                {myMembership.profile_photo ? (
                  <img src={myMembership.profile_photo} alt="Your profile photo" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-[#444]" />
                )}
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[11px] font-mono text-[#444] uppercase">OFFICIAL MEMBER</span>
                <h5 className="font-serif text-base font-bold text-[#111] tracking-wide truncate max-w-[220px]">{myMembership.card_name}</h5>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase ${ts.icon}`}>{myMembership.tier_name}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F8F6F2]" />
                  <span className="text-[11px] font-mono text-[#444]">#{myMembership.membership_number?.split('-').pop() || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-[rgba(0,0,0,0.06)]/60 pt-3 z-10">
              <div className="text-left font-mono text-[10px] text-[#444] space-y-0.5">
                <span className="block">MEMBER SINCE</span>
                <span className="font-semibold text-[#444] text-[10px]">{myMembership.activation_date ? new Date(myMembership.activation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
              </div>
              <div className="text-right font-mono text-[10px] text-[#444] space-y-0.5">
                <span className="block">EXPIRES</span>
                <span className={`font-semibold text-[10px] ${myMembership.expiration_date && new Date(myMembership.expiration_date) < new Date() ? 'text-red-400' : 'text-[#444]'}`}>
                  {myMembership.expiration_date ? new Date(myMembership.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Lifetime'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-end gap-0.5 h-3 opacity-60">
                  {[...Array(6)].map((_, i) => <div key={i} className={`w-0.5 bg-neutral-300 ${i % 3 === 1 ? 'h-2/3' : i % 3 === 2 ? 'h-3/4' : 'h-full'}`} />)}
                </div>
                <span className="font-mono text-[5px] text-[#444] mt-0.5">SECURE-BAR</span>
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
              <div key={d.label} className="rounded-[16px] bg-white p-3.5 text-center space-y-1 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
                <p className="text-[10px] font-mono text-[#444] uppercase tracking-wider">{d.label}</p>
                <p className={`text-[10px] text-[#1E1E1E] font-semibold ${d.mono ? 'font-mono' : ''} truncate`}>{d.value}</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          {tiers.find((t) => t.id === myMembership.tier_id)?.benefits?.length > 0 && (
            <div className="max-w-lg mx-auto w-full space-y-3">
              <h4 className="text-[10px] font-mono text-[#C89B3C] uppercase tracking-[0.15em] font-semibold text-center">Your {myMembership.tier_name} Benefits</h4>
              <div className="grid gap-2">
                {tiers.find((t) => t.id === myMembership.tier_id)?.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#444] bg-white rounded-[16px] px-4 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
                    <Check className="h-3.5 w-3.5 text-[#C89B3C] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate('/portal')} className="bg-[#C89B3C] hover:bg-[#A97828] text-[#333] font-semibold py-3 px-7 rounded-full text-xs tracking-[0.1em] uppercase transition-all duration-300 shadow-sm">
              Membership Dashboard
            </button>
            <button onClick={downloadCard} className="bg-white hover:bg-[#F8F6F2] text-[#444] hover:text-[#1E1E1E] font-semibold py-3 px-7 rounded-full text-xs tracking-[0.1em] uppercase transition-all duration-300 flex items-center gap-1.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
              <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Download Card
            </button>
            {higherTiers.length > 0 && (
              <button onClick={() => { setUpgradeTier(''); setUpgradeCommMethod(null); setShowUpgradeModal(true); }} className="bg-white hover:bg-[#F8F6F2] text-[#444] hover:text-[#1E1E1E] font-semibold py-3 px-7 rounded-full text-xs tracking-[0.1em] uppercase transition-all duration-300 flex items-center gap-1.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
                <ArrowUp className="h-3.5 w-3.5 text-[#C89B3C]" /> Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Upgrade Modal */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
            >
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-[20px] bg-white p-7 space-y-6 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)]"
              >
                <div className="text-center space-y-2">
                  <h3 className="font-serif text-xl font-bold text-[#1E1E1E]">Upgrade Membership</h3>
                  <p className="text-sm text-[#444]">Choose your new tier. You will be upgraded from <span className="text-[#C89B3C]">{myMembership.tier_name}</span>.</p>
                </div>
                <div className="space-y-3">
                  {higherTiers.map((t) => (
                    <button key={t.id} onClick={() => setUpgradeTier(t.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-[16px] border transition-all text-left ${upgradeTier === t.id ? 'border-[#C89B3C]/40 bg-[#C89B3C]/5' : 'border-[rgba(0,0,0,0.06)] hover:border-[#C89B3C]/20 bg-[#FCFAF7]'}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-[#1E1E1E]">{t.name}</p>
                        <p className="text-[10px] text-[#444]">{t.price}</p>
                      </div>
                      {upgradeTier === t.id && <Check className="h-5 w-5 text-[#C89B3C]" />}
                    </button>
                  ))}
                </div>
                {upgradeTier && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#444] text-center">How would you like to send your upgrade request?</p>
                    <div className="flex gap-3">
                      <button onClick={() => setUpgradeCommMethod('whatsapp')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-[16px] border transition-all ${upgradeCommMethod === 'whatsapp' ? 'border-[#2E8B57]/40 bg-[#2E8B57]/5' : 'border-[rgba(0,0,0,0.06)] hover:border-[#2E8B57]/20 bg-[#FCFAF7]'}`}
                      >
                        <MessageCircle className={`h-5 w-5 ${upgradeCommMethod === 'whatsapp' ? 'text-[#2E8B57]' : 'text-[#444]'}`} />
                        <span className="text-[10px] font-mono text-[#444]">WhatsApp</span>
                      </button>
                      <button onClick={() => setUpgradeCommMethod('email')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-[16px] border transition-all ${upgradeCommMethod === 'email' ? 'border-[#C89B3C]/40 bg-[#C89B3C]/5' : 'border-[rgba(0,0,0,0.06)] hover:border-[#C89B3C]/20 bg-[#FCFAF7]'}`}
                      >
                        <Mail className={`h-5 w-5 ${upgradeCommMethod === 'email' ? 'text-[#C89B3C]' : 'text-[#444]'}`} />
                        <span className="text-[10px] font-mono text-[#444]">Email</span>
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 py-3 rounded-full border border-[rgba(0,0,0,0.06)] text-[#444] text-xs font-mono font-semibold uppercase tracking-[0.1em] hover:bg-[#F8F6F2] transition-all">Cancel</button>
                  <button onClick={handleUpgrade} disabled={!upgradeTier || !upgradeCommMethod || upgrading}
                    className="flex-1 py-3 rounded-full bg-[#C89B3C] text-white text-xs font-mono font-semibold uppercase tracking-[0.1em] hover:bg-[#A97828] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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
      <section id="membership-page" className="bg-[#FCFAF7] section-luxury px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="inline-flex p-4 rounded-full bg-amber-50">
            <ShieldCheck className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">Application Under Review</h2>
          <p className="text-sm text-[#444] max-w-lg mx-auto leading-relaxed">
            Your membership request has been submitted successfully. Please continue your conversation with the administrator through your selected communication method while your application is being reviewed.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-xs font-mono">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </div>
          <div className="rounded-[20px] bg-white p-6 space-y-3 max-w-sm mx-auto text-left shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between text-xs"><span className="text-[#444]">Tier</span><span className="text-[#C89B3C] font-bold">{myMembership.tier_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Card Name</span><span className="text-[#1E1E1E] font-semibold">{myMembership.card_name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Serial</span><span className="text-[#1E1E1E] font-mono text-[10px]">{myMembership.card_serial}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Submitted</span><span className="text-[#1E1E1E]">{new Date(myMembership.created_at).toLocaleDateString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#444]">Communication</span><span className="text-[#1E1E1E] capitalize">{myMembership.comm_method}</span></div>
          </div>
          <button onClick={() => navigate('/portal')} className="bg-[#C89B3C] hover:bg-[#A97828] text-[#333] font-semibold py-3 px-7 rounded-full text-xs tracking-[0.1em] uppercase transition-all duration-300 shadow-sm">
            Go to Membership Dashboard
          </button>
        </div>
      </section>
    );
  }

  // ── Upgrade Pending ──
  if (user && myMembership?.status === 'upgrade_pending') {
    return (
      <section id="membership-page" className="bg-[#FCFAF7] section-luxury px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="inline-flex p-4 rounded-full bg-blue-50">
            <ArrowUp className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E] tracking-tight">Upgrade Under Review</h2>
          <p className="text-sm text-[#444] max-w-lg mx-auto leading-relaxed">
            Your upgrade request has been submitted. Please continue your conversation with the administrator through your selected communication method while your upgrade is being processed.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-mono">
            <Clock className="h-3.5 w-3.5" /> Upgrade Pending
          </div>
          <button onClick={() => navigate('/portal')} className="bg-[#C89B3C] hover:bg-[#A97828] text-[#333] font-semibold py-3 px-7 rounded-full text-xs tracking-[0.1em] uppercase transition-all duration-300 shadow-sm">
            Go to Membership Dashboard
          </button>
        </div>
      </section>
    );
  }

  // ── Main registration UI ──
  return (
    <section id="membership-page" className="relative min-h-screen bg-[#F5F0EA]">

      {/* ═══════════════════════════════════════════ HERO ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#E8E0D4] via-[#EDE7DE] to-[#F5F0EA]">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#C89B3C]/[0.06] blur-[100px]" />
          <div className="absolute top-10 right-[15%] w-48 h-48 rounded-full bg-[#C89B3C]/[0.04] blur-[60px]" />
          <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-[#C89B3C]/[0.03] blur-[40px]" />
          <div className="absolute top-0 left-[20%] w-px h-24 bg-gradient-to-b from-[#C89B3C]/20 to-transparent" />
          <div className="absolute top-0 right-[20%] w-px h-24 bg-gradient-to-b from-[#C89B3C]/20 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center pt-14 pb-12 md:pt-20 md:pb-16 px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#C89B3C]/15 text-[#A97828] text-[9px] font-mono tracking-[0.2em] uppercase font-bold mb-6 shadow-[0_1px_8px_-2px_rgba(200,155,60,0.1)]">
            <Crown className="h-3 w-3" /> OFFICIAL MEMBERSHIP
          </div>

          {/* Main heading */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-[#111] tracking-tight leading-[1.1] mb-5">
            Sanctuary{' '}
            <span className="bg-gradient-to-r from-[#C89B3C] via-[#D4A84A] to-[#C89B3C] bg-clip-text text-transparent">Membership</span>
          </h1>

          {/* Ornamental divider */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#C89B3C]/40" />
            <div className="h-1 w-1 rounded-full bg-[#C89B3C]" />
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#C89B3C]/40" />
          </div>

          <p className="text-sm text-[#555] max-w-lg mx-auto leading-relaxed font-medium">
            Choose your tier, configure your digital credentials, and submit your membership request.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ TIER CARDS ═══════════════════════════════════════════ */}
      <div className="relative mx-auto max-w-5xl px-4 md:px-6 -mt-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {tiers.map((tier) => {
            const isSelected = tier.id === selectedTier;
            const isHighest = tier.sort_order === Math.max(...tiers.map(t => t.sort_order));
            const isMiddle = tiers.length >= 3 && tier.sort_order === 2;

            // Each tier gets a unique color identity
            const tierColors: Record<number, {
              headerBg: string; bodyBg: string; glow: string; badge: string; badgeBg: string;
              nameColor: string; priceColor: string; benefitColor: string; checkBg: string;
              btnBg: string; btnText: string; btnHover: string; iconBg: string; iconColor: string;
              borderColor: string; barColor: string; selectedBorder: string; selectedShadow: string;
            }> = {
              1: {
                headerBg: 'bg-gradient-to-br from-[#EDE0CC] to-[#E0CDB5]',
                bodyBg: 'bg-[#F5EDE2]',
                glow: '#C89B3C',
                badge: 'text-[#5C3D00]', badgeBg: 'bg-[#C89B3C]/20',
                nameColor: 'text-[#000]', priceColor: 'text-[#5C3D00]',
                benefitColor: '#1a1a1a', checkBg: 'bg-[#C89B3C]/25',
                btnBg: 'bg-[#C89B3C]', btnText: 'text-[#111]', btnHover: 'hover:bg-[#A97828]',
                iconBg: 'bg-[#C89B3C]/30', iconColor: 'text-[#5C3D00]',
                borderColor: 'border-[#C89B3C]/25', barColor: 'from-[#C89B3C] to-[#D4A84A]',
                selectedBorder: 'border-[#C89B3C]/40', selectedShadow: 'shadow-[0_16px_48px_-10px_rgba(200,155,60,0.3)]',
              },
              2: {
                headerBg: 'bg-gradient-to-br from-[#D4EDDC] to-[#B8DFC8]',
                bodyBg: 'bg-[#E5F2EA]',
                glow: '#2E8B57',
                badge: 'text-[#0D4A25]', badgeBg: 'bg-[#2E8B57]/20',
                nameColor: 'text-[#000]', priceColor: 'text-[#0D4A25]',
                benefitColor: '#1a1a1a', checkBg: 'bg-[#2E8B57]/25',
                btnBg: 'bg-[#2E8B57]', btnText: 'text-[#111]', btnHover: 'hover:bg-[#256B47]',
                iconBg: 'bg-[#2E8B57]/25', iconColor: 'text-[#0D4A25]',
                borderColor: 'border-[#2E8B57]/25', barColor: 'from-[#2E8B57] to-[#3AA06A]',
                selectedBorder: 'border-[#2E8B57]/40', selectedShadow: 'shadow-[0_16px_48px_-10px_rgba(46,139,87,0.25)]',
              },
              3: {
                headerBg: 'bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A]',
                bodyBg: 'bg-[#161616]',
                glow: '#C89B3C',
                badge: 'text-[#C89B3C]', badgeBg: 'bg-[#C89B3C]/25',
                nameColor: 'text-[#111]', priceColor: 'text-[#C89B3C]',
                benefitColor: '#e0e0e0', checkBg: 'bg-[#C89B3C]/25',
                btnBg: 'bg-[#C89B3C]', btnText: 'text-[#111]', btnHover: 'hover:bg-[#D4A84A]',
                iconBg: 'bg-[#C89B3C]/[0.2]', iconColor: 'text-[#C89B3C]',
                borderColor: 'border-white/[0.12]', barColor: 'from-[#C89B3C] to-[#D4A84A]',
                selectedBorder: 'border-[#C89B3C]/45', selectedShadow: 'shadow-[0_16px_48px_-10px_rgba(200,155,60,0.25)]',
              },
            };
            const c = tierColors[tier.sort_order] || tierColors[1];
            const dark = tier.sort_order === 3;

            return (
              <div key={tier.id} onClick={() => setSelectedTier(tier.id)}
                className={`relative flex flex-col transition-all duration-500 cursor-pointer group ${isSelected ? 'z-10 -translate-y-1.5' : 'z-0 hover:-translate-y-1'}`}
              >
                {isSelected && (
                  <div className="absolute -inset-1.5 rounded-[22px] blur-lg transition-all duration-500 pointer-events-none" style={{ background: `${c.glow}12` }} />
                )}

                <div className={`relative flex flex-col h-full rounded-[16px] overflow-hidden transition-all duration-500 border ${dark ? 'text-[#111]' : ''} ${
                  isSelected
                    ? `${c.bodyBg} ${c.selectedBorder} ${c.selectedShadow}`
                    : `${c.bodyBg} ${c.borderColor} shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)]`
                }`}>

                  {/* Color header band */}
                  <div className={`${c.headerBg} px-5 pt-5 pb-4 relative overflow-hidden`}>
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 grid grid-cols-3 gap-1 opacity-30 p-2">
                      {[...Array(9)].map((_, i) => <div key={i} className={`w-1 h-1 rounded-full ${dark ? 'bg-[#C89B3C]' : 'bg-current'}`} style={{ color: dark ? undefined : `${c.glow}` }} />)}
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                        <Crown className={`h-5 w-5 ${c.iconColor}`} />
                      </div>
                      <span className={`text-[8px] font-mono px-2.5 py-1 rounded-full uppercase tracking-[0.1em] font-bold ${c.badgeBg} ${c.badge}`}>
                        {isMiddle ? 'POPULAR' : `TIER ${tier.sort_order}`}
                      </span>
                    </div>

                    <h3 className={`font-serif text-lg font-bold tracking-tight mt-3 ${c.nameColor}`}>{tier.name}</h3>
                    <span className={`text-xl font-serif font-bold ${c.priceColor}`}>{tier.price}</span>

                    {/* Accent bar at bottom of header */}
                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.barColor}`} />
                  </div>

                  {/* Body */}
                  <div className={`px-5 pt-4 pb-5 flex flex-col flex-1 ${c.bodyBg}`}>
                    {/* Benefits */}
                    <ul className="space-y-2.5 mb-4 flex-1">
                      {(tier.benefits || []).map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: c.benefitColor }}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${c.checkBg}`}>
                            <Check className="h-2.5 w-2.5" style={{ color: dark ? '#C89B3C' : c.glow }} />
                          </div>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button className={`w-full py-2.5 rounded-lg text-[9px] font-mono tracking-[0.1em] uppercase font-bold transition-all duration-400 ${c.btnBg} ${c.btnText} ${c.btnHover} ${
                      isSelected ? 'ring-1 ring-black/10' : ''
                    }`}>
                      {isSelected ? 'SELECTED' : 'SELECT TIER'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ STEP INDICATOR ═══════════════════════════════════════════ */}
      <div className="mx-auto max-w-xl px-4 md:px-6 mt-14 mb-12">
        <div className="relative flex items-start justify-between">
          {/* Track */}
          <div className="absolute top-[12px] left-[32px] right-[32px] h-[1.5px] bg-[rgba(0,0,0,0.1)]">
            <div className="h-full bg-[#C89B3C] transition-all duration-700 ease-out rounded-full" style={{ width: `${((applicationStep - 1) / 2) * 100}%` }} />
          </div>

          {['Choose Tier', 'Your Details', 'Contact Method'].map((label, i) => {
            const stepNum = i + 1;
            const completed = stepNum < applicationStep;
            const current = stepNum === applicationStep;
            return (
              <div key={label} className="relative flex flex-col items-center gap-2 z-10">
                <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                  current
                    ? 'bg-[#C89B3C] text-white shadow-[0_2px_12px_-2px_rgba(200,155,60,0.4)]'
                    : completed
                      ? 'bg-[#2E8B57] text-white'
                      : 'bg-white text-[#555] border-[1.5px] border-[rgba(0,0,0,0.12)]'
                }`}>
                  {completed ? <Check className="h-3 w-3" /> : stepNum}
                </div>
                <span className={`text-[9px] font-mono tracking-[0.06em] whitespace-nowrap transition-colors font-bold ${
                  current ? 'text-[#A97828]' : completed ? 'text-[#2E8B57]' : 'text-[#555]'
                }`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ CONFIGURATOR ═══════════════════════════════════════════ */}
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        {/* Section label */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C89B3C]/10 text-[#A97828] text-[9px] font-mono tracking-[0.18em] uppercase font-bold mb-4">
            <IdCard className="h-3 w-3" /> CONFIGURE YOUR CARD
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#111] tracking-tight mb-2">
            Personalize Your Credentials
          </h2>
          <p className="text-xs text-[#555] max-w-md mx-auto leading-relaxed font-medium">
            Fill in your details to generate your unique digital membership card.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[20px] p-6 md:p-7 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] space-y-5">
              {/* Member Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-[0.12em] text-[#444] uppercase font-bold">MEMBER NAME <span className="text-[#D9534F]">*</span></label>
                <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Your name on card" maxLength={30}
                  className="w-full bg-[#F5F3EF] border-[1.5px] border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[#111] text-sm outline-none focus:border-[#C89B3C]/60 focus:bg-white transition-all duration-300 placeholder:text-[#999] font-medium" />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-[0.12em] text-[#444] uppercase font-bold">PHONE</label>
                <input type="tel" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="+1 (555) 000-000" maxLength={20}
                  className="w-full bg-[#F5F3EF] border-[1.5px] border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[#111] text-sm outline-none focus:border-[#C89B3C]/60 focus:bg-white transition-all duration-300 placeholder:text-[#999] font-medium" />
              </div>

              {/* Photo upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-[0.12em] text-[#444] uppercase font-bold">PROFILE PHOTO <span className="text-[#D9534F]">*</span></label>
                <p className="text-[11px] text-[#444] leading-relaxed">Appears on your digital membership card.</p>
                <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-[1.5px] border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                    isDragOver ? 'border-[#C89B3C]/60 bg-[#C89B3C]/[0.06]' : photoError ? 'border-[#D9534F]/40 bg-[#D9534F]/[0.03]' : 'border-[rgba(0,0,0,0.12)] bg-[#F5F3EF] hover:border-[#C89B3C]/40'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  {userPhoto ? (
                    <div className="flex items-center gap-3">
                      <img src={userPhoto} alt="Preview" loading="lazy" className="h-11 w-11 rounded-full object-cover border-2 border-[#C89B3C]/30" />
                      <div className="text-left">
                        <p className="text-[11px] font-mono text-[#2E8B57] font-bold uppercase tracking-wider">Photo Mounted</p>
                        <p className="text-[10px] text-[#444] mt-0.5">Click to replace</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center">
                        <Upload className="h-4 w-4 text-[#A97828]" />
                      </div>
                      <p className="font-mono text-[10px] text-[#444] tracking-wider font-medium">DRAG & DROP OR BROWSE</p>
                    </>
                  )}
                </div>
                {photoError && <p className="text-[10px] text-[#D9534F] font-mono font-medium">{photoError}</p>}
              </div>

              {/* Submit */}
              <button onClick={handleRegisterClick} disabled={!activeTier}
                className="w-full bg-gradient-to-r from-[#C89B3C] to-[#D4A84A] hover:from-[#A97828] hover:to-[#C89B3C] text-[#333] font-bold py-3.5 rounded-xl text-[10px] tracking-[0.12em] uppercase transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_4px_20px_-4px_rgba(200,155,60,0.35)] hover:shadow-[0_6px_24px_-4px_rgba(200,155,60,0.45)] disabled:shadow-none"
              >
                <ShieldCheck className="h-4 w-4" /> REGISTER DIGITAL CARD
              </button>
            </div>
          </div>

          {/* ── Right: Live Preview ── */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-[#C89B3C] animate-pulse" />
              <h4 className="text-[10px] font-mono tracking-[0.18em] text-[#555] uppercase font-bold">LIVE PREVIEW</h4>
            </div>

            {/* Card */}
            {activeTier && (
              <div className="w-full max-w-[420px]">
                <div className={`relative aspect-[1.58/1] rounded-2xl bg-gradient-to-br ${activeTier.bg_color} ${activeTier.border_color} p-6 flex flex-col justify-between overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)] group/card`}>
                  {/* Glow effects */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#C89B3C]/[0.06] blur-[60px] pointer-events-none transition-all duration-700 group-hover/card:bg-[#C89B3C]/[0.1]" />
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[#C89B3C]/[0.04] blur-[40px] pointer-events-none" />

                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                  {/* Header */}
                  <div className="flex justify-between items-start z-10">
                    <div className="flex items-center gap-2.5">
                      <span className="font-serif text-xl font-bold tracking-[0.15em] text-white">GA</span>
                      <div className="h-6 w-px bg-white/40" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-serif text-[12px] font-bold tracking-wider text-white">GILLIAN ANDERSON</span>
                        <span className="font-mono text-[7px] tracking-[0.25em] text-[#C89B3C] font-bold">OFFICIAL SANCTUARY</span>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-[#111]/70 tracking-[0.15em] uppercase">Member Card</span>
                  </div>

                  {/* Photo + Info */}
                  <div className="flex gap-5 items-center z-10">
                    <div className="h-[72px] w-[72px] rounded-full border-[2.5px] border-white/30 bg-white/15 backdrop-blur-sm overflow-hidden flex items-center justify-center shrink-0 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.25)]">
                      {userPhoto ? (
                        <img src={userPhoto} alt="Face" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-white/50" />
                      )}
                    </div>
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-mono text-white/70 uppercase tracking-[0.2em] font-bold">OFFICIAL MEMBER</span>
                      <h5 className="font-serif text-[17px] font-bold text-[#111] tracking-wide truncate max-w-[220px]">{cardName || 'Member'}</h5>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-mono font-bold uppercase ${activeTier.icon_color}`}>{activeTier.name}</span>
                        <span className="h-1 w-1 rounded-full bg-white/50" />
                        <span className="text-[10px] font-mono text-white/70">ISSUED {new Date().getFullYear()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-end border-t border-white/20 pt-3.5 z-10">
                    <div className="text-left font-mono text-[9px] text-white/65 space-y-0.5">
                      <span className="block tracking-[0.15em] uppercase">Serial Number</span>
                      <span className="font-bold text-[#111] text-[11px] tracking-wider flex items-center gap-1.5">
                        {cardSerial}
                        <button onClick={() => { navigator.clipboard.writeText(cardSerial); setCopiedSerial(true); setTimeout(() => setCopiedSerial(false), 2000); }}
                          className="hover:text-[#C89B3C] transition-colors duration-300">
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-end gap-[3px] h-5 opacity-60">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className={`w-[2px] rounded-full bg-white/60 ${i % 3 === 1 ? 'h-3/5' : i % 3 === 2 ? 'h-4/5' : 'h-full'}`} />
                        ))}
                      </div>
                      <span className="font-mono text-[5px] text-white/50 mt-1 tracking-[0.2em]">SECURE-BAR</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Download button */}
            <button onClick={downloadCard}
              className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F0EDE8] text-[#333] hover:text-[#111] rounded-full text-[10px] font-mono font-bold tracking-[0.1em] uppercase transition-all duration-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] border border-[rgba(0,0,0,0.1)]">
              <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> DOWNLOAD CARD
            </button>
          </div>
        </div>
      </div>

      {/* Communication Method Modal */}
      <AnimatePresence>
        {showCommModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[20px] bg-white p-7 space-y-6 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)]"
            >
              <div className="text-center space-y-2">
                <h3 className="font-serif text-xl font-bold text-[#1E1E1E]">How Should We Contact You?</h3>
                <p className="text-sm text-[#444]">Choose how you'd like the admin to follow up about your application.</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => setCommMethod('whatsapp')}
                  className={`w-full flex items-center gap-4 p-5 rounded-[16px] border transition-all duration-300 text-left ${commMethod === 'whatsapp' ? 'border-[#2E8B57]/40 bg-[#2E8B57]/5' : 'border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.06)] bg-[#FCFAF7]'}`}
                >
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center ${commMethod === 'whatsapp' ? 'bg-[#2E8B57] text-white' : 'bg-[#EFE7DA] text-[#444]'}`}>
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div><p className="text-sm font-bold text-[#1E1E1E]">WhatsApp</p><p className="text-[11px] text-[#444]">We'll message you on WhatsApp</p></div>
                  {commMethod === 'whatsapp' && <Check className="h-5 w-5 text-[#2E8B57] ml-auto" />}
                </button>
                <button onClick={() => setCommMethod('email')}
                  className={`w-full flex items-center gap-4 p-5 rounded-[16px] border transition-all duration-300 text-left ${commMethod === 'email' ? 'border-[#C89B3C]/40 bg-[#C89B3C]/5' : 'border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.06)] bg-[#FCFAF7]'}`}
                >
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center ${commMethod === 'email' ? 'bg-[#C89B3C] text-white' : 'bg-[#EFE7DA] text-[#444]'}`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <div><p className="text-sm font-bold text-[#1E1E1E]">Email</p><p className="text-[11px] text-[#444]">We'll send you an email</p></div>
                  {commMethod === 'email' && <Check className="h-5 w-5 text-[#C89B3C] ml-auto" />}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCommModal(false)}
                  className="flex-1 py-3 rounded-full border border-[rgba(0,0,0,0.06)] text-[#444] text-xs font-mono font-semibold uppercase tracking-[0.1em] hover:bg-[#F8F6F2] transition-all">Cancel</button>
                <button onClick={handleSubmitRequest} disabled={!commMethod || submitting}
                  className="flex-1 py-3 rounded-full bg-[#C89B3C] text-white text-xs font-mono font-semibold uppercase tracking-[0.1em] hover:bg-[#A97828] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</> : <><ShieldCheck className="h-3.5 w-3.5" /> Submit Request</>}
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
            className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-[16px] bg-white px-5 py-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] min-w-[300px]"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-[#C89B3C] animate-pulse shrink-0" />
            <div className="flex-1 text-xs text-left">
              <p className="font-mono text-[#C89B3C] uppercase tracking-[0.1em] font-semibold text-[11px]">SYSTEM MSG</p>
              <p className="text-[#1E1E1E] mt-1 leading-relaxed">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
