import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, User } from 'lucide-react';
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 text-xs font-bold
        ${isUser
          ? 'bg-white/10 text-white/70 border border-white/10'
          : 'border border-purple-500/30'
        }`}
        style={!isUser ? { background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)', color: '#fff' } : {}}
      >
        {isUser ? <User className="w-4 h-4" /> : 'Z'}
      </div>

      <div className={`max-w-[78%] group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'text-white rounded-tr-sm'
            : 'text-white/90 rounded-tl-sm'
        }`}
          style={isUser
            ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(255,45,155,0.5))', border: '1px solid rgba(255,255,255,0.1)' }
            : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <button
            onClick={handleSpeak}
            className="mt-1.5 flex items-center gap-1 text-xs text-white/30 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isSpeaking ? 'Stop' : 'Listen'}
          </button>
        )}
      </div>
    </motion.div>
  );
}