// Speech utilities

export function speakText(text, voice, onEnd) {
  if (!window.speechSynthesis) return;
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);

  if (voice) {
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.name === voice);
    if (match) utterance.voice = match;
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
export function createWakeWordListener(wakeWord, onActivated, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let activated = false;
  let cooldown = false;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.toLowerCase().trim();
      const lowerWake = wakeWord.toLowerCase().replace(/\s+/g, ' ');
      if (!cooldown && transcript.includes(lowerWake)) {
        const afterWake = transcript.split(lowerWake).pop().trim();
        if (afterWake.length > 2) {
          cooldown = true;
          setTimeout(() => { cooldown = false; }, 3000);
          onActivated && onActivated(afterWake);
        }
      }
    }
  };

  recognition.onerror = (e) => {
    if (e.error !== 'no-speech') onError && onError(e.error);
  };

  recognition.onend = () => {
    try { recognition.start(); } catch (_) {}
  };

  return recognition;
}