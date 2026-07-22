/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Modal from './Modal';
import { Calendar, Clock, BookOpen, Quote } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
}

export default function JournalModal({ isOpen, onClose, entry }: JournalModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry.category} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Banner with absolute gradient overlay */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-900 bg-neutral-900">
          <img
            src={entry.image || '/assets/images/gillian_investigator_look_1783349694204.jpg'}
            alt={entry.title}
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/gillian_investigator_look_1783349694204.jpg'; }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 space-y-1">
            <span className="text-[9px] font-mono font-medium text-gold-500 bg-black/60 px-2 py-0.5 rounded border border-neutral-800">
              {entry.category.toUpperCase()}
            </span>
            <h4 className="font-serif text-lg md:text-xl text-white tracking-wide">
              {entry.title}
            </h4>
          </div>
        </div>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-neutral-500 border-b border-neutral-900 pb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gold-500" />
            <span>{entry.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gold-500" />
            <span>{entry.readTime}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <BookOpen className="h-3.5 w-3.5 text-gold-500" />
            <span>OFFICIAL LOG</span>
          </div>
        </div>

        {/* Article Body */}
        <div className="text-sm text-neutral-300 leading-relaxed space-y-4">
          {entry.content.split('\n\n').map((paragraph, index) => {
            // Check if paragraph is a quote block
            if (paragraph.startsWith('>')) {
              return (
                <div
                  key={index}
                  className="relative pl-8 pr-4 py-4 my-6 rounded border-l-2 border-gold-500 bg-gold-500/5 italic text-gold-200 font-serif text-base"
                >
                  <Quote className="absolute left-2.5 top-3.5 h-4 w-4 text-gold-500/40 rotate-180" />
                  <p className="leading-relaxed">
                    {paragraph.replace('>', '').trim()}
                  </p>
                </div>
              );
            }
            return (
              <p key={index} className="text-neutral-300">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-900 pt-4 flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>WRITTEN BY: GILLIAN ANDERSON</span>
          <span className="uppercase tracking-widest text-gold-500/70">Be Compassionate Guides</span>
        </div>
      </div>
    </Modal>
  );
}
