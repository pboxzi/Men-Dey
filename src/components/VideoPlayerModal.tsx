/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { MediaItem } from '../types';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaItem;
}

export default function VideoPlayerModal({ isOpen, onClose, mediaItem }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeCaptionIdx, setActiveCaptionIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Total simulated video duration in seconds (e.g. 25 seconds)
  const duration = 25;

  useEffect(() => {
    if (isOpen && isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return duration;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, isPlaying]);

  useEffect(() => {
    // Determine active caption index based on progress
    const capCount = mediaItem.subtitles.length;
    if (capCount === 0) return;

    const segmentDuration = duration / capCount;
    const idx = Math.min(Math.floor(progress / segmentDuration), capCount - 1);
    setActiveCaptionIdx(idx);
  }, [progress, mediaItem.subtitles.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setProgress(0);
    setActiveCaptionIdx(0);
    setIsPlaying(true);
  };

  const progressPercent = (progress / duration) * 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mediaItem.title} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Screen Area */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col items-center justify-between p-6">
          {/* Top Info */}
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[10px] font-mono bg-black/60 backdrop-blur text-gold-500 px-2 py-1 rounded border border-neutral-800">
              {mediaItem.category.toUpperCase()}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                SIMULATED LIVE STREAM
              </span>
            </div>
          </div>

          {/* Visual Wave / Speaker Aura */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="flex gap-1 items-end h-24">
              {[...Array(24)].map((_, i) => {
                // Vary heights dynamically if playing
                const delay = i * 0.15;
                return (
                  <motion.div
                    key={i}
                    animate={isPlaying ? { height: ['10px', '70px', '20px', '90px', '10px'] } : { height: '15px' }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      delay: delay,
                      ease: 'easeInOut',
                    }}
                    className="w-1.5 rounded-t bg-gold-500"
                  />
                );
              })}
            </div>
          </div>

          {/* Subtitles Overlay */}
          <div className="w-full text-center px-4 py-2 z-10 mt-auto bg-black/40 backdrop-blur-sm rounded border border-neutral-900/40">
            <motion.p
              key={activeCaptionIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="font-serif italic text-sm text-gold-200 leading-relaxed min-h-[44px]"
            >
              "{mediaItem.subtitles[activeCaptionIdx]}"
            </motion.p>
          </div>

          {/* Buffering/Status indicator overlay */}
          {!isPlaying && progress < duration && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
              <button
                onClick={handlePlayPause}
                className="p-4 rounded-full bg-gold-500 text-neutral-950 transition-transform active:scale-90 hover:scale-105"
              >
                <Play className="h-6 w-6 fill-neutral-950" />
              </button>
            </div>
          )}
        </div>

        {/* Video Controls bar */}
        <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-3 flex items-center gap-4 text-xs font-mono">
          <button
            onClick={handlePlayPause}
            className="p-1.5 rounded text-neutral-400 hover:text-white transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-neutral-400" /> : <Play className="h-4 w-4 fill-neutral-400" />}
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Timeline slider */}
          <div className="flex-1 relative h-1 rounded bg-neutral-900 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute left-0 top-0 bottom-0 bg-gold-500 transition-all duration-100"
            />
          </div>

          {/* Time text */}
          <span className="text-neutral-500 font-medium">
            0:{Math.floor(progress).toString().padStart(2, '0')} / 0:{duration}
          </span>

          {/* Sound trigger */}
          <button
            onClick={() => setMuted(!muted)}
            className="p-1.5 rounded text-neutral-400 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Modal>
  );
}
