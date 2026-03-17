import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { createSpeechRecognition } from '@/lib/speechUtils';
import { Button } from '@/components/ui/button';

export default function VoiceRecorder({ onTranscript, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = () => {
    setInterimText('');
    const recognition = createSpeechRecognition(
      (text, isFinal) => {
        setInterimText(text);
        if (isFinal) {
          setIsRecording(false);
          onTranscript(text);
          setInterimText('');
        }
      },
      (finalText) => {
        setIsRecording(false);
        if (finalText) {
          onTranscript(finalText);
        }
        setInterimText('');
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsRecording(false);
        setInterimText('');
      }
    );

    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence>
        {interimText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full"
          >
            <div className="bg-accent/50 rounded-xl px-4 py-3 text-sm text-muted-foreground italic">
              {interimText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-destructive/20 animate-pulse-ring" />
            <span className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        <Button
          type="button"
          size="icon"
          disabled={disabled}
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative w-14 h-14 rounded-full transition-all ${
            isRecording
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {isRecording ? 'Listening... tap to stop' : 'Tap to speak'}
      </p>
    </div>
  );
}