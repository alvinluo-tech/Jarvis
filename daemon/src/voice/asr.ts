import { env } from "../config/env.js";

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe audio using Groq Whisper API.
 * @param audioBuffer - Audio file buffer (webm, mp3, wav, etc.)
 * @param language - Optional language hint (e.g., "zh", "en")
 */
export async function transcribeWithGroq(
  audioBuffer: Buffer,
  language?: string,
): Promise<TranscriptionResult> {
  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }), "audio.webm");
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "verbose_json");
  if (language) {
    formData.append("language", language);
  }

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq ASR error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    text: string;
    language?: string;
    duration?: number;
  };

  return {
    text: data.text.trim(),
    language: data.language,
    duration: data.duration,
  };
}

/**
 * Check if ASR is available (Groq key configured).
 */
export function isAsrAvailable(): boolean {
  return Boolean(env.GROQ_API_KEY);
}
