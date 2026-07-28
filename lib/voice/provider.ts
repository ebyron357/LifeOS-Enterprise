export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

export type VoiceTransport = {
  id: "browser";
  requestPermission: () => Promise<boolean>;
  startListening: (handlers: {
    onInterim: (text: string) => void;
    onFinal: (text: string) => void;
    onError: (message: string) => void;
    onEnd: () => void;
    lang: string;
  }) => Promise<void>;
  stopListening: () => void;
  speak: (text: string, opts: {
    rate: number;
    lang: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (message: string) => void;
  }) => void;
  stopSpeaking: () => void;
  disconnect: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function createBrowserVoiceTransport(): VoiceTransport {
  let recognition: SpeechRecognitionLike | null = null;

  return {
    id: "browser",
    async requestPermission() {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        return false;
      }
    },
    async startListening({ onInterim, onFinal, onError, onEnd, lang }) {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        onError("Speech recognition is not supported in this browser.");
        return;
      }
      recognition?.abort();
      recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interim += result[0].transcript;
        }
        if (interim) onInterim(interim.trim());
        if (finalText) onFinal(finalText.trim());
      };
      recognition.onerror = (event) => onError(event.error || "Recognition failed.");
      recognition.onend = () => onEnd();
      recognition.start();
    },
    stopListening() {
      recognition?.stop();
      recognition = null;
    },
    speak(text, opts) {
      if (!("speechSynthesis" in window)) {
        opts.onError?.("Speech synthesis is not supported.");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = opts.rate;
      utterance.lang = opts.lang.startsWith("fr") ? "fr-FR" : opts.lang.startsWith("ht") ? "ht-HT" : "en-US";
      utterance.onstart = () => opts.onStart?.();
      utterance.onend = () => opts.onEnd?.();
      utterance.onerror = () => opts.onError?.("Speech synthesis failed.");
      window.speechSynthesis.speak(utterance);
    },
    stopSpeaking() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    disconnect() {
      this.stopListening();
      this.stopSpeaking();
    },
  };
}

/**
 * V1 always uses browser speech. LiveKit remains a documented future transport.
 */
export function selectVoiceTransport(provider: "browser" | "livekit" | "none"): VoiceTransport | null {
  if (provider === "none") return null;
  return createBrowserVoiceTransport();
}
