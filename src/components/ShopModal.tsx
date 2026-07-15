/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Modal from './Modal';
import { ShoppingBag, Plus, Minus, Check, ChevronRight, Truck, Info, Mail, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShopItem } from '../types';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXCLUSIVE_MERCH: ShopItem[] = [
  {
    id: 'pencil-set',
    name: "Scully Forensic Stylus & Magnifier",
    price: "24.99",
    category: "Collectibles",
    imagePlaceholder: "🔬",
    description: "Inspired by a legendary standard of forensic investigation. Includes a metallic tactical pen and optical-grade card magnifier inside a laser-etched case.",
    details: [
      "Laser-etched protective investigator steel case",
      "Optical-grade custom reading lens",
      "A tribute to scientific inquiry"
    ]
  },
  {
    id: 'gillian-book',
    name: "We Manifesto Hardcover (Signed)",
    price: "49.00",
    category: "Literary",
    imagePlaceholder: "📚",
    description: "The ultimate guide to collective strength and self-worth, personally signed by Gillian Anderson. Features custom gilded edges and a protective luxury dust jacket.",
    details: [
      "Hand-signed inside title page by Gillian",
      "Gold gilt edges with linen binding",
      "All royalties benefit youth mentorship"
    ]
  },
  {
    id: 'be-kind-hoodie',
    name: "Signature 'Connection' Hoodie",
    price: "75.00",
    category: "Apparel",
    imagePlaceholder: "🧥",
    description: "Crafted from heavy 450GSM organic French terry cotton. Embroidered in custom gold lettering with Gillian's reminder: 'Connection is a superpower. Every child deserves mentorship.'",
    details: [
      "100% organic cotton French terry",
      "Gold embroidery signature script detailing",
      "Oversized vintage fit with ribbed side panels"
    ]
  },
  {
    id: 'scully-retro-tee',
    name: "The X-Files Nostalgia Retro Tee",
    price: "34.99",
    category: "Apparel",
    imagePlaceholder: "👽",
    description: "Celebrate the science fiction legacy with the official retro t-shirt of Gillian Anderson's iconic role as Agent Scully. Heavyweight vintage-washed fabric for a lived-in feel.",
    details: [
      "100% combed ringspun cotton",
      "Distressed vintage screen-printed graphic",
      "Made with sustainable zero-waste ink"
    ]
  }
];

