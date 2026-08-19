/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Modal from './Modal';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
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
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[rgba(0,0,0,0.06)] bg-white">
          <img
            src={entry.image}
            alt={entry.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-100/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 space-y-1">
            <span className="text-[11px] font-mono font-medium text-[#C89B3C] bg-black/60 px-2 py-0.5 rounded border border-[rgba(0,0,0,0.06)]">
              {entry.category.toUpperCase()}
            </span>
            <h4 className="font-serif text-lg md:text-xl text-white tracking-wide">
              {entry.title}
            </h4>
          </div>
        </div>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#444] border-b border-[rgba(0,0,0,0.06)] pb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#C89B3C]" />
            <span>{entry.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#C89B3C]" />
            <span>{entry.readTime}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <BookOpen className="h-3.5 w-3.5 text-[#C89B3C]" />
            <span>OFFICIAL LOG</span>
          </div>
        </div>

        {/* Article Body */}
        <div
          className="text-sm text-[#444] leading-relaxed space-y-4 [&_p]:leading-relaxed [&_p]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[#C89B3C] [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:font-serif [&_blockquote]:text-base [&_blockquote]:text-gold-200 [&_blockquote]:bg-[#C89B3C]/5 [&_blockquote]:rounded [&_blockquote]:my-6"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.content) }}
        />

        {/* Footer */}
        <div className="border-t border-[rgba(0,0,0,0.06)] pt-4 flex justify-between items-center text-[10px] font-mono text-[#444]">
          <span>WRITTEN BY: GILLIAN ANDERSON</span>
          <span className="uppercase tracking-widest text-[#C89B3C]/70">Be Compassionate Guides</span>
        </div>
      </div>
    </Modal>
  );
}
