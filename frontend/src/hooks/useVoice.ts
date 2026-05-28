import { useState, useCallback, useRef, useEffect } from "react";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceState = "idle" | "listening" | "wake-word" | "processing" | "speaking";

const WAKE_WORDS = ["贾维斯", "jarvis", "贾维斯"];

export function useVoice(onCommand: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const onCommandRef = useRef(onCommand);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognitionAPI));
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find((v) => v.lang.startsWith("zh"));
    if (zhVoice) utterance.voice = zhVoice;

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => {
      setState("idle");
      // Resume listening after speaking
      if (isListeningRef.current) {
        setTimeout(() => startListening(), 300);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    // Stop existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        if (result.isFinal) {
          finalTranscript += result[0]?.transcript ?? "";
        } else {
          interimTranscript += result[0]?.transcript ?? "";
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript) {
        const lower = finalTranscript.toLowerCase().trim();

        // Check for wake word
        const hasWakeWord = WAKE_WORDS.some((w) => lower.includes(w));

        if (hasWakeWord) {
          setState("wake-word");
          // Extract command after wake word
          let command = lower;
          for (const wake of WAKE_WORDS) {
            command = command.replace(wake, "").trim();
          }

          if (command.length > 0) {
            // Direct command after wake word
            setState("processing");
            onCommandRef.current(command);
          } else {
            // Just the wake word, wait for next utterance
            setTranscript("贾维斯已唤醒，请说出你的指令...");
          }
        } else if (state === "wake-word" || state === "listening") {
          // Treat as command if we're in wake-word mode
          setState("processing");
          onCommandRef.current(finalTranscript.trim());
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        // Restart if still listening
        if (isListeningRef.current) {
          setTimeout(() => startListening(), 500);
        }
        return;
      }
      console.error("Speech recognition error:", event.error);
      setState("idle");
    };

    recognition.onend = () => {
      // Auto-restart if still listening
      if (isListeningRef.current) {
        setTimeout(() => startListening(), 300);
      } else {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    isListeningRef.current = true;
  }, [state]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setState("idle");
    setTranscript("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    state,
    transcript,
    isSupported,
    isListening: isListeningRef.current,
    startListening,
    stopListening,
    toggleListening,
    speak,
  };
}
