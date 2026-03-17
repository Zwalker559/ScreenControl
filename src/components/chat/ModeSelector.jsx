import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Mic, Volume2, AudioLines } from 'lucide-react';

const modes = [
  { id: 'text-to-text', label: 'Text → Text', icon: MessageSquareText, desc: 'Type & read' },
  { id: 'speech-to-text', label: 'Speech → Text', icon: Mic, desc: 'Speak & read' },
  { id: 'text-to-speech', label: 'Text → Speech', icon: Volume2, desc: 'Type & listen' },
  { id: 'speech-to-speech', label: 'Speech → Speech', icon: AudioLines, desc: 'Speak & listen' },
];

export default function ModeSelector({ activeMode, onModeChange }) {
  return (
    <div className="flex gap-2 p-1 bg-secondary/60 rounded-xl">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center
              ${isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {isActive && (
              <motion.div
                layoutId="mode-bg"
                className="absolute inset-0 bg-primary rounded-lg"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{mode.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}