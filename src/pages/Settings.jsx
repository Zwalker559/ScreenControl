import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import BackgroundOrbs from '@/components/BackgroundOrbs';
import VoicePickerModal from '@/components/settings/VoicePickerModal';
import { useSettings } from '@/components/SettingsContext';

export default function Settings() {
  const { settings, updateSetting } = useSettings();
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voiceName, setVoiceName] = useState(settings.selectedVoice || 'Default');

  useEffect(() => {
    if (!settings.selectedVoice) {
      setVoiceName('Default');
      return;
    }
    setVoiceName(settings.selectedVoice);
  }, [settings.selectedVoice]);

  const handleVoiceSelect = (name) => {
    updateSetting('selectedVoice', name);
    setVoiceName(name);
    setShowVoicePicker(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#2C2F56' }}>
      <BackgroundOrbs />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Chat')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-space font-bold text-white text-xl">Settings</h1>
            <p className="text-white/35 text-xs">Customize your ZeowAI experience</p>
          </div>
        </div>

        {/* Communication Section */}
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4 border-b border-white/08">
            <h2 className="font-space font-semibold text-white text-sm">Communication</h2>
            <p className="text-white/35 text-xs mt-0.5">How Zeow speaks and listens</p>
          </div>

          {/* Read my Replies toggle */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/05">
            <div className="flex-1 pr-4">
              <p className="text-white text-sm font-medium">Read my Replies</p>
              <p className="text-white/40 text-xs mt-0.5">Zeow will read AI responses aloud using text-to-speech</p>
            </div>
            <button
              onClick={() => updateSetting('readReplies', !settings.readReplies)}
              className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
              style={settings.readReplies
                ? { background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)' }
                : { background: 'rgba(255,255,255,0.12)' }
              }
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                animate={{ left: settings.readReplies ? '26px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Voice selector */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-white text-sm font-medium">ZeowAI's Voice</p>
                <p className="text-white/40 text-xs mt-0.5">
                  Current: <span className="text-white/70">{voiceName}</span>
                </p>
              </div>
              <button
                onClick={() => setShowVoicePicker(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(255,45,155,0.3))', border: '1px solid rgba(124,58,237,0.4)' }}
              >
                Change...
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-8">
          Created by <span className="text-white/35 font-medium">ZWDevelopment</span>
        </p>
      </div>

      <AnimatePresence>
        {showVoicePicker && (
          <VoicePickerModal
            onClose={() => setShowVoicePicker(false)}
            currentVoice={settings.selectedVoice}
            onSelect={handleVoiceSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}