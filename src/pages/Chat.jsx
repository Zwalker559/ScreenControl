import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-base font-semibold leading-tight">AI Assistant</h1>
                <p className="text-xs text-muted-foreground">Multimodal helper</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <ModeSelector activeMode={mode} onModeChange={setMode} />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState mode={mode} onSuggestionClick={sendMessage} />
          ) : (
            <div className="space-y-6">
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

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {usesVoiceInput ? (
            <VoiceRecorder onTranscript={sendMessage} disabled={isLoading} />
          ) : (
            <TextInput onSend={sendMessage} disabled={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}