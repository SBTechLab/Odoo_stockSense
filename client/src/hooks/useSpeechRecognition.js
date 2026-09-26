import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

/**
 * Thin wrapper around the browser Web Speech API (Chrome, Edge, Safari).
 * Firefox has no support — `supported` is false and callers should offer typing instead.
 *
 * @param {{ onFinal?: (text: string) => void }} [opts] called once with the final transcript
 * @returns {{ supported: boolean, listening: boolean, transcript: string, error: string|null,
 *   start: (lang: string) => void, stop: () => void, setTranscript: (t: string) => void }}
 */
export function useSpeechRecognition({ onFinal } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback((lang) => {
    if (!SpeechRecognitionImpl) return;
    recRef.current?.abort();
    const rec = new SpeechRecognitionImpl();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = '';
    rec.onstart = () => {
      setError(null);
      setListening(true);
      setTranscript('');
    };
    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((finalText + ' ' + interim).trim());
    };
    rec.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow it in the browser address bar.',
        'service-not-allowed': 'Microphone permission was denied. Allow it in the browser address bar.',
        'no-speech': "Didn't catch that — please try again.",
        'audio-capture': 'No microphone was found.',
        network: 'Speech recognition needs an internet connection in this browser. You can type the command instead.',
      };
      if (event.error !== 'aborted') setError(messages[event.error] || `Speech recognition error: ${event.error}`);
    };
    rec.onend = () => {
      setListening(false);
      const text = finalText.trim();
      if (text) onFinalRef.current?.(text);
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() throws if called twice quickly — ignore
    }
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported: Boolean(SpeechRecognitionImpl), listening, transcript, error, start, stop, setTranscript };
}
