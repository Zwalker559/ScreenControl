import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TextInput({ onSend, disabled, placeholder }) {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type your message..."}
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground"
        />
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!text.trim() || disabled}
        className="w-11 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}