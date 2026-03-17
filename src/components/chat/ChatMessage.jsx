import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, User, Sparkles } from 'lucide-react';
import { speakText, stopSpeaking } from '@/lib/speechUtils';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(message.content, () => setIsSpeaking(false));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1
        ${isUser ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      <div className={`max-w-[75%] group ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border shadow-sm rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <button
            onClick={handleSpeak}
            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isSpeaking ? 'Stop' : 'Listen'}
          </button>
        )}
      </div>
    </motion.div>
  );
}