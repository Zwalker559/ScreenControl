import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square } from 'lucide-react';
import { createSpeechRecognition } from '@/components/speechUtils';

export default function VoiceRecorder({ onTranscript, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  const startRecording = () => {
    setInterimText('');
    const recognition = createSpeechRecognition(
      (text, isFinal) => {
        setInterimText(text);
        if (isFinal) { setIsRecording(false); onTranscript(text); setInterimText(''); }
      },
      (finalText) => { setIsRecording(false); if (finalText) onTranscript(finalText); setInterimText(''); },
      (error) => { console.error(error); setIsRecording(false); setInterimText(''); }
    );
    if (recognition) { recognitionRef.current = recognition; recognition.start(); setIsRecording(true); }
  };

  const stopRecording = () => { if (recognitionRef.current) recognitionRef.current.stop(); };

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence>
        {interimText && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="w-full text-center text-sm italic text-white/50 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {interimText}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <span className="absolute w-16 h-16 rounded-full animate-pulse-ring" style={{ background: 'rgba(255,45,155,0.3)' }} />
            <span className="absolute w-16 h-16 rounded-full animate-pulse-ring" style={{ background: 'rgba(0,245,255,0.2)', animationDelay: '0.6s' }} />
          </>
        )}
        <button
          disabled={disabled}
          onClick={isRecording ? stopRecording : startRecording}
          className="relative w-16 h-16 rounded-full flex items-center justify-center font-bold text-white transition-all active:scale-95 disabled:opacity-40"
          style={isRecording
            ? { background: 'linear-gradient(135deg, #ff2d9b, #7c3aed)', boxShadow: '0 0 30px rgba(255,45,155,0.5)' }
            : { background: 'linear-gradient(135deg, #7c3aed, #00f5ff)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }
          }
        >
          {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
      <p className="text-xs text-white/35">{isRecording ? 'Listening... tap to stop' : 'Tap to speak'}</p>
    </div>
  );
}