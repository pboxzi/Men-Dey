import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeMode } from '../utils/theme';

interface ThemeToggleProps {
  mode: ThemeMode;
  onToggle: () => void;
}

export default function ThemeToggle({ mode, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative p-1.5 rounded-full border border-neutral-800 hover:border-gold-500/40 bg-neutral-900/50 transition-all active:scale-90"
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="w-5 h-5 relative">
        <motion.div
          initial={false}
          animate={{ 
            opacity: mode === 'dark' ? 1 : 0, 
            scale: mode === 'dark' ? 1 : 0.5,
            rotate: mode === 'dark' ? 0 : -90 
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-3.5 w-3.5 text-gold-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{ 
            opacity: mode === 'light' ? 1 : 0, 
            scale: mode === 'light' ? 1 : 0.5,
            rotate: mode === 'light' ? 90 : 0 
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="h-3.5 w-3.5 text-gold-500" />
        </motion.div>
      </div>
    </button>
  );
}
