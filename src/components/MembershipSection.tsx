import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  Sparkles,
  IdCard,
  Check,
  Upload,
  User,
  ShieldAlert,
  Download,
  ShieldCheck,
  CheckCircle,
  Copy,
  Info
} from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  textColor: string;
  perks: string[];
}

export default function MembershipSection() {
  const [selectedTier, setSelectedTier] = useState<string>('scully');
  const [cardName, setCardName] = useState<string>('Dana Scully');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tiers: Tier[] = [
    {
      id: 'scully',
      name: 'Forensic Analyst (Scully)',
      tagline: 'Unlock scientific truth, logic, and meticulous inquiry.',
      badge: 'Tier 1 Privilege',
      color: 'from-emerald-950 via-neutral-950 to-neutral-950 border-emerald-500/30',
      textColor: 'text-emerald-400',
      perks: [
        'Interactive community privileges & portal access',
        'Early viewing access to official digital streams',
        'Standard custom membership card generator access',
        'Official digital wallpapers & set sketch catalogs'
      ]
    },
    {
      id: 'gibson',
      name: 'Lead Detective (Gibson)',
      tagline: 'For individuals of absolute focus, intuition, and calm authority.',
      badge: 'Tier 2 Premium',
      color: 'from-amber-950 via-neutral-950 to-neutral-950 border-amber-500/30',
      textColor: 'text-amber-500',
      perks: [
        'All "Scully" Tier privileges included',
        'Priority review on all Experience applications',
        '10% discount across the official apparel shop',
        'Access to limited print collectible merchandise',
        'Exclusive early-bird registration to public events'
      ]
    },
    {
      id: 'milburn',
      name: 'Advocate (Milburn)',
      tagline: 'Listen with compassion, open hearts, and absolute clarity.',
      badge: 'Tier 3 Ultimate',
      color: 'from-blue-950 via-neutral-950 to-neutral-950 border-blue-500/30',
      textColor: 'text-blue-400',
      perks: [
        'All "Scully" and "Gibson" privileges included',
        'Direct email newsletter with personal notes from Gillian',
        'Exclusive invitations to closed virtual sessions',
        'Full digital certificate of philanthropy support',
        'Complimentary annual tour merch kit'
      ]
    }
  ];

  // Helper to generate a unique serial
  const generateSerial = (tierName: string) => {
    const cleanTier = tierName.toUpperCase().replace(/\s+/g, '').substring(0, 3);
    return `GA-${cleanTier}-2026-${cardName.replace(/\s+/g, '').substring(0, 4).toUpperCase()}`;
  };

  const activeTier = tiers.find((t) => t.id === selectedTier) || tiers[0];
  const cardSerial = generateSerial(activeTier.name);

  // Profile photo handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCopySerial = () => {
    navigator.clipboard.writeText(cardSerial);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  return (
    <section id="membership-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute left-10 top-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Page Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Crown className="h-3.5 w-3.5" />
            OFFICIAL ALIGNMENT TIERS
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Co-op <span className="text-gold-500">Membership</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Formally register with our co-operative community. Choose your philosophical tier, generate your custom digital credentials, and access exclusive perks.
          </p>
        </div>

        {/* Tiers Cards Select row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {tiers.map((tier) => {
            const isSelected = tier.id === selectedTier;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`p-6 rounded-xl border flex flex-col justify-between transition-all cursor-pointer h-full relative overflow-hidden group ${
                  isSelected
                    ? `bg-gradient-to-br ${tier.color} shadow-lg scale-[1.01]`
                    : 'bg-neutral-950/40 border-neutral-900 hover:border-neutral-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono border border-neutral-800 px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 uppercase">
                      {tier.badge}
                    </span>
                    <Crown className={`h-4.5 w-4.5 ${isSelected ? tier.textColor : 'text-neutral-700'}`} />
                  </div>

                  <div className="space-y-1">
                    <h3 className={`font-serif text-lg font-bold tracking-wide ${isSelected ? tier.textColor : 'text-white'}`}>
                      {tier.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                      {tier.tagline}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-neutral-900/40">
                    {tier.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                        <Check className="h-3.5 w-3.5 text-gold-500 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-auto">
                  <button
                    className={`w-full py-2 rounded text-[10px] font-mono tracking-widest uppercase font-bold transition-colors ${
                      isSelected
                        ? 'bg-gold-500 text-neutral-950 hover:bg-gold-400'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'ACTIVE SELECTED' : 'SELECT TIER'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Membership Card Generator */}
        <div className="grid gap-8 lg:grid-cols-12 items-center bg-neutral-950/60 border border-neutral-900 rounded-xl p-8 shadow-xl text-left">
          {/* Card Configurator Inputs - 5 Cols */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <h3 className="font-serif text-lg font-extrabold text-white flex items-center gap-2">
                <IdCard className="h-5 w-5 text-gold-500" />
                CARD CONFIGURATOR
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Personalize your official co-operative membership credentials. Type your name and upload a profile avatar.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                  MEMBER NAME
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Dana Scully"
                  maxLength={30}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3.5 py-2.5 text-white outline-none focus:border-gold-500/40"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                  MEMBER AVATAR / PROFILE PHOTO
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 bg-neutral-900/40 ${
                    isDragOver ? 'border-gold-500 bg-gold-500/5' : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {userPhoto ? (
                    <div className="flex items-center gap-2.5">
                      <img src={userPhoto} alt="Avatar Preview" className="h-8 w-8 rounded-full object-cover border border-neutral-800" />
                      <span className="text-[10px] font-mono text-emerald-400">PHOTO MOUNTED SUCCESSFULLY</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4.5 w-4.5 text-neutral-500 mb-1" />
                      <p className="font-mono text-[9px] text-neutral-400">DRAG & DROP OR BROWSE PHOTO</p>
                    </>
                  )}
                </div>
              </div>

              {/* simulated register button */}
              <button
                onClick={() => {
                  setRegistered(true);
                  setTimeout(() => setRegistered(false), 3000);
                }}
                className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                REGISTER DIGITAL CARD
              </button>
            </div>
          </div>

          {/* Interactive Card Canvas - 7 Cols */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-5">
            <h4 className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
              LIVE CREDENTIALS PREVIEW
            </h4>

            {/* Simulated Plastic Membership Card */}
            <div className={`relative w-full max-w-[380px] aspect-[1.58/1] rounded-2xl border bg-gradient-to-br ${activeTier.color} p-5 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 group/card`}>
              {/* Core design elements overlays */}
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gold-500/5 blur-[50px] pointer-events-none group-hover/card:bg-gold-500/10 transition-all duration-700" />

              {/* Card Header */}
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-base font-bold tracking-widest text-white">GA</span>
                  <div className="h-3 w-[1px] bg-neutral-800" />
                  <div className="flex flex-col">
                    <span className="font-serif text-[9px] font-bold tracking-wider text-neutral-300">GILLIAN ANDERSON</span>
                    <span className="font-mono text-[5px] tracking-[0.2em] text-gold-500">OFFICIAL CO-OP</span>
                  </div>
                </div>
                <span className="font-mono text-[8px] font-bold text-neutral-500 tracking-wider">
                  MEMBER CARD
                </span>
              </div>

              {/* Card Body with avatar, details */}
              <div className="flex gap-4 items-center z-10 pt-4">
                {/* Profile Circle */}
                <div className="h-14 w-14 rounded-full border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0">
                  {userPhoto ? (
                    <img src={userPhoto} alt="Member Face" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-neutral-700" />
                  )}
                </div>

                {/* Info details */}
                <div className="space-y-1 text-left">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase">OFFICIAL MEMBER</span>
                  <h5 className="font-serif text-sm font-bold text-white tracking-wide truncate max-w-[180px]">
                    {cardName || 'Thomas Anderson'}
                  </h5>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono font-bold uppercase ${activeTier.textColor}`}>
                      {activeTier.name}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-800" />
                    <span className="text-[8px] font-mono text-neutral-400">ISSUED 2026</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with barcode, serial */}
              <div className="flex justify-between items-end border-t border-neutral-900 pt-3 z-10">
                <div className="text-left font-mono text-[7px] text-neutral-500">
                  <span className="block">SERIAL NUMBER</span>
                  <span className="font-semibold text-neutral-300 flex items-center gap-1">
                    {cardSerial}
                    <button onClick={handleCopySerial} title="Copy Serial" className="hover:text-gold-500 transition-colors">
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                  </span>
                </div>

                {/* Simulated barcode */}
                <div className="flex flex-col items-end">
                  <div className="flex items-end gap-0.5 h-4 opacity-70">
                    <div className="w-0.5 bg-neutral-300 h-full" />
                    <div className="w-[1px] bg-neutral-300 h-full" />
                    <div className="w-0.5 bg-neutral-300 h-full" />
                    <div className="w-[1px] bg-neutral-300 h-3/4" />
                    <div className="w-0.5 bg-neutral-300 h-full" />
                    <div className="w-0.5 bg-neutral-300 h-2/3" />
                    <div className="w-[1px] bg-neutral-300 h-full" />
                    <div className="w-0.5 bg-neutral-300 h-full" />
                  </div>
                  <span className="font-mono text-[5px] text-neutral-500 mt-0.5">KR-SECURE-BAR</span>
                </div>
              </div>
            </div>

            {/* Quick action tools */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  showToast('Membership card saved! Download completed simulated.', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-900 rounded-lg text-xs font-mono font-semibold transition-all"
              >
                <Download className="h-3.5 w-3.5 text-gold-500" />
                DOWNLOAD CREDENTIALS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM TOAST NOTIFICATIONS */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
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
