import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, IdCard, Check, Upload, User, ShieldCheck, Download, Copy, MessageCircle, Mail, Loader2, ArrowUp, Clock } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useGlobalState } from '../utils/StateContext';

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
    fetch('/api/membership/my?user_id=' + user.id)
      .then(r => r.json())
      .then(d => { setMyMembership(d.membership); setCheckingMembership(false); })
      .catch(() => setCheckingMembership(false));
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
      const r = await fetch('/api/membership/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const text = await r.text();
      if (!text) { showToast('Server returned empty response. Restart the dev server.', 'error'); setSubmitting(false); return; }
      let d;
      try { d = JSON.parse(text); } catch { showToast('Invalid response from server. Restart the dev server.', 'error'); setSubmitting(false); return; }
      if (!d.success) { showToast(d.error || 'Submission failed', 'error'); setSubmitting(false); return; }

      setMyMembership(d.membership);
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
          window.open(`https://wa.me/?text=${msg}`, '_blank');
        } else {
          window.open(`mailto:?subject=${encodeURIComponent('Membership Application - ' + activeTier.name)}&body=${msg}`, '_blank');
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
      const r = await fetch('/api/membership/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const text = await r.text();
      if (!text) { showToast('Upgrade failed — restart the dev server.', 'error'); setUpgrading(false); return; }
      let d;
      try { d = JSON.parse(text); } catch { showToast('Invalid response.', 'error'); setUpgrading(false); return; }
      if (!d.success) { showToast(d.error || 'Upgrade failed', 'error'); setUpgrading(false); return; }
      setMyMembership(d.membership);
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
          window.open(`https://wa.me/?text=${msg}`, '_blank');
        } else {
          window.open(`mailto:?subject=${encodeURIComponent('Membership Upgrade - ' + t?.name)}&body=${msg}`, '_blank');
        }
      }, 800);
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    }
    setUpgrading(false);
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
    return (
      <section id="membership-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[500px]">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <div className="mx-auto max-w-sm">
            {myMembership.profile_photo ? (
              <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-gold-500/40 shadow-lg shadow-gold-500/10">
                <img src={myMembership.profile_photo} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 mx-auto rounded-full bg-neutral-900 border-2 border-gold-500/40 flex items-center justify-center"><User className="h-8 w-8 text-neutral-600" /></div>
            )}
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">Welcome, Member</h2>
          <div className="rounded-xl border border-gold-500/30 bg-neutral-950 p-6 space-y-3 text-left">
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Name</span><span className="text-white font-bold">{myMembership.card_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Tier</span><span className="text-gold-500 font-bold">{myMembership.tier_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Membership Number</span><span className="text-white font-mono">{myMembership.membership_number || 'N/A'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Activated</span><span className="text-white">{myMembership.activation_date ? new Date(myMembership.activation_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Expires</span><span className="text-white">{myMembership.expiration_date ? new Date(myMembership.expiration_date).toLocaleDateString() : 'Never'}</span></div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => window.location.hash = '#PORTAL'} className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all">Go to Membership Dashboard</button>
            {higherTiers.length > 0 && (
              <button onClick={() => { setUpgradeTier(''); setUpgradeCommMethod(null); setShowUpgradeModal(true); }} className="border border-gold-500/40 hover:bg-gold-500/10 text-gold-500 font-bold py-2.5 px-6 rounded tracking-widest uppercase text-xs transition-all flex items-center gap-1.5">
                <ArrowUp className="h-3.5 w-3.5" /> Upgrade Membership
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
              <button onClick={() => showToast('Download simulated.', 'success')}
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
