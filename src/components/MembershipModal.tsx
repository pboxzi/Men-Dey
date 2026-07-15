/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Modal from './Modal';
import { Crown, Check, ShieldCheck, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEMBERSHIP_TIERS = [
  {
    id: 'bronze',
    name: "Bronze Supporter",
    price: "Free",
    iconColor: "text-neutral-400",
    bgColor: "from-neutral-900 to-neutral-950",
    borderColor: "border-neutral-800",
    benefits: [
      "Access to public official forum community",
      "Read official weekly journal logs",
      "Submit questions to 'Ask Gillian'"
    ]
  },
  {
    id: 'silver',
    name: "Silver Guardian",
    price: "$5/mo",
    iconColor: "text-slate-300",
    bgColor: "from-neutral-900 to-neutral-950",
    borderColor: "border-neutral-700",
    benefits: [
      "Everything in Bronze Supporter",
      "All dues go directly to SAYes Youth Mentoring",
      "Official Digital Guardian badge",
      "Access to localized Country Clubs"
    ]
  },
  {
    id: 'gold',
    name: "Gold Ambassador",
    price: "$15/mo",
    iconColor: "text-amber-400",
    bgColor: "from-amber-950/10 to-neutral-950",
    borderColor: "border-amber-500/20",
    benefits: [
      "Everything in Silver Guardian",
      "Participate in live group Q&A webcasts",
      "Early notifications of real-world experiences",
      "Digital Membership Card"
    ]
  },
  {
    id: 'platinum',
    name: "Platinum Visionary",
    price: "$50/mo",
    iconColor: "text-cyan-400",
    bgColor: "from-cyan-950/10 to-neutral-950",
    borderColor: "border-cyan-500/20",
    benefits: [
      "Everything in Gold Ambassador",
      "Priority consideration in Request Gateway review",
      "Invites to official private virtual gatherings",
      "Direct chat support connection with Sarah (MGT)"
    ]
  },
  {
    id: 'legend',
    name: "Legend Patron",
    price: "$100/mo",
    iconColor: "text-gold-500",
    bgColor: "from-gold-500/5 to-neutral-950",
    borderColor: "border-gold-500/30",
    benefits: [
      "Everything in Platinum Visionary",
      "Elite Direct Channel access token",
      "Guaranteed seat at annual official Charity Gala",
      "Dedicated management VIP liaison setup"
    ]
  }
];

export default function MembershipModal({ isOpen, onClose }: MembershipModalProps) {
  const [membershipType, setMembershipType] = useState('gold');
  const [reason, setReason] = useState('');
  const [contactMethod, setContactMethod] = useState<'Website' | 'Email' | 'WhatsApp' | 'Telegram'>('Email');
  const [contactDetail, setContactDetail] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [generatedRef, setGeneratedRef] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !reason || !contactDetail) return;
    
    // Generate official reference number like KR-MEM-000145
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setGeneratedRef(`GA-MEM-${randomNum}`);
    setSubmitted(true);
  };

  const activeTier = MEMBERSHIP_TIERS.find(t => t.id === membershipType) || MEMBERSHIP_TIERS[2];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Official Membership" maxWidth="max-w-3xl">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
              PLATFORM MEMBERSHIP APPLICATION
            </h4>
            <p className="text-xs leading-relaxed text-neutral-400">
              Every relationship is built through transparency and trust. Under our platform philosophy, dues paid by official members are allocated directly to youth mentoring and transition programs. Fill out your details below to request your tier connection.
            </p>
          </div>

          {/* Tier Cards Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              1. Select Desired Membership Level
            </label>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {MEMBERSHIP_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setMembershipType(tier.id)}
                  className={`flex flex-col text-left p-3 rounded-lg border bg-gradient-to-b ${tier.bgColor} transition-all ${
                    membershipType === tier.id
                      ? 'border-gold-500 ring-1 ring-gold-500/20 scale-[1.02]'
                      : `${tier.borderColor} hover:border-neutral-700`
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-1">
                    <Crown className={`h-4.5 w-4.5 ${tier.iconColor}`} />
                    <span className="text-[9px] font-mono font-semibold text-gold-500">{tier.price}</span>
                  </div>
                  <span className="text-[11px] font-bold text-white leading-tight mb-1">{tier.name}</span>
                  <ul className="text-[8px] text-neutral-500 space-y-0.5 list-disc pl-3 flex-1 mt-1 leading-snug">
                    {tier.benefits.slice(0, 3).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-neutral-900/60" />

          {/* Core Info */}
          <div className="space-y-4">
            <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              2. Complete Official Request Parameters
            </label>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">PREFERRED CONTACT METHOD</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['Website', 'Email', 'WhatsApp', 'Telegram'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setContactMethod(method)}
                      className={`py-1.5 rounded text-[10px] font-mono font-medium border text-center transition-all ${
                        contactMethod === method
                          ? 'bg-gold-500/10 border-gold-500 text-gold-500'
                          : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">
                  {contactMethod.toUpperCase()} PHONE / HANDLE / VALUE
                </label>
                <input
                  type="text"
                  required
                  value={contactDetail}
                  onChange={(e) => setContactDetail(e.target.value)}
                  placeholder={
                    contactMethod === 'WhatsApp' ? '+1 (555) 000-0000' :
                    contactMethod === 'Email' ? 'john@example.com' :
                    contactMethod === 'Telegram' ? '@john_doe' : 'Sanctuary ID'
                  }
                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase">
                REASON FOR APPLICATION / SINCERITY STATEMENT
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you wish to join this specific tier of our community? Share your story with us."
                className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase">
                ADDITIONAL RELATIONSHIP INFORMATION (OPTIONAL)
              </label>
              <textarea
                rows={2}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any references, previous requests, or charity connection details..."
                className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider shadow-md shadow-gold-500/10"
          >
            <ShieldCheck className="h-4 w-4" />
            Submit Request for {activeTier.name}
          </button>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-5 max-w-xl mx-auto"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/30">
            <Check className="h-7 w-7 animate-bounce" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-xs font-mono font-bold text-amber-500">
                🟡 Submitted
              </span>
              <span className="text-neutral-600 font-mono text-xs">|</span>
              <span className="font-mono text-xs text-neutral-300 font-semibold">{generatedRef}</span>
            </div>
            
            <h4 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
              MEMBERSHIP REQUEST REGISTERED
            </h4>
            
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              Thank you, <span className="text-gold-500 font-bold">{name}</span>. Your application to join the <span className="text-white font-semibold">{activeTier.name}</span> has been securely entered into the Management Gateway.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-4.5 text-left space-y-3">
            <h5 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-1.5">
              WHAT HAPPENS NEXT?
            </h5>
            <ol className="text-[11px] font-mono text-neutral-400 space-y-2 list-decimal pl-4 leading-relaxed">
              <li>
                <span className="text-white font-semibold">Management Review:</span> Sarah and the security team assess your story and coordinates.
              </li>
              <li>
                <span className="text-white font-semibold">Verification Contact:</span> We will reach out to you via <span className="text-gold-500 font-semibold">{contactMethod}</span> ({contactDetail}) to verify details.
              </li>
              <li>
                <span className="text-white font-semibold">Charity Settlement:</span> Dues allocation triggers a direct youth transitions mentoring donation.
              </li>
              <li>
                <span className="text-white font-semibold">Access Authorization:</span> Your official login is upgraded to activated state on the portal.
              </li>
            </ol>
          </div>

          <div className="rounded border border-neutral-900 bg-neutral-900/20 p-4">
            <p className="text-xs italic text-gold-500 font-serif leading-relaxed">
              "Every connection, every bridge starts with simple transparency. Thank you for your compassion and support of youth mentoring programs. It means a lot. Be compassionate."
            </p>
            <p className="text-[9px] text-neutral-500 font-mono mt-2 uppercase tracking-widest">— GILLIAN ANDERSON</p>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setName('');
              setEmail('');
              setReason('');
              setContactDetail('');
              setAdditionalInfo('');
            }}
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs border border-neutral-800 font-medium text-white rounded transition-all active:scale-95"
          >
            Apply for another tier
          </button>
        </motion.div>
      )}
    </Modal>
  );
}
