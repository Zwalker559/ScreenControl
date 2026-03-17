import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Mic, Volume2, AudioLines, Sparkles } from 'lucide-react';

const modeInfo = {
  'text-to-text': { icon: MessageSquareText, title: 'Text to Text', desc: 'Type a message and get a written response from AI.' },
  'speech-to-text': { icon: Mic, title: 'Speech to Text', desc: 'Speak your message and receive a written AI response.' },
  'text-to-speech': { icon: Volume2, title: 'Text to Speech', desc: 'Type a message and hear the AI response spoken aloud.' },
  'speech-to-speech': { icon: AudioLines, title: 'Speech to Speech', desc: 'Speak your message and hear the AI response spoken aloud.' },
};

const suggestions = [
  "Explain quantum computing simply",
  "Write a haiku about the ocean",
  "What's the meaning of life?",
  "Tell me a fun fact",
];

export default function EmptyState({ mode, onSuggestionClick }) {
  const info = modeInfo[mode];
  const Icon = info.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center px-6 py-12"
    >
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-xl font-semibold mb-2">{info.title} Mode</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-8">{info.desc}</p>

      {(mode === 'text-to-text' || mode === 'text-to-speech') && (
        <div className="grid grid-cols-2 gap-2 max-w-md w-full">
          {suggestions.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onSuggestionClick(s)}
              className="p-3 text-left text-sm bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-accent/50 transition-all"
            >
              {s}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}