import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  TrendingUp,
  Award,
  DollarSign,
  Send,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle,
  FileText,
  MessageSquare,
  Gift
} from 'lucide-react';

interface Cause {
  id: string;
  title: string;
  category: string;
  description: string;
  goal: string;
  raised: string;
  progress: number;
}

export default function CharitySection() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isAnonym, setIsAnonym] = useState<boolean>(false);
  const [donateSuccess, setDonateSuccess] = useState<boolean>(false);

  const [donors, setDonors] = useState<any[]>([
    { name: 'Anonymous Seeker', amount: 250, msg: 'In honor of our youth, let’s make a more supportive world.', date: '3 hours ago' },
    { name: 'XFilesGlitch_01', amount: 50, msg: 'Support youth mentorship! Gillian is a legend.', date: '5 hours ago' },
    { name: 'CapeTownDreamer', amount: 100, msg: 'Together we stand for youth transitions and mentorship.', date: '1 day ago' }
  ]);

  const causes: Cause[] = [
    {
      id: 'cause-1',
      title: 'SAYes Mentoring Transition Grants',
      category: 'YOUTH ADVOCACY',
      description: 'Funding transition pathways, education, and steady mentorship for youth transitioning out of state care in South Africa.',
      goal: '$500,000',
      raised: '$412,890',
      progress: 82
    },
    {
      id: 'cause-2',
      title: 'West End Young Actors Co-op',
      category: 'DRAMATIC ARTS',
      description: 'Creating vibrant, fully-funded spaces and mentorship for underprivileged aspiring actors on London’s West End stages.',
      goal: '$250,000',
      raised: '$198,400',
      progress: 79
    },
    {
      id: 'cause-3',
      title: 'We Manifesto Self-Worth Circles',
      category: 'WOMEN SUPPORT',
      description: 'Supporting global community workshops and accessible self-worth programs focused on the principles of the "We" Manifesto.',
      goal: '$150,000',
      raised: '$112,000',
      progress: 74
    }
  ];

  // Dynamic impact descriptor based on chosen amount
  const getImpactDescriptor = (amount: number) => {
    if (amount <= 25) return 'Sponsors 2 therapeutic mentoring sessions for care-experienced youth.';
    if (amount <= 50) return 'Provides 10 custom transition-planning starter guides for graduates.';
    if (amount <= 100) return 'Sponsors 1 week of intensive dramatic arts training for a young scholar.';
    if (amount <= 250) return 'Secures local transport and housing support for mentorship retreats.';
    return 'Funds comprehensive mentoring programs, curriculum guides, and counselor training.';
  };

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;

    const donorNameVal = isAnonym ? 'Quiet Supporter' : donorName.trim() || 'Anonymous Supporter';
    const newDonor = {
      name: donorNameVal,
      amount: finalAmount,
      msg: donorMessage.trim() || 'Be compassionate guides for each other.',
      date: 'Just now'
    };

    setDonors([newDonor, ...donors]);
    setDonateSuccess(true);

    // Reset Form
    setTimeout(() => {
      setDonateSuccess(false);
      setDonorName('');
      setDonorMessage('');
      setCustomAmount('');
      setIsAnonym(false);
    }, 5000);
  };

  return (
    <section id="charity-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute right-1/4 top-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Heart className="h-3.5 w-3.5" />
            GILLIAN ANDERSON PHILANTHROPIC WORK
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Compassion <span className="text-gold-500">Foundation</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Gillian Anderson acts as a passionate patron and leader for youth mentoring foundations, transition advocacy, and dramatic arts. Be part of the quiet difference.
          </p>
        </div>

        {/* Causes Grid row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {causes.map((cause) => (
            <div
              key={cause.id}
              className="p-5 rounded-xl border border-neutral-900 bg-neutral-950/40 flex flex-col justify-between hover:border-neutral-800 transition-all group h-full"
            >
              <div className="space-y-4">
                <span className="text-[9px] font-mono border border-neutral-900 px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 uppercase">
                  {cause.category}
                </span>

                <div className="space-y-1">
                  <h3 className="font-serif text-sm font-bold text-white tracking-wide group-hover:text-gold-500 transition-colors">
                    {cause.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans line-clamp-3">
                    {cause.description}
                  </p>
                </div>
              </div>

              {/* Progress Ticker */}
              <div className="pt-5 mt-4 border-t border-neutral-900/40 space-y-2">
                <div className="flex justify-between font-mono text-[9px] text-neutral-500">
                  <span>RAISED: {cause.raised}</span>
                  <span>GOAL: {cause.goal}</span>
                </div>
                <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 transition-all duration-500"
                    style={{ width: `${cause.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Donation Portal and Donor Wall Grid split */}
        <div className="grid gap-8 lg:grid-cols-12 items-start text-left">
          {/* Donation Form - 7 Cols */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-neutral-950/80 border border-neutral-900 rounded-xl p-6 shadow-xl space-y-6">
              <div className="space-y-2 pb-3 border-b border-neutral-900 flex justify-between items-center">
                <h3 className="font-serif text-sm tracking-widest text-white uppercase font-bold flex items-center gap-2">
                  <DollarSign className="h-4.5 w-4.5 text-gold-500" />
                  MAKE A SUPPORT CONTRIBUTION
                </h3>
                <span className="text-[9px] font-mono text-neutral-500">SECURE DISPATCH</span>
              </div>

              {donateSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gold-500/10 border border-gold-500/30 p-3.5 rounded-lg flex items-center gap-2 text-xs text-gold-500 font-serif italic"
                >
                  <CheckCircle className="h-4.5 w-4.5 text-gold-500 shrink-0" />
                  <span>"Excellent! Your donation has been dispatched silently. Thank you for your kindness."</span>
                </motion.div>
              )}

              {/* Amount buttons */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                  SELECT CONTRIBUTION AMOUNT
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  {[25, 50, 100, 250].map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 rounded border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-gold-500 border-gold-400 text-neutral-950 shadow-md'
                            : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:border-neutral-800 hover:text-white'
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom amount */}
              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                  OR ENTER CUSTOM AMOUNT ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-gold-500/40"
                />
              </div>

              {/* Impact Display Indicator Box */}
              <div className="p-4 rounded bg-gold-500/5 border border-gold-500/10 space-y-1">
                <span className="text-[8px] font-mono text-gold-500 uppercase tracking-widest font-bold block">POTENTIAL IMPACT</span>
                <p className="text-xs text-neutral-300 italic font-serif">
                  {getImpactDescriptor(finalAmount)}
                </p>
              </div>

              {/* Form entries */}
              <form onSubmit={handleDonationSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                      YOUR FULL NAME (OR ALIAS)
                    </label>
                    <input
                      type="text"
                      disabled={isAnonym}
                      required={!isAnonym}
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g. Anonymous Friend"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3.5 py-2 text-white outline-none focus:border-gold-500/40 disabled:opacity-40"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="anonym-check"
                      checked={isAnonym}
                      onChange={(e) => setIsAnonym(e.target.checked)}
                      className="h-4 w-4 rounded bg-neutral-900 border-neutral-800 text-gold-500 accent-gold-500"
                    />
                    <label htmlFor="anonym-check" className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold cursor-pointer">
                      CONTRIBUTE ANONYMOUSLY
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                    heartwarming message (SUPPORT BOARD)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Leave a friendly note for the mentored youth or theater guides..."
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3.5 py-2 text-white outline-none focus:border-gold-500/40 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded-lg tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 animate-pulse" />
                  DISPATCH DONATION CONTRIBUTION (${finalAmount.toFixed(2)})
                </button>
              </form>
            </div>
          </div>

          {/* Donor Wall Feed - 5 Cols */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-serif text-sm tracking-widest text-neutral-400 uppercase font-bold border-b border-neutral-900 pb-3">
              LIVE DONOR BOARD
            </h3>

            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {donors.map((dn, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 space-y-2 transition-all hover:border-neutral-900/80"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white tracking-wide">{dn.name}</h4>
                      <span className="text-[9px] font-mono text-neutral-500">{dn.date}</span>
                    </div>

                    <span className="font-mono text-xs font-bold text-gold-500 bg-gold-500/10 border border-gold-500/20 px-2.5 py-0.5 rounded">
                      +${dn.amount.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed italic font-sans">
                    "{dn.msg}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