export default function ShopModal({ isOpen, onClose }: ShopModalProps) {
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [checkoutStep, setCheckoutStep] = useState<'browse' | 'shipping' | 'success'>('browse');
  
  // Shipping form fields
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [commMethod, setCommMethod] = useState<'Website' | 'Email' | 'WhatsApp' | 'Telegram'>('Email');
  const [commDetail, setCommDetail] = useState('');

  const [generatedRef, setGeneratedRef] = useState('');

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum: number, [id, qty]) => {
    const item = EXCLUSIVE_MERCH.find((p) => p.id === id);
    const q = qty as number;
    return sum + (item ? parseFloat(item.price) * q : 0);
  }, 0);

  const totalItems: number = Object.values(cart).reduce((sum: number, qty) => sum + (qty as number), 0) as number;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItems === 0) return;
    
    // Generate official Shop Reference Number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setGeneratedRef(`KR-SHP-${randomNum}`);
    setCheckoutStep('success');
  };

  const handleReset = () => {
    setCart({});
    setCheckoutStep('browse');
    setName('');
    setCountry('');
    setCity('');
    setAddress('');
    setPostalCode('');
    setPhoneNumber('');
    setCommDetail('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Shop Request" maxWidth="max-w-4xl">
      <AnimatePresence mode="wait">
        {checkoutStep === 'browse' ? (
          <motion.div
            key="browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 md:grid-cols-5"
          >
            {/* Left: Product Feed */}
            <div className="md:col-span-3 space-y-4 text-left">
              <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                EXCLUSIVE LIMITED COLLECTIONS
              </h4>
              <div className="space-y-3">
                {EXCLUSIVE_MERCH.map((item) => {
                  const qtyInCart = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-neutral-900 bg-neutral-900/10 p-4 transition-colors hover:border-neutral-800"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-neutral-950 text-3xl">
                          {item.imagePlaceholder}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-gold-500/70 uppercase">
                                {item.category}
                              </span>
                              <h5 className="text-xs font-semibold text-white">{item.name}</h5>
                            </div>
                            <span className="text-xs font-mono font-bold text-gold-500">
                              ${item.price}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Details & Action */}
                      <div className="mt-3 flex items-center justify-between border-t border-neutral-900/50 pt-2.5">
                        <ul className="hidden sm:block text-[10px] text-neutral-500 space-y-0.5 list-disc pl-4">
                          {item.details.slice(0, 2).map((det, i) => (
                            <li key={i}>{det}</li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-2 ml-auto">
                          {qtyInCart > 0 ? (
                            <div className="flex items-center gap-2 border border-neutral-800 rounded bg-neutral-950 px-1.5 py-0.5">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-[16px] text-center text-xs font-mono font-medium text-white">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-gold-500 font-bold px-3 py-1.5 rounded transition-all active:scale-95"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              Add to Bag
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Shopping Cart Column */}
            <div className="md:col-span-2 rounded-lg border border-neutral-900 bg-neutral-950 p-4 flex flex-col justify-between h-fit min-h-[350px] text-left">
              <div>
                <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase mb-4 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-gold-500" />
                  YOUR SHOPPING BAG
                </h4>

                {totalItems === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    <p className="text-xs">Bag is empty</p>
                    <p className="text-[10px] mt-1">Select an item to begin your collection.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = EXCLUSIVE_MERCH.find((p) => p.id === id);
                      if (!item) return null;
                      const q = qty as number;
                      return (
                        <div key={id} className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-900 pb-2">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white line-clamp-1">{item.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              {q} × ${item.price}
                            </p>
                          </div>
                          <span className="font-mono text-neutral-300">
                            ${(parseFloat(item.price) * q).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {totalItems > 0 && (
                <div className="border-t border-neutral-900 pt-4 mt-4 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-400">Total Merch:</span>
                    <span className="text-gold-500 font-bold">${cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="rounded border border-neutral-900 bg-neutral-950 p-2.5 space-y-1 text-left">
                    <p className="text-[9px] font-mono text-gold-500 font-bold uppercase flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" /> Request Flow Notice
                    </p>
                    <p className="text-[9px] text-neutral-400 leading-snug">
                      Shipping, tax, and handling will be customized during our private discussion. No payment details are captured at this stage.
                    </p>
                  </div>

                  <button
                    onClick={() => setCheckoutStep('shipping')}
                    className="w-full flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Proceed to Shipping Form
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : checkoutStep === 'shipping' ? (
          <motion.div
            key="shipping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-left max-w-2xl mx-auto"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                OFFICIAL SHIPPING REQUEST FORM
              </h4>
              <p className="text-xs text-neutral-400">
                Please complete the detailed physical shipping logistics fields below. This ensures management can review availability and freight parameters for your location.
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
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
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">PHONE NUMBER</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">COUNTRY</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. USA, Canada, UK"
                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">CITY</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Los Angeles"
                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">POSTAL CODE</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="90210"
                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase">DELIVERY ADDRESS</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details, suite, building..."
                  className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">PREFERRED CONTACT METHOD</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['Website', 'Email', 'WhatsApp', 'Telegram'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setCommMethod(method)}
                        className={`py-1.5 rounded text-[10px] font-mono font-medium border text-center transition-all ${
                          commMethod === method
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
                    {commMethod.toUpperCase()} VALUE
                  </label>
                  <input
                    type="text"
                    required
                    value={commDetail}
                    onChange={(e) => setCommDetail(e.target.value)}
                    placeholder={
                      commMethod === 'WhatsApp' ? '+1 (555) 000-0000' :
                      commMethod === 'Email' ? 'john@example.com' :
                      commMethod === 'Telegram' ? '@john_handle' : 'User ID'
                    }
                    className="w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('browse')}
                  className="px-4 py-2 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold rounded text-white transition-colors"
                >
                  Back to Bag
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2 rounded text-xs uppercase tracking-wider transition-all active:scale-95"
                >
                  <Truck className="h-4 w-4" />
                  Submit Official Product Request
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 space-y-6 max-w-xl mx-auto"
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
                WHOA! REQUEST RECEIVED
              </h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="text-gold-500 font-bold">{name}</span>. Your exclusive merchandise order application has been successfully logged.
              </p>
            </div>

            {/* Step Timeline tracker block */}
            <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-4.5 text-left space-y-4">
              <h5 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-1.5">
                Official Shop Request Pipeline
              </h5>
              
              <div className="space-y-3.5 pl-4 border-l border-neutral-900 relative">
                <div className="relative">
                  <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-neutral-950" />
                  <p className="text-xs font-bold text-white leading-none">Step 1: Request Submitted (Active)</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Management is analyzing availability, weight, and local freight parameters for {country}.</p>
                </div>
                <div className="relative opacity-40">
                  <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-neutral-800 ring-4 ring-neutral-950" />
                  <p className="text-xs font-semibold text-neutral-400 leading-none">Step 2: Private Liaison Discussion</p>
                  <p className="text-[10px] text-neutral-500 mt-1">We will contact you via {commMethod} ({commDetail}) to confirm shipping options.</p>
                </div>
                <div className="relative opacity-40">
                  <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-neutral-800 ring-4 ring-neutral-950" />
                  <p className="text-xs font-semibold text-neutral-400 leading-none">Step 3: Offer and Payment Confirmation</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Status switches to "💼 Offer Made" then "💳 Payment Requested" for final charity allocation.</p>
                </div>
                <div className="relative opacity-40">
                  <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-neutral-800 ring-4 ring-neutral-950" />
                  <p className="text-xs font-semibold text-neutral-400 leading-none">Step 4: Dispatch & Tracking</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Status triggers: Preparing 📦 → Shipped 🚚 → In Transit 📍 → Delivered ✅.</p>
                </div>
              </div>
            </div>

            <div className="rounded border border-neutral-900 bg-neutral-900/20 p-4">
              <p className="text-xs italic text-gold-500 font-serif leading-relaxed">
                "Thank you for supporting this official platform and the charitable organizations we work with. Your energy and support means a lot. Be compassionate."
              </p>
              <p className="text-[9px] text-neutral-500 font-mono mt-2 uppercase tracking-widest">— GILLIAN ANDERSON</p>
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs border border-neutral-800 font-medium text-white rounded transition-colors"
            >
              Back to Shop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
