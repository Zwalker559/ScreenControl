import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';

export default function SpeakingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 text-xs text-cyan-400 mx-auto w-fit px-4 py-2 rounded-full"
      style={{ background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.15)' }}
    >
      <Volume2 className="w-3.5 h-3.5" />
      <span>Speaking</span>
      <div className="flex gap-0.5 items-end h-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-0.5 rounded-full bg-cyan-400"
            animate={{ height: ['4px', '12px', '4px'] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}