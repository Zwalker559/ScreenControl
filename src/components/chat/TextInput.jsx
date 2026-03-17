import React, { useState, useRef, useEffect } from 'react';
import { Send, Ear, EarOff } from 'lucide-react';
import { createWakeWordListener } from '@/components/speechUtils';

export default function TextInput({ onSend, disabled, wakeWordEnabled, onToggleWakeWord }) {
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
      <div className="flex-1 rounded-2xl px-4 py-3 transition-all focus-within:border-purple-500/50"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask Zeow anything...'
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-white placeholder:text-white/25"
        />
      </div>
      {/* Wake word toggle */}
      <button
        type="button"
        onClick={onToggleWakeWord}
        title={wakeWordEnabled ? 'Disable "Hey Zeow" listener' : 'Enable "Hey Zeow" listener'}
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
        style={wakeWordEnabled
          ? { background: 'rgba(0,245,255,0.15)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
        }
      >
        {wakeWordEnabled ? <Ear className="w-4 h-4" /> : <EarOff className="w-4 h-4" />}
      </button>
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-all active:scale-95 disabled:opacity-30"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}