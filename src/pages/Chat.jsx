import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Zap, Settings, Phone, Volume2, VolumeX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import BackgroundOrbs from '@/components/BackgroundOrbs';
import ChatMessage from '@/components/chat/ChatMessage';
import TextInput from '@/components/chat/TextInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import EmptyState from '@/components/chat/EmptyState';
import SpeakingIndicator from '@/components/chat/SpeakingIndicator';
import { speakText, stopSpeaking, createWakeWordListener } from '@/components/speechUtils';
import { useSettings } from '@/components/SettingsContext';

export default function Chat() {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const wakeListenerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Wake word listener management
  useEffect(() => {
    if (wakeWordEnabled) {
      const listener = createWakeWordListener(
        'hey zeow',
        (text) => { sendMessage(text); },
        (err) => console.warn('Wake word error:', err)
      );
      if (listener) {
        wakeListenerRef.current = listener;
        listener.start();
      }
    } else {
      if (wakeListenerRef.current) {
        wakeListenerRef.current.onend = null;
        wakeListenerRef.current.abort();
        wakeListenerRef.current = null;
      }
    }
    return () => {
      if (wakeListenerRef.current) {
        wakeListenerRef.current.onend = null;
        try { wakeListenerRef.current.abort(); } catch (_) {}
      }
    };
  }, [wakeWordEnabled]);

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

    if (settings.readReplies) {
      stopSpeaking();
      setIsSpeaking(true);
      speakText(response, settings.selectedVoice, () => setIsSpeaking(false));
    }
  };

  const handleClear = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setMessages([]);
  };

  const toggleReadReplies = () => {
    if (isSpeaking) { stopSpeaking(); setIsSpeaking(false); }
    updateSetting('readReplies', !settings.readReplies);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: '#2C2F56' }}>
      <BackgroundOrbs />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 glass">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
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

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Speaker toggle */}
              <button
                onClick={toggleReadReplies}
                title={settings.readReplies ? 'Mute replies' : 'Unmute replies'}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={settings.readReplies
                  ? { background: 'rgba(0,245,255,0.12)', border: '1px solid rgba(0,245,255,0.25)', color: '#00f5ff' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
                }
              >
                {settings.readReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Phone / Call mode */}
              <button
                onClick={() => navigate(createPageUrl('CallMode'))}
                title="Start Speech-to-Speech call"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,45,155,0.1)', border: '1px solid rgba(255,45,155,0.25)', color: '#ff2d9b' }}
              >
                <Phone className="w-4 h-4" />
              </button>

              {/* Settings */}
              <Link
                to={createPageUrl('Settings')}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-white/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Clear */}
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
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 min-h-full">
          {messages.length === 0 ? (
            <EmptyState mode="text-to-text" onSuggestionClick={sendMessage} />
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
          <TextInput
            onSend={sendMessage}
            disabled={isLoading}
            wakeWordEnabled={wakeWordEnabled}
            onToggleWakeWord={() => setWakeWordEnabled(v => !v)}
          />
          {wakeWordEnabled && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-cyan-400/50 text-xs mt-2"
            >
              Listening for "Hey Zeow"...
            </motion.p>
          )}
        </div>
        <p className="text-center text-white/20 text-xs pb-3">
          Created by <span className="text-white/35 font-medium">ZWDevelopment</span>
        </p>
      </div>
    </div>
  );
}