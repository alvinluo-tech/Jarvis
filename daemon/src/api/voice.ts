import { Hono } from "hono";
import { transcribeWithGroq, isAsrAvailable } from "../voice/asr.js";
import { prepareTTS } from "../voice/tts.js";

const voiceRoutes = new Hono();

/**
 * POST /api/voice/transcribe
 * Accepts audio file upload, returns transcription text.
 */
voiceRoutes.post("/transcribe", async (c) => {
  if (!isAsrAvailable()) {
    return c.json({ error: "ASR not configured. Set GROQ_API_KEY." }, 503);
  }

  try {
    const formData = await c.req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return c.json({ error: "Missing audio file" }, 400);
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const language = formData.get("language") as string | null;
    const result = await transcribeWithGroq(audioBuffer, language ?? undefined);

    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 500);
  }
});

/**
 * POST /api/voice/synthesize
 * Accepts text, returns TTS info (client-side for now).
 */
voiceRoutes.post("/synthesize", async (c) => {
  try {
    const body = await c.req.json<{ text: string; lang?: string }>();

    if (!body.text?.trim()) {
      return c.json({ error: "Text is required" }, 400);
    }

    const result = prepareTTS(body.text, body.lang);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /api/voice/status
 * Returns voice pipeline availability.
 */
voiceRoutes.get("/status", (c) => {
  return c.json({
    asr: isAsrAvailable(),
    tts: { available: true, provider: "client" },
    vad: { available: false, note: "Silero VAD - coming soon" },
  });
});

export default voiceRoutes;
