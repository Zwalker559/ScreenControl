import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function UnfilteredWarningModal({ isOpen, onConfirm, onCancel }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirm();
      setIsConfirming(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'rgba(44, 47, 86, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full" style={{ background: 'rgba(255, 59, 48, 0.2)' }}>
                  <AlertTriangle className="w-6 h-6" style={{ color: '#ff3b30' }} />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-space font-bold text-white text-center mb-3">
                Enable Unfiltered Mode?
              </h2>

              {/* Description */}
              <p className="text-white/70 text-sm text-center mb-5 leading-relaxed">
                Enabling unfiltered mode will disable all content filters. This means:
              </p>

              {/* Warning points */}
              <div className="space-y-2.5 mb-6">
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#ff3b30' }} />
                  <p className="text-white/60 text-xs">
                    <span className="font-semibold text-white/80">Profanity & explicit language</span> will not be filtered
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#ff3b30' }} />
                  <p className="text-white/60 text-xs">
                    <span className="font-semibold text-white/80">AI responses</span> may contain non-PG content
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#ff3b30' }} />
                  <p className="text-white/60 text-xs">
                    <span className="font-semibold text-white/80">Image generation</span> can create explicit content
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#ff3b30' }} />
                  <p className="text-white/60 text-xs">
                    <span className="font-semibold text-white/80">You can request any content</span> without restrictions
                  </p>
                </div>
              </div>

              {/* Additional warning */}
              <div
                className="p-3 rounded-lg mb-6 text-xs"
                style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)' }}
              >
                <p className="text-white/70">
                  <span className="font-semibold text-white/90">Note:</span> Explicit images will still be blurred by default. Click to reveal them.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all"
                  style={{
                    background: isConfirming
                      ? 'linear-gradient(135deg, rgba(255, 59, 48, 0.8), rgba(255, 59, 48, 0.6))'
                      : 'linear-gradient(135deg, #ff3b30, #ff9500)',
                    border: '1px solid rgba(255, 59, 48, 0.5)',
                  }}
                >
                  {isConfirming ? 'Confirming...' : 'I Understand, Enable'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
