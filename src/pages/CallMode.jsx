import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, PhoneOff, RotateCcw, MessageCircle, MicOff, X } from 'lucide-react';
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
  const [isMuted, setIsMuted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesRef = useRef([]);
  const recRef = useRef(null);

  const startListening = () => {
    if (isMuted) return; // Don't listen if muted
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
        const systemPrompt = `You are ZeowAI, a helpful and friendly AI assistant created by ZWDevelopment. You can mention your creator when directly asked about it, but don't introduce yourself in every response. Be conversational and natural in your responses. You can talk about having a good day or other casual topics when appropriate.`;
        const prompt = context
          ? `${systemPrompt}\n\nPrevious conversation:\n${context}\n\nUser: ${finalText}`
          : `${systemPrompt}\n\nUser: ${finalText}`;

        try {
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
        } catch (error) {
          console.error('Error in call mode:', error);
          const errorResponse = `Sorry, I encountered an error: ${error.message || 'Unable to process your request'}`;
          setLastAiText(errorResponse);
          setPhase('speaking');
          speakText(errorResponse, settings.selectedVoice, () => {
            setPhase('listening');
            startListening();
          });
        }
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

  const isListening = phase === 'listening' || phase === 'processing';
  const isSpeaking = phase === 'speaking';
  const isProcessing = phase === 'processing';

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#2C2F56' }}>
      <BackgroundOrbs />

      {/* Header with chat history icon */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
        <div></div>
        <button
          onClick={() => setSidebarOpen(true)}
          title="View call history"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'rgba(0,245,255,0.15)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff' }}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Chat History Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 z-30 bg-black/50"
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-96 z-40 flex flex-col"
              style={{ background: 'rgba(44,47,86,0.95)', backdropFilter: 'blur(10px)', borderLeft: '1px solid rgba(0,245,255,0.1)' }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-white font-space font-bold text-lg">Call History</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4">
                {messagesRef.current.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-8">No messages yet</p>
                ) : (
                  <div className="space-y-4">
                    {messagesRef.current.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'ml-auto max-w-xs'
                            : 'mr-auto max-w-xs'
                        }`}
                        style={msg.role === 'user'
                          ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.3)' }
                          : { background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)' }
                        }
                      >
                        <p className={msg.role === 'user' ? 'text-purple-200 text-sm' : 'text-cyan-200 text-sm'}>
                          {msg.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
          <WaveRings active={phase === 'listening'} color="rgba(255,45,155,0.6)" />
          <WaveRings active={isSpeaking} color="rgba(0,245,255,0.6)" />
          <motion.div
            className="relative z-10 w-28 h-28 rounded-full flex items-center justify-center cursor-pointer"
            animate={{
              background: phase === 'listening'
                ? ['linear-gradient(135deg, #ff2d9b, #7c3aed)', 'linear-gradient(135deg, #00f5ff, #ff2d9b)', 'linear-gradient(135deg, #ff2d9b, #7c3aed)']
                : isSpeaking
                ? ['linear-gradient(135deg, #00f5ff, #7c3aed)', 'linear-gradient(135deg, #7c3aed, #00f5ff)', 'linear-gradient(135deg, #00f5ff, #7c3aed)']
                : 'linear-gradient(135deg, #374175, #2C2F56)',
              boxShadow: phase === 'listening'
                ? ['0 0 40px rgba(255,45,155,0.5)', '0 0 60px rgba(0,245,255,0.5)', '0 0 40px rgba(255,45,155,0.5)']
                : isSpeaking
                ? ['0 0 40px rgba(0,245,255,0.5)', '0 0 60px rgba(124,58,237,0.5)', '0 0 40px rgba(0,245,255,0.5)']
                : '0 0 20px rgba(0,0,0,0.3)',
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            onClick={isSpeaking ? () => {
              stopSpeaking();
              setPhase('listening');
              startListening();
            } : undefined}
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
          {phase === 'listening' && (
            <motion.div key="listen-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              {isMuted ? (
                <p className="text-red-400/80 font-medium text-base">Mic Muted</p>
              ) : (
                <>
                  <p className="text-white/80 font-medium text-base">Please Speak Now</p>
                  {userText && <p className="text-white/45 text-sm mt-2 italic">{userText}</p>}
                </>
              )}
            </motion.div>
          )}
          {phase === 'processing' && (
            <motion.div key="proc-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-white/50 text-sm">Thinking...</p>
            </motion.div>
          )}
          {isSpeaking && (
            <motion.div key="speak-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-cyan-400/80 font-medium text-base">Zeow is Speaking...</p>
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

          {/* Mute/Unmute button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute mic' : 'Mute mic'}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
              style={isMuted
                ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }
                : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }
              }>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <span className="text-white/35 text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
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