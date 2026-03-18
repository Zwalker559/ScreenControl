// Speech utilities

export function speakText(text, voice, onEnd) {
  if (!window.speechSynthesis) return;
  stopSpeaking();

  // Fix pronunciation of "Zeow" to sound like "Ze-Ow" (like cow but with Z)
  let processedText = text.replace(/Zeow/gi, (match) => {
    if (match === 'Zeow') return 'Zee-ow';
    if (match === 'zeow') return 'zee-ow';
    if (match === 'ZEOW') return 'ZEE-OW';
    return 'Zee-ow';
  });

  const utterance = new SpeechSynthesisUtterance(processedText);

  if (voice) {
    const voices = window.speechSynthesis.getVoices();
    // Try exact match first, then partial match
    let match = voices.find(v => v.name === voice);
    if (!match) {
      match = voices.find(v => v.name.toLowerCase().includes(voice.toLowerCase()));
    }
    if (match) {
      utterance.voice = match;
    }
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export function getVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    } else {
      resolve([]);
    }
  });
}

export function createSpeechRecognition(onResult, onEnd, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError && onError('Speech recognition not supported'); return null; }

  const recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    onResult && onResult(finalTranscript || interim, !!finalTranscript);
  };

  recognition.onend = () => onEnd && onEnd(finalTranscript);
  recognition.onerror = (e) => onError && onError(e.error);

  return recognition;
}

// Continuous wake-word listener
export function createWakeWordListener(onActivated, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let heyDetected = false;
  let heyTimeout = null;
  let cooldown = false;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptRaw = event.results[i][0].transcript.trim();
      const transcript = transcriptRaw.toLowerCase();

      if (cooldown) continue;

      const fullWakePattern = /\bhey\b[\s\S]{0,60}?\b(?:ai|aye|eye|a\.i\.?|a i|zeow ai|zeowai|zeow|zeeow|zow|zuh|ow)\b/i;
      const heyOnlyPattern = /\bhey\b/i;
      const aiCuePattern = /\b(?:ai|aye|eye|a\.i\.?|a i|zeow ai|zeowai|zeow|zeeow|zow|zuh|ow)\b/i;

      // Immediate 1-phrase wake (Hey ... AI / Zeow-style) OR two-step wake
      const matchedWakePhrase = transcriptRaw.match(fullWakePattern);
      const hasHey = heyOnlyPattern.test(transcriptRaw);
      const hasCue = aiCuePattern.test(transcriptRaw);

      if (matchedWakePhrase) {
        if (heyTimeout) {
          clearTimeout(heyTimeout);
          heyTimeout = null;
        }
        heyDetected = false;
        cooldown = true;
        setTimeout(() => { cooldown = false; }, 3000);

        const commandText = transcriptRaw.slice(matchedWakePhrase.index + matchedWakePhrase[0].length).trim();
        onActivated && onActivated('wake_word_detected', { command: commandText });
        recognition.stop();
        return;
      }

      if (!heyDetected && hasHey) {
        heyDetected = true;
        if (heyTimeout) clearTimeout(heyTimeout);
        heyTimeout = setTimeout(() => {
          heyDetected = false;
          heyTimeout = null;
        }, 3000);
        continue;
      }

      if (heyDetected && hasCue) {
        if (heyTimeout) {
          clearTimeout(heyTimeout);
          heyTimeout = null;
        }
        heyDetected = false;
        cooldown = true;
        setTimeout(() => { cooldown = false; }, 3000);

        const indicator = transcriptRaw.match(aiCuePattern);
        const commandText = indicator ? transcriptRaw.slice(indicator.index + indicator[0].length).trim() : '';
        onActivated && onActivated('wake_word_detected', { command: commandText });
        recognition.stop();
        return;
      }
    }
  };

  recognition.onerror = (e) => {
    if (e.error !== 'no-speech') onError && onError(e.error);
  };

  recognition.onend = () => {
    // Restart listening for wake words
    try { recognition.start(); } catch (_) {}
  };

  return recognition;
}