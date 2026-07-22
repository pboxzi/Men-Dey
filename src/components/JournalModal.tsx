/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Modal from './Modal';
import { Calendar, Clock, BookOpen } from 'lucide-react';
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
            src={entry.image}
            alt={entry.title}
            referrerPolicy="no-referrer"
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
        <div
          className="text-sm text-neutral-300 leading-relaxed space-y-4 [&_p]:leading-relaxed [&_p]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gold-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:font-serif [&_blockquote]:text-base [&_blockquote]:text-gold-200 [&_blockquote]:bg-gold-500/5 [&_blockquote]:rounded [&_blockquote]:my-6"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {/* Footer */}
        <div className="border-t border-neutral-900 pt-4 flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>WRITTEN BY: GILLIAN ANDERSON</span>
          <span className="uppercase tracking-widest text-gold-500/70">Be Compassionate Guides</span>
        </div>
      </div>
    </Modal>
  );
}
