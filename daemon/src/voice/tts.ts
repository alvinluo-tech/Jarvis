/**
 * TTS module - Text to Speech.
 * First version: returns text for client-side TTS (Web Speech API).
 * Future: Piper (local) or Groq Orpheus (cloud).
 */

export interface TTSResult {
  /** Text to be spoken by the client */
  text: string;
  /** Suggested language for TTS engine */
  lang: string;
  /** Provider used */
  provider: "client";
}

/**
 * Prepare text for TTS output.
 * For now, just passes text through for client-side Web Speech API.
 * Future: call Piper or Groq Orpheus for audio generation.
 */
export function prepareTTS(text: string, lang: string = "zh-CN"): TTSResult {
  return {
    text,
    lang,
    provider: "client",
  };
}
