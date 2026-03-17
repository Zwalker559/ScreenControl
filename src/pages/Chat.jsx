import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Zap } from 'lucide-react';

import BackgroundOrbs from '@/components/BackgroundOrbs';
import ModeSelector from '@/components/chat/ModeSelector';
import ChatMessage from '@/components/chat/ChatMessage';
import TextInput from '@/components/chat/TextInput';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import TypingIndicator from '@/components/chat/TypingIndicator';
import EmptyState from '@/components/chat/EmptyState';
import SpeakingIndicator from '@/components/chat/SpeakingIndicator';
import { speakText, stopSpeaking } from '@/lib/speechUtils';

export default function Chat() {
  const [mode, setMode] = useState('text-to-text');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const usesVoiceInput = mode === 'speech-to-text' || mode === 'speech-to-speech';
  const usesVoiceOutput = mode === 'text-to-speech' || mode === 'speech-to-speech';

  const sendMessage = async (text) => {
    const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const conversationContext = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = conversationContext
      ? `Previous conversation:\n${conversationContext}\n\nUser: ${text}\n\nRespond helpfully and concisely.`
      : `User: ${text}\n\nRespond helpfully and concisely.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    const assistantMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);

    if (usesVoiceOutput) {
      setIsSpeaking(true);
      speakText(response, () => setIsSpeaking(false));
    }
  };

  const handleClear = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setMessages([]);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: '#2C2F56' }}>
      <BackgroundOrbs />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 glass">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}
                animate={{ boxShadow: ['0 0 20px rgba(124,58,237,0.4)', '0 0 30px rgba(255,45,155,0.5)', '0 0 20px rgba(0,245,255,0.4)', '0 0 20px rgba(124,58,237,0.4)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-white font-space font-bold text-lg">Z</span>
              </motion.div>
              <div>
                <h1 className="font-space font-bold text-white text-base leading-tight">ZeowAI</h1>
                <p className="text-white/35 text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  Powered by advanced AI
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-red-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
          <ModeSelector activeMode={mode} onModeChange={setMode} />
        </div>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 min-h-full">
          {messages.length === 0 ? (
            <EmptyState mode={mode} onSuggestionClick={sendMessage} />
          ) : (
            <div className="space-y-5">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>
              <AnimatePresence>
                {isSpeaking && <SpeakingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 flex-shrink-0 glass">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {usesVoiceInput ? (
            <VoiceRecorder onTranscript={sendMessage} disabled={isLoading} />
          ) : (
            <TextInput onSend={sendMessage} disabled={isLoading} />
          )}
        </div>
        {/* Footer */}
        <p className="text-center text-white/20 text-xs pb-3">
          Created by <span className="text-white/35 font-medium">ZWDevelopment</span>
        </p>
      </div>
    </div>
  );
}