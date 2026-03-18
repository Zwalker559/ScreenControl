import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Mic, Volume2, AudioLines } from 'lucide-react';

const modeInfo = {
  'text-to-text': { icon: MessageSquareText, title: 'Talk to Zeow', desc: 'Say anything and get a helpful response.' },
  'speech-to-text': { icon: Mic, title: 'Talk to Zeow', desc: 'Speak freely and Zeow will reply in text.' },
  'text-to-speech': { icon: Volume2, title: 'Talk to Zeow', desc: 'Type a message and listen as Zeow replies aloud.' },
  'speech-to-speech': { icon: AudioLines, title: 'Talk to Zeow', desc: 'Start talking and Zeow will answer you in real time.' },
};

const suggestions = [
  "Explain quantum computing simply",
  "Write a short poem for me",
  "What's something interesting about space?",
  "Help me brainstorm an idea",
];

export default function EmptyState({ mode, onSuggestionClick }) {
  const info = modeInfo[mode];
  const Icon = info.icon;
  const showSuggestions = mode === 'text-to-text' || mode === 'text-to-speech';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center px-6 py-12"
    >
      <motion.div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}
        animate={{ boxShadow: ['0 0 30px rgba(124,58,237,0.3)', '0 0 60px rgba(255,45,155,0.4)', '0 0 30px rgba(0,245,255,0.3)', '0 0 30px rgba(124,58,237,0.3)'] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <span className="text-white font-space font-bold text-3xl">Z</span>
      </motion.div>

      <h2 className="font-space font-semibold text-xl text-white mb-1">{info.title}</h2>
      <p className="text-white/40 text-sm max-w-xs mb-8">{info.desc}</p>

      {showSuggestions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
          {suggestions.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => onSuggestionClick(s)}
              className="p-3.5 text-left text-sm text-white/60 hover:text-white rounded-xl transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {s}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}