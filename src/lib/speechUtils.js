// Text-to-Speech utility
export function speakText(text, onEnd) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return null;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to pick a good English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) 
    || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Speech-to-Text using Web Speech API
export function createSpeechRecognition(onResult, onEnd, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interim = transcript;
      }
    }
    onResult(finalTranscript || interim, !!finalTranscript);
  };

  recognition.onend = () => {
    onEnd?.(finalTranscript);
  };

  recognition.onerror = (event) => {
    onError?.(event.error);
  };

  return recognition;
}