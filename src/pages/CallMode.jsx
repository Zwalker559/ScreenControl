import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, PhoneOff, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import BackgroundOrbs from '@/components/BackgroundOrbs';
import { createSpeechRecognition, speakText, stopSpeaking } from '@/components/speechUtils';
import { useSettings } from '@/components/SettingsContext';

const WAVES = [1, 2, 3, 4];

function WaveRings({ active, color }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {WAVES.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: color }}
          animate={active ? {
            scale: [1, 1.6 + i * 0.3, 1.6 + i * 0.3],
            opacity: [0.6, 0, 0],
          } : { scale: 1, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
          initial={{ width: 120, height: 120 }}
        />
      ))}
    </div>
  );
}

export default function CallMode() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [phase, setPhase] = useState('listening'); // listening | processing | speaking
  const [userText, setUserText] = useState('');
  const [aiText, setAiText] = useState('');
  const [lastUserText, setLastUserText] = useState('');
  const [lastAiText, setLastAiText] = useState('');
  const messagesRef = useRef([]);
  const recRef = useRef(null);

  const startListening = () => {
    setPhase('listening');
    setUserText('');
    setAiText('');

    const rec = createSpeechRecognition(
      (text) => setUserText(text),
      async (finalText) => {
        if (!finalText) { startListening(); return; }
        setLastUserText(finalText);
        setPhase('processing');
        stopSpeaking();

        const context = messagesRef.current.slice(-8).map(m => `${m.role}: ${m.content}`).join('\n');
        const prompt = context
          ? `Previous conversation:\n${context}\n\nUser: ${finalText}\n\nRespond helpfully and concisely.`
          : `User: ${finalText}\n\nRespond helpfully and concisely.`;

        const response = await base44.integrations.Core.InvokeLLM({ prompt });

        messagesRef.current = [
          ...messagesRef.current,
          { role: 'user', content: finalText },
          { role: 'assistant', content: response },
        ];

        setLastAiText(response);
        setPhase('speaking');
        speakText(response, settings.selectedVoice, () => {
          setPhase('listening');
          startListening();
        });
      },
      () => { setPhase('listening'); startListening(); }
    );

    if (rec) { recRef.current = rec; rec.start(); }
  };

  useEffect(() => {
    startListening();
    return () => {
      if (recRef.current) recRef.current.abort();
      stopSpeaking();
    };
  }, []);

  const handleRepeat = () => {
    if (!lastAiText) return;
    stopSpeaking();
    setPhase('speaking');
    speakText(lastAiText, settings.selectedVoice, () => {
      setPhase('listening');
      startListening();
    });
  };

  const handleLeave = () => {
    if (recRef.current) recRef.current.abort();
    stopSpeaking();
    navigate(createPageUrl('Chat'));
  };

  const isListening = phase === 'listening';
  const isSpeaking = phase === 'speaking';
  const isProcessing = phase === 'processing';

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#2C2F56' }}>
      <BackgroundOrbs />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-6">
        {/* Status text above icon */}
        <AnimatePresence mode="wait">
          {isSpeaking && lastAiText && (
            <motion.div
              key="ai-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center max-h-32 overflow-y-auto"
            >
              <p className="text-white/80 text-sm leading-relaxed">{lastAiText}</p>
            </motion.div>
          )}
          {isProcessing && (
            <motion.div key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1.5 items-center text-white/40 text-sm">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-cyan-400" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-pink-400" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-purple-400" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central icon */}
        <div className="relative flex items-center justify-center w-36 h-36">
          <WaveRings active={isListening} color="rgba(255,45,155,0.6)" />
          <WaveRings active={isSpeaking} color="rgba(0,245,255,0.6)" />
          <motion.div
            className="relative z-10 w-28 h-28 rounded-full flex items-center justify-center"
            animate={{
              background: isListening
                ? ['linear-gradient(135deg, #ff2d9b, #7c3aed)', 'linear-gradient(135deg, #00f5ff, #ff2d9b)', 'linear-gradient(135deg, #ff2d9b, #7c3aed)']
                : isSpeaking
                ? ['linear-gradient(135deg, #00f5ff, #7c3aed)', 'linear-gradient(135deg, #7c3aed, #00f5ff)', 'linear-gradient(135deg, #00f5ff, #7c3aed)']
                : 'linear-gradient(135deg, #374175, #2C2F56)',
              boxShadow: isListening
                ? ['0 0 40px rgba(255,45,155,0.5)', '0 0 60px rgba(0,245,255,0.5)', '0 0 40px rgba(255,45,155,0.5)']
                : isSpeaking
                ? ['0 0 40px rgba(0,245,255,0.5)', '0 0 60px rgba(124,58,237,0.5)', '0 0 40px rgba(0,245,255,0.5)']
                : '0 0 20px rgba(0,0,0,0.3)',
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AnimatePresence mode="wait">
              {isSpeaking ? (
                <motion.div key="speaker" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Volume2 className="w-12 h-12 text-white" />
                </motion.div>
              ) : (
                <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Mic className="w-12 h-12 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Status label */}
        <AnimatePresence mode="wait">
          {isListening && (
            <motion.div key="listen-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <p className="text-white/80 font-medium text-base">Please Speak Now</p>
              {userText && <p className="text-white/45 text-sm mt-2 italic">{userText}</p>}
            </motion.div>
          )}
          {isSpeaking && (
            <motion.div key="speak-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-cyan-400/80 font-medium text-base">Zeow is Speaking...</p>
            </motion.div>
          )}
          {isProcessing && (
            <motion.div key="proc-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-white/50 text-sm">Thinking...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-8 mt-2">
          <button
            onClick={handleRepeat}
            disabled={!lastAiText || isProcessing}
            className="flex flex-col items-center gap-2 group disabled:opacity-30"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <RotateCcw className="w-5 h-5 text-white/70" />
            </div>
            <span className="text-white/35 text-xs">Repeat</span>
          </button>

          {/* Central leave button */}
          <button
            onClick={handleLeave}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
              <PhoneOff className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/35 text-xs">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}