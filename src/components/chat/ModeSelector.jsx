import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Mic, Volume2, AudioLines } from 'lucide-react';

const modes = [
  { id: 'text-to-text', label: 'Text → Text', shortLabel: 'T→T', icon: MessageSquareText },
  { id: 'speech-to-text', label: 'Speech → Text', shortLabel: 'S→T', icon: Mic },
  { id: 'text-to-speech', label: 'Text → Speech', shortLabel: 'T→S', icon: Volume2 },
  { id: 'speech-to-speech', label: 'Speech → Speech', shortLabel: 'S→S', icon: AudioLines },
];

export default function ModeSelector({ activeMode, onModeChange }) {
  return (
    <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center
              ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {isActive && (
              <motion.div
                layoutId="mode-bg"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(255,45,155,0.4))' }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{mode.label}</span>
              <span className="sm:hidden">{mode.shortLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}