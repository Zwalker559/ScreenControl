import React, { useState, useRef, useEffect } from 'react';
import { Send, Ear, EarOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TextInput({ onSend, disabled, wakeWordEnabled, onToggleWakeWord, isWakeListening, wakeWordDetected, interimText }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [text]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <motion.div 
        className={`flex-1 rounded-2xl px-4 py-3 transition-all focus-within:border-purple-500/50 ${
          (wakeWordDetected || isWakeListening) ? 'ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-400/20' : ''
        }`}
        animate={wakeWordDetected ? {
          boxShadow: ['0 0 20px rgba(0,245,255,0.3)', '0 0 30px rgba(0,245,255,0.5)', '0 0 20px rgba(0,245,255,0.3)'],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ 
          background: 'rgba(255,255,255,0.06)', 
          border: wakeWordDetected ? '1px solid rgba(0,245,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: wakeWordDetected ? '0 0 20px rgba(0,245,255,0.3)' : 'none'
        }}>
        <textarea
          ref={textareaRef}
          value={wakeWordDetected && interimText ? interimText : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={wakeWordDetected ? 'Listening...' : 'Ask Zeow anything...'}
          disabled={disabled || wakeWordDetected}
          rows={1}
          className={`w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-white/25 ${
            wakeWordDetected ? 'text-cyan-300' : 'text-white'
          }`}
        />
      </motion.div>
      
      {/* Wake word toggle */}
      <button
        type="button"
        onClick={onToggleWakeWord}
        title={wakeWordEnabled ? 'Disable "Hey ZeowAI" listener' : 'Enable "Hey ZeowAI" listener'}
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
        style={wakeWordEnabled
          ? { background: 'rgba(0,245,255,0.15)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
        }
      >
        {wakeWordEnabled ? <Ear className="w-4 h-4" /> : <EarOff className="w-4 h-4" />}
      </button>
      
      <motion.button
        type="submit"
        disabled={!text.trim() || disabled}
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-all active:scale-95 disabled:opacity-30"
        whileHover={!disabled && !wakeWordDetected ? { scale: 1.05 } : {}}
        whileTap={!disabled && !wakeWordDetected ? { scale: 0.95 } : {}}
        style={{ background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
      >
        <Send className="w-4 h-4" />
      </motion.button>
    </form>
  );
}