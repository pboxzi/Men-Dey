/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Modal from './Modal';
import { Star, Check, Calendar, ArrowRight, ArrowLeft, MessageSquare, Mail, Phone, Users, MapPin, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REQUEST_TYPES = [
  { id: 'Fan Letter', desc: "Share a direct heartfelt message of kindness" },
  { id: 'Ask Question', desc: "Submit a question about life, acting, or motors" },
  { id: 'Meet & Greet', desc: "Request a quiet private real-world meetup" },
  { id: 'Virtual Meeting', desc: "Coordinate a 15-minute secure video meeting" },
  { id: 'Birthday Greeting', desc: "Request a custom warm birthday message" },
  { id: 'Personalized Video', desc: "A bespoke video greeting for your charity event" },
  { id: 'Autograph Request', desc: "Request an officially signed physical print" },
  { id: 'Interview Request', desc: "Submit a podcast or press interview proposal" },
  { id: 'Business Inquiry', desc: "SAYes Mentoring or dramatic arts proposals" },
  { id: 'Collaboration', desc: "Artistic or charity campaign partnerships" },
  { id: 'Appearance Request', desc: "Invite Gillian to appear at your event" },
  { id: 'Event Invitation', desc: "Official request for film premieres or panels" },
  { id: 'Charity Invitation', desc: "Inquire about hospital or research fundraisers" },
  { id: 'Podcast Invitation', desc: "Invite Gillian to speak on your official show" },
  { id: 'General Request', desc: "Any other unique requests of sincerity" }
];

export default function ExperienceModal({ isOpen, onClose }: ExperienceModalProps) {
  const [step, setStep] = useState<'select' | 'form' | 'contact' | 'review' | 'success'>('select');
  
  // Selection
  const [selectedType, setSelectedType] = useState('Meet & Greet');

  // Form details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('1 Person');
  const [reason, setReason] = useState('');

  // Contact Method
  const [contactMethod, setContactMethod] = useState<'Website' | 'Email' | 'WhatsApp' | 'Telegram'>('Email');
  const [contactDetail, setContactDetail] = useState('');

  const [generatedRef, setGeneratedRef] = useState('');

  const handleNextStep = () => {
    if (step === 'select') setStep('form');
    else if (step === 'form') setStep('contact');
    else if (step === 'contact') setStep('review');
  };

  const handleBackStep = () => {
    if (step === 'form') setStep('select');
    else if (step === 'contact') setStep('form');
    else if (step === 'review') setStep('contact');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !reason || !contactDetail) return;

    // Generate official request reference like KR-REQ-000145
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setGeneratedRef(`KR-REQ-${randomNum}`);
    setStep('success');
  };

  const handleReset = () => {
    setStep('select');
    setName('');
    setEmail('');
    setPreferredDate('');
    setLocation('');
    setAttendees('1 Person');
    setReason('');
    setContactDetail('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Request Gateway" maxWidth="max-w-3xl">
      
      {/* Step Indicators */}
      {step !== 'success' && (
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            {[
              { id: 'select', label: '1. SELECT' },
              { id: 'form', label: '2. DETAILS' },
              { id: 'contact', label: '3. CONTACT' },
              { id: 'review', label: '4. REVIEW' }
            ].map((s) => (
              <span
                key={s.id}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  step === s.id
                    ? 'bg-gold-500/10 text-gold-500 border border-gold-500/25'
                    : 'text-neutral-500'
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-mono text-neutral-600">
            PLATFORM PHILOSOPHY: REQUEST ONLY
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                STEP 1: SELECT YOUR REQUEST TYPE
              </h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Everything begins with a request. Nothing is guaranteed. Select the request template that aligns with your sincerity goal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-[320px] overflow-y-auto pr-1">
              {REQUEST_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between h-24 ${
                    selectedType === type.id
                      ? 'border-gold-500 bg-gold-500/[0.03]'
                      : 'border-neutral-900 bg-neutral-900/10 hover:border-neutral-800'
                  }`}
                >
                  <span className={`text-xs font-bold ${selectedType === type.id ? 'text-gold-500' : 'text-white'}`}>
                    {type.id}
                  </span>
                  <p className="text-[10px] text-neutral-400 leading-normal line-clamp-2 mt-1">
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={handleNextStep}
                className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                STEP 2: COMPLETE THE LOGISTICS DETAILS ({selectedType.toUpperCase()})
              </h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Provide essential logistical specifications so management can cross-reference scheduling options and direct security.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">YOUR FULL NAME</label>
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">TARGET DATE / INTERVAL</label>
                <input
                  type="text"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  placeholder="e.g. Second week of July 2024"
                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">LOCATION (CITY, COUNTRY)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. London, UK"
                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">ATTENDEES COUNT</label>
                <select
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                >
                  <option value="1 Person">1 Person (Just Me)</option>
                  <option value="2 People">2 People</option>
                  <option value="3-5 People">3 - 5 People</option>
                  <option value="Organization">Charity / Group Delegation</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase">
                WHY DOES THIS MATTER TO YOU? (SINCERITY STORY)
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Share your honest story. Your integrity is our core review metric. Detail any childhood cancer support or charity alignments if relevant."
                className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50 resize-none leading-relaxed"
              />
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={handleBackStep}
                className="flex items-center gap-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={!name || !email || !reason}
                onClick={handleNextStep}
                className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'contact' && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                STEP 3: CHOOSE PREFERRED CONTACT METHOD
              </h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Official dialogue must be direct and transparent. Choose how our liaison coordinates should reach out to you.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">CONTACT METHOD</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Website', 'Email', 'WhatsApp', 'Telegram'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setContactMethod(method)}
                      className={`p-3 rounded border font-mono font-medium text-xs text-center transition-all ${
                        contactMethod === method
                          ? 'bg-gold-500/10 border-gold-500 text-gold-500'
                          : 'bg-neutral-900/10 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">
                  {contactMethod.toUpperCase()} INPUT DETAIL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={contactDetail}
                    onChange={(e) => setContactDetail(e.target.value)}
                    placeholder={
                      contactMethod === 'WhatsApp' ? '+1 (555) 000-0000' :
                      contactMethod === 'Email' ? 'john@example.com' :
                      contactMethod === 'Telegram' ? '@telegram_username' : 'Website sanctuary name'
                    }
                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3.5 py-3 text-xs text-white outline-none focus:border-gold-500/50"
                  />
                </div>
                <p className="text-[9px] text-neutral-500 leading-relaxed italic">
                  * Note: Standard security validation will be carried out on this line. Avoid public handles if security is sensitive.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={handleBackStep}
                className="flex items-center gap-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={!contactDetail}
                onClick={handleNextStep}
                className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 px-5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider disabled:opacity-50"
              >
                Review Summary
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                STEP 4: REVIEW PROPOSAL SUMMARY
              </h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Confirm your parameters below. Every request is tracked and enters our official administrative queue.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-4.5 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                <span className="text-[10px] font-mono text-gold-500 font-bold uppercase tracking-wider">
                  Request: {selectedType}
                </span>
                <span className="text-[9px] font-mono text-neutral-500">PHILOSOPHY PROTOCOL</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Name & Email</span>
                  <p className="text-white font-semibold">{name} ({email})</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Preferred Interval</span>
                  <p className="text-white font-semibold">{preferredDate || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Location</span>
                  <p className="text-white font-semibold">{location || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Attendance Count</span>
                  <p className="text-white font-semibold">{attendees}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Direct Contact Bridge</span>
                  <p className="text-gold-500 font-semibold font-mono">{contactMethod}: {contactDetail}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Sincerity Statement</span>
                  <p className="text-neutral-300 italic leading-relaxed font-serif text-xs">"{reason}"</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={handleBackStep}
                className="flex items-center gap-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-2.5 rounded text-xs transition-all active:scale-95 uppercase tracking-wider"
              >
                <Star className="h-4 w-4" />
                Authorize Official Request
              </button>
            </form>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
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
                PROPOSAL ENTERED IN QUEUE
              </h4>
              
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="text-gold-500 font-bold">{name}</span>. Your {selectedType} proposal is registered. Tracking has officially begun.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-4.5 text-left space-y-3.5">
              <h5 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-1.5">
                UNIVERSAL PROPOSAL LIFECYCLE
              </h5>
              
              <div className="space-y-2.5 pl-4 border-l border-neutral-900 relative text-[11px] font-mono text-neutral-400 leading-relaxed">
                <div>
                  <span className="text-white font-semibold">1. Submitted:</span> Entered queue with reference {generatedRef}.
                </div>
                <div>
                  <span className="text-white font-semibold">2. Management Review:</span> Sarah and the team cross-check security, schedules, and sincerity coordinates.
                </div>
                <div>
                  <span className="text-white font-semibold">3. Discussion Bridge:</span> Liaison contacts you via {contactMethod} to discuss parameters.
                </div>
                <div>
                  <span className="text-white font-semibold">4. Agreement & Charity Settlement:</span> Voluntary allocations settled, securing the official slot.
                </div>
              </div>
            </div>

            <div className="rounded border border-neutral-900 bg-neutral-900/20 p-4">
              <p className="text-xs italic text-gold-500 font-serif leading-relaxed">
                "Thank you for sharing your story and taking the time to send this request. Connecting with sincerity is what makes this journey special. Be compassionate."
              </p>
              <p className="text-[9px] text-neutral-500 font-mono mt-2 uppercase tracking-widest">— GILLIAN ANDERSON</p>
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs border border-neutral-800 font-medium text-white rounded transition-colors"
            >
              Back to Requests Gateway
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
