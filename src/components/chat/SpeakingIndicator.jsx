import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';

export default function SpeakingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 text-xs text-primary bg-accent rounded-full px-4 py-2 mx-auto w-fit"
    >
      <Volume2 className="w-3.5 h-3.5" />
      <span>Speaking...</span>
      <div className="flex gap-0.5 items-end h-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-0.5 bg-primary rounded-full"
            animate={{ height: ['4px', '12px', '4px'] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}