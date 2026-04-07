import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function ImageDisplay({ src, alt = 'Generated image', isExplicit = false, unrevealedText = 'Click to reveal image' }) {
  const [isRevealed, setIsRevealed] = useState(!isExplicit);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsRevealed(!isExplicit);
  }, [isExplicit]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleToggleReveal = (e) => {
    e.stopPropagation();
    setIsRevealed(!isRevealed);
  };

  if (hasError) {
    return (
      <div
        className="w-full max-w-sm h-64 rounded-lg flex items-center justify-center"
        style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)' }}
      >
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-white/70 text-sm">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Image container */}
      <motion.div
        className="relative rounded-lg overflow-hidden bg-black/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Image */}
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="w-full h-auto max-h-96 object-cover"
        />

        {/* Blur overlay for explicit content */}
        {isExplicit && !isRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 backdrop-blur-xl flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          >
            {/* Icon */}
            <EyeOff className="w-8 h-8 text-white/60" />

            {/* Text */}
            <div className="text-center px-4">
              <p className="text-white text-sm font-medium mb-1">Explicit Content</p>
              <p className="text-white/60 text-xs">{unrevealedText}</p>
            </div>

            {/* Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleReveal}
              className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Eye className="w-4 h-4" />
              Reveal
            </motion.button>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
            <div className="flex gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#7c3aed' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#ff2d9b' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#00f5ff' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Reveal/Hide button in corner (when explicit and revealed) */}
      {isExplicit && isRevealed && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleReveal}
          className="absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
          title="Hide image"
        >
          <EyeOff className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
