import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, AlertCircle } from 'lucide-react';

export default function ImageGeneratorInput({ onGenerate, isLoading = false, disabled = false }) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter an image description');
      return;
    }

    if (prompt.length > 500) {
      setError('Prompt is too long (max 500 characters)');
      return;
    }

    setError('');
    onGenerate(prompt);
    setPrompt('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError('');
            }}
            placeholder="Describe the image you want to generate..."
            disabled={isLoading || disabled}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-white/30 border border-white/10 focus:border-white/20 focus:outline-none transition-all disabled:opacity-50"
          />
          {prompt.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
              {prompt.length}/500
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isLoading || disabled || !prompt.trim()}
          className="px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{
            background: isLoading || disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7c3aed, #ff2d9b)',
            border: '1px solid rgba(124,58,237,0.4)',
          }}
        >
          <Wand2 className="w-4 h-4" />
          Generate
        </motion.button>
      </div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-2 p-2.5 rounded-lg text-xs"
          style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-white/70">{error}</span>
        </motion.div>
      )}
    </form>
  );
}
