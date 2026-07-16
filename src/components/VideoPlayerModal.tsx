/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import Modal from './Modal';
import { MediaItem } from '../types';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaItem;
}

export default function VideoPlayerModal({ isOpen, onClose, mediaItem }: VideoPlayerModalProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={mediaItem.title} maxWidth="max-w-3xl">
      <div className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950">
          {mediaItem.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${mediaItem.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={mediaItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs font-mono p-6 text-center">
              <p>No video available for this item.</p>
              <p className="text-neutral-600 mt-1">{mediaItem.videoPlaceholderText}</p>
            </div>
          )}
        </div>

        {/* Info bar below video */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-neutral-900 text-gold-500 px-2 py-1 rounded border border-neutral-800">
              {mediaItem.category}
            </span>
            <span className="text-[10px] font-mono text-neutral-500">{mediaItem.duration}</span>
          </div>
          <a
            href={mediaItem.youtubeId ? `https://www.youtube.com/watch?v=${mediaItem.youtubeId}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-neutral-500 hover:text-gold-500 transition-colors"
          >
            Open on YouTube
          </a>
        </div>
      </div>
    </Modal>
  );
}
