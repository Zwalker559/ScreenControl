import React, { useState, useRef, useEffect } from 'react';
import { groqClient } from '@/api/groqClient';
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
import ImageGeneratorInput from '@/components/chat/ImageGeneratorInput';
import { speakText, stopSpeaking, createWakeWordListener, createSpeechRecognition } from '@/components/speechUtils';
import { useSettings } from '@/components/SettingsContext';
import { containsProfanity, filterProfanity, validateImagePrompt } from '@/lib/filterUtils';
import { generateImage, blobToDataUrl, estimateExplicitContent, detectImageKeywords } from '@/lib/imageGenerator';

export default function Chat() {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [isWakeListening, setIsWakeListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const messagesEndRef = useRef(null);
  const wakeListenerRef = useRef(null);
  const commandListenerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Wake word listener management
  useEffect(() => {
    if (wakeWordEnabled) {
      const listener = createWakeWordListener(
        /** @param {string} eventType */ /** @param {any} data */
        (eventType, data) => {
          if (eventType === 'wake_word_detected') {
            setWakeWordDetected(true);
            setIsWakeListening(true);
            setInterimText('');

            const incomingCommand = data?.command?.trim();
            if (incomingCommand) {
              // If user already said command with wake phrase in one go, send it directly.
              setIsWakeListening(false);
              setWakeWordDetected(false);
              setInterimText('');
              sendMessage(incomingCommand);
              return;
            }

            // Start a separate speech recognition for the command
            let sendTimeout = null;
            let silenceTimeout = null;
            let hasDetectedSpeech = false;

            const commandRec = createSpeechRecognition(
              /** @param {string} text */ /** @param {boolean} isFinal */
              (text, isFinal) => {
                setInterimText(text);
                
                // Clear previous timeouts when new speech is detected
                if (sendTimeout) {
                  clearTimeout(sendTimeout);
                  sendTimeout = null;
                }
                if (silenceTimeout && text.trim()) {
                  clearTimeout(silenceTimeout);
                  silenceTimeout = null;
                  hasDetectedSpeech = true;
                }
                
                if (isFinal && text.trim()) {
                  hasDetectedSpeech = true;
                  // Start a timeout to send the message after 2 seconds of silence
                  sendTimeout = setTimeout(() => {
                    if (commandListenerRef.current) {
                      setIsWakeListening(false);
                      setWakeWordDetected(false);
                      setInterimText('');
                      sendMessage(text);
                      commandListenerRef.current = null;
                    }
                  }, 2000); // Wait 2 seconds of silence before sending
                }
              },
              /** @param {string} finalText */
              (finalText) => {
                // Recognition ended
                if (silenceTimeout) clearTimeout(silenceTimeout);
                if (sendTimeout) {
                  clearTimeout(sendTimeout);
                  if (finalText && finalText.trim()) {
                    setIsWakeListening(false);
                    setWakeWordDetected(false);
                    setInterimText('');
                    sendMessage(finalText);
                  } else {
                    setIsWakeListening(false);
                    setWakeWordDetected(false);
                    setInterimText('');
                  }
                } else {
                  setIsWakeListening(false);
                  setWakeWordDetected(false);
                  setInterimText('');
                }
                commandListenerRef.current = null;
              },
              /** @param {string} error */
              (error) => {
                if (sendTimeout) clearTimeout(sendTimeout);
                if (silenceTimeout) clearTimeout(silenceTimeout);
                setIsWakeListening(false);
                setWakeWordDetected(false);
                setInterimText('');
                commandListenerRef.current = null;
              }
            );

            if (commandRec) {
              commandListenerRef.current = commandRec;
              commandRec.start();

              // Set a 3-second silence timeout - if nothing is said, stop listening
              silenceTimeout = setTimeout(() => {
                if (commandListenerRef.current && !hasDetectedSpeech) {
                  commandListenerRef.current.abort();
                  setIsWakeListening(false);
                  setWakeWordDetected(false);
                  setInterimText('');
                  commandListenerRef.current = null;
                }
              }, 3000);

              // Backup timeout of 10 seconds maximum
              setTimeout(() => {
                if (commandListenerRef.current) {
                  commandListenerRef.current.abort();
                  if (sendTimeout) clearTimeout(sendTimeout);
                  if (silenceTimeout) clearTimeout(silenceTimeout);
                  setIsWakeListening(false);
                  setWakeWordDetected(false);
                  setInterimText('');
                  commandListenerRef.current = null;
                }
              }, 10000);
            }
          }
        },
        /** @param {string} err */
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
      if (commandListenerRef.current) {
        commandListenerRef.current.abort();
        commandListenerRef.current = null;
      }
      setIsWakeListening(false);
      setWakeWordDetected(false);
      setInterimText('');
    }
    return () => {
      if (wakeListenerRef.current) {
        wakeListenerRef.current.onend = null;
        try { wakeListenerRef.current.abort(); } catch (_) {}
      }
      if (commandListenerRef.current) {
        try { commandListenerRef.current.abort(); } catch (_) {}
      }
    };
  }, [wakeWordEnabled, isWakeListening]);

  const sendMessage = async (/** @type {string} */ text) => {
    // Check for image generation keywords
    const { shouldGenerate, extractedPrompt } = detectImageKeywords(text);

    // Apply content filter to user message if unfiltered is OFF
    let userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    
    if (!settings.unfiltered && containsProfanity(text)) {
      userMessage = { ...userMessage, content: filterProfanity(text) };
    }
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // If image generation keywords detected, trigger image generation in parallel
      if (shouldGenerate && extractedPrompt) {
        // Validate prompt based on filter settings
        const validation = validateImagePrompt(extractedPrompt, settings.unfiltered);
        
        if (validation.isAppropriate) {
          // Start image generation in parallel (don't await)
          setIsGeneratingImage(true);
          generateImageAsync(extractedPrompt);
        } else {
          // Show validation error
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: validation.reason,
            timestamp: new Date().toISOString()
          }]);
        }
        
        // For image requests, still provide a chat response
        // (unless they ONLY asked for an image with no other context)
        const hasOtherContent = text.toLowerCase().replace(/generate|create|make|draw|image|picture|photo|of|a|an|the|me|show/gi, '').trim().length > 10;
        
        if (!hasOtherContent) {
          // Just an image request, acknowledge it
          setIsLoading(false);
          return;
        }
      }

      // Get chat response for text queries
      const conversationContext = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
      const systemPrompt = `You are ZeowAI, a helpful and friendly AI assistant created by ZWDevelopment. You can mention your creator when directly asked about it, but don't introduce yourself in every response. Be conversational and natural in your responses. You can talk about having a good day or other casual topics when appropriate.`;
      const prompt = conversationContext
        ? `${systemPrompt}\n\nPrevious conversation:\n${conversationContext}\n\nUser: ${userMessage.content}`
        : `${systemPrompt}\n\nUser: ${userMessage.content}`;

      let response = await groqClient.completionCreate({ prompt });
      
      // Apply content filter to AI response if unfiltered is OFF
      if (!settings.unfiltered && containsProfanity(response)) {
        response = filterProfanity(response);
      }
      
      const assistantMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMessage]);

      if (settings.readReplies) {
        stopSpeaking();
        setIsSpeaking(true);
        speakText(response, settings.selectedVoice, () => setIsSpeaking(false));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant', content: `Error: ${error.message || 'Failed to get response'}`, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImageAsync = async (/** @type {string} */ prompt) => {
    try {
      // Generate image using local API
      const imageBlob = await generateImage(prompt);
      const dataUrl = await blobToDataUrl(imageBlob);
      
      // Estimate if content is explicit
      const isExplicit = estimateExplicitContent(prompt);

      // Add image to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: dataUrl,
        timestamp: new Date().toISOString(),
        isExplicit: isExplicit,
        alt: prompt
      }]);
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Check if API is down
      let errorMsg = error.message;
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('localhost')) {
        errorMsg = 'Local image generation API is not running. Start the server with: python server.py';
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to generate image: ${errorMsg}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleClear = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setMessages([]);
  };

  const handleGenerateImage = async (prompt) => {
    // Validate prompt based on filter settings
    const validation = validateImagePrompt(prompt, settings.unfiltered);
    if (!validation.isAppropriate) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: validation.reason,
        timestamp: new Date().toISOString()
      }]);
      return;
    }

    // Add user request to messages
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Manual image request: ${prompt}`,
      timestamp: new Date().toISOString()
    }]);

    setIsGeneratingImage(true);

    try {
      // Generate image using local API
      const imageBlob = await generateImage(prompt);
      const dataUrl = await blobToDataUrl(imageBlob);
      
      // Estimate if content is explicit
      const isExplicit = estimateExplicitContent(prompt);

      // Add image to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: dataUrl,
        timestamp: new Date().toISOString(),
        isExplicit: isExplicit,
        alt: prompt
      }]);
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Check if API is down
      let errorMsg = error.message;
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('localhost')) {
        errorMsg = 'Local image generation API is not running. Start the server with: python server.py';
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to generate image: ${errorMsg}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsGeneratingImage(false);
      setShowImageGenerator(false);
    }
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
                  Powered by: ZWDevelopment
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
          {showImageGenerator ? (
            <div className="space-y-3">
              <ImageGeneratorInput
                onGenerate={handleGenerateImage}
                isLoading={isGeneratingImage}
                disabled={isLoading}
              />
              <button
                onClick={() => setShowImageGenerator(false)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Back to Chat
              </button>
            </div>
          ) : (
            <>
              <TextInput
                onSend={sendMessage}
                disabled={isLoading || isGeneratingImage}
                wakeWordEnabled={wakeWordEnabled}
                onToggleWakeWord={() => setWakeWordEnabled(v => !v)}
                isWakeListening={isWakeListening}
                wakeWordDetected={wakeWordDetected}
                interimText={interimText}
              />
              {wakeWordEnabled && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-cyan-400/50 text-xs mt-2"
                >
                  Wake me by saying "Hey, ZeowAI!" then what you want to know.
                </motion.p>
              )}
              <p className="text-center text-white/30 text-xs mt-3 px-2">
                💡 <span className="text-white/40">Try: "generate an image of a sunset" or "create a picture of a cat"</span>
              </p>
            </>
          )}
        </div>
        <p className="text-center text-white/20 text-xs pb-3">
          ZeowAI 2025 • Images auto-generate when keywords detected
        </p>
      </div>
    </div>
  );
}