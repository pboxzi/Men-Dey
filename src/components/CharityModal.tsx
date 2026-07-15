/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Modal from './Modal';
import { Heart, DollarSign, Check, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { CharityItem } from '../types';

interface CharityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHARITY_PARTNERS: CharityItem[] = [
  {
    id: 'sayes-mentoring',
    name: "SAYes Mentoring Support",
    description: "Empowering youth in care through structured mentoring, assisting transitions to independent living and stable careers.",
    focus: "Youth Mentorship"
  },
  {
    id: 'young-actors',
    name: "West End Young Actors Co-op",
    description: "Dedicated to promoting diversity and equal access on London’s classical theater stages through youth workshop grants.",
    focus: "Dramatic Arts"
  },
  {
    id: 'we-manifesto',
    name: "We Manifesto Circles",
    description: "Providing counseling resources, books, and self-worth workshops designed around female empowerment and collective support.",
    focus: "Women Advocacy"
  }
];

export default function CharityModal({ isOpen, onClose }: CharityModalProps) {
  const [selectedCharity, setSelectedCharity] = useState<string>('sayes-mentoring');
  const [amount, setAmount] = useState<string>('50');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>('');

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitted(true);
  };

  const selectedData = CHARITY_PARTNERS.find((c) => c.id === selectedCharity);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Charity Initiatives" maxWidth="max-w-2xl">
      {!submitted ? (
        <form onSubmit={handleDonate} className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
              MAKING A DIFFERENCE TOGETHER
            </h4>
            <p className="text-xs leading-relaxed text-neutral-400">
              Gillian has long supported youth mentoring and transition programs privately, without seeking credit or publicity. Following that philosophy, we invite you to join us in supporting these critical missions. Every contribution makes a difference.
            </p>
          </div>

          {/* Charity List */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-neutral-400">SELECT CHARITY INITIATIVE:</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {CHARITY_PARTNERS.map((charity) => (
                <button
                  key={charity.id}
                  type="button"
                  onClick={() => setSelectedCharity(charity.id)}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    selectedCharity === charity.id
                      ? 'border-gold-500 bg-gold-500/5 shadow-md shadow-gold-500/5'
                      : 'border-neutral-900 bg-neutral-900/10 hover:border-neutral-800'
                  }`}
                >
                  <span className="text-[9px] font-mono font-medium text-gold-500 uppercase tracking-wider mb-1">
                    {charity.focus}
                  </span>
                  <span className="text-xs font-medium text-white line-clamp-1 mb-1">
                    {charity.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {charity.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Presets */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-neutral-400">SELECT DONATION AMOUNT:</span>
            <div className="grid grid-cols-4 gap-2">
              {['15', '50', '100', '250'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setIsCustom(false);
                  }}
                  className={`py-2 text-center text-xs font-mono rounded border transition-all ${
                    amount === preset && !isCustom
                      ? 'bg-gold-500 text-neutral-950 font-bold border-gold-500'
                      : 'bg-neutral-900/40 text-neutral-300 border-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Custom Amount"
                  value={isCustom ? amount : ''}
                  onChange={(e) => {
                    setIsCustom(true);
                    setAmount(e.target.value);
                  }}
                  className={`w-full pl-6 pr-3 py-2 rounded text-xs bg-neutral-900/40 text-white outline-none border ${
                    isCustom ? 'border-gold-500' : 'border-neutral-900 focus:border-neutral-800'
                  }`}
                />
              </div>

              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="flex-1 px-3 py-2 rounded text-xs bg-neutral-900/40 text-white outline-none border border-neutral-900 focus:border-neutral-800"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-medium py-2.5 rounded text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Heart className="h-4 w-4" />
            Support {selectedData?.name}
          </button>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 space-y-4 max-w-md mx-auto"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/30">
            <Check className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-xl tracking-wider text-white uppercase">THANK YOU FOR YOUR KINDNESS</h4>
            <p className="text-xs text-neutral-400">
              Your simulated donation of <span className="text-gold-500 font-bold">${parseFloat(amount).toFixed(2)}</span> has been recorded.
            </p>
          </div>
          <div className="rounded border border-neutral-900 bg-neutral-900/30 p-4">
            <p className="text-sm italic text-gold-500 font-serif leading-relaxed">
              "Connection is a superpower. Every child deserves mentorship and a steady guide through life's complex forest. Thank you for being that guide today."
            </p>
            <p className="text-[10px] text-neutral-500 font-mono mt-2 uppercase tracking-widest">— GILLIAN ANDERSON</p>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setAmount('50');
              setIsCustom(false);
              setDonorName('');
            }}
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs border border-neutral-800 font-medium text-white rounded transition-colors"
          >
            Back to Charity
          </button>
        </motion.div>
      )}
    </Modal>
  );
}
