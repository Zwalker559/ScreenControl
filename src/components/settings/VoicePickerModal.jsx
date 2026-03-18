import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Play, Square } from 'lucide-react';
import { getVoices, speakText, stopSpeaking } from '@/components/speechUtils';

const GENDER_FILTERS = ['All', 'Masculine', 'Feminine', 'Neutral'];

function guessGender(voice) {
  const name = (voice.name + ' ' + voice.lang).toLowerCase();
  const femNames = ['female', 'zira', 'susan', 'hazel', 'victoria', 'samantha', 'karen', 'moira', 'fiona', 'tessa', 'veena', 'ioana', 'joana', 'paulina', 'lucia', 'sara', 'amelie', 'anna', 'alice', 'alva', 'mariska', 'lekha', 'mei', 'sin', 'yuna', 'kyoko', 'otoya'];
  const mascNames = ['male', 'david', 'mark', 'james', 'daniel', 'thomas', 'oliver', 'fred', 'jorge', 'diego', 'filipe', 'henrik', 'nora', 'luca', 'xander', 'rishi'];
  if (femNames.some(n => name.includes(n))) return 'Feminine';
  if (mascNames.some(n => name.includes(n))) return 'Masculine';
  return 'Neutral';
}

export default function VoicePickerModal({ onClose, currentVoice, onSelect }) {
  const [voices, setVoices] = useState([]);
  const [filters, setFilters] = useState(['All']);
  const [search, setSearch] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const [pendingSelect, setPendingSelect] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getVoices().then(v => setVoices(v));
    return () => stopSpeaking();
  }, []);

  const toggleFilter = (f) => {
    if (f === 'All') {
      setFilters(['All']);
      return;
    }
    let next = filters.filter(x => x !== 'All');
    if (next.includes(f)) {
      next = next.filter(x => x !== f);
    } else {
      next = [...next, f];
    }
    if (next.length === 0 || next.length === 3) {
      setFilters(['All']);
    } else {
      setFilters(next);
    }
  };

  const filtered = voices.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
    const gender = guessGender(v);
    const matchGender = filters.includes('All') || filters.includes(gender);
    return matchSearch && matchGender;
  });

  const handlePlay = (voice) => {
    if (playingVoice === voice.name) {
      stopSpeaking();
      setPlayingVoice(null);
    } else {
      stopSpeaking();
      setPlayingVoice(voice.name);
      speakText('Hello, this is how I sound', voice.name, () => setPlayingVoice(null));
    }
  };

  const handleSwap = (voice) => {
    setPendingSelect(voice);
    setConfirming(true);
  };

  const confirmSwap = () => {
    if (pendingSelect) {
      onSelect(pendingSelect.name);
      setConfirming(false);
      setPendingSelect(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,22,40,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#1e2040', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-space font-bold text-white text-lg">Choose a Voice</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-2 flex-wrap mb-3">
            {GENDER_FILTERS.map(f => {
              const isActive = filters.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={isActive
                    ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(255,45,155,0.4))', color: '#fff', border: '1px solid rgba(124,58,237,0.5)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {f}
                  {isActive && f !== 'All' && <X className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search voices..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>

        {/* Voice list */}
        <div className="px-3 pb-3 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-center text-white/30 text-sm py-8">No voices found</p>
          )}
          {filtered.map((voice) => {
            const isCurrent = currentVoice === voice.name;
            const isPlaying = playingVoice === voice.name;
            return (
              <div key={voice.name}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl group transition-all"
                style={{ background: isCurrent ? 'rgba(124,58,237,0.15)' : 'transparent' }}
                onMouseEnter={e => !isCurrent && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => !isCurrent && (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{voice.name}</p>
                  <p className="text-xs text-white/35">{voice.lang} · {guessGender(voice)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {isCurrent && <span className="text-xs text-purple-400 font-medium">Current</span>}
                  <button
                    onClick={() => handlePlay(voice)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-white/50 hover:text-cyan-400"
                    style={{ background: isPlaying ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    title={isPlaying ? 'Stop' : 'Preview'}
                  >
                    {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={() => handleSwap(voice)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                      style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)' }}
                    >
                      Swap Voice
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirming && pendingSelect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-60 w-full max-w-sm rounded-2xl p-6 mx-4"
            style={{ background: '#1e2040', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <h3 className="font-space font-bold text-white mb-2">Switch Voice?</h3>
            <p className="text-white/50 text-sm mb-5">Switch Zeow's voice to <span className="text-white/80 font-medium">{pendingSelect.name}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => { setConfirming(false); setPendingSelect(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/50 transition-all hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <button onClick={confirmSwap}
                className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ff2d9b)' }}>
                Confirm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}