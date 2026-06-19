// Premium text-to-speech via ElevenLabs. Returns mp3 audio for the client to
// play. Falls back (client-side) to the browser voice when not configured.
export const runtime = "nodejs";

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // ElevenLabs "Rachel" — warm, natural
const DEFAULT_MODEL = "eleven_turbo_v2_5"; // low latency, good for an assistant

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return new Response("ElevenLabs not configured", { status: 503 });

  const { text, voiceId } = (await req.json().catch(() => ({}))) as { text?: string; voiceId?: string };
  if (!text || !text.trim()) return new Response("No text", { status: 400 });

  // Prefer the voice chosen in the UI; fall back to env, then the default.
  const picked = typeof voiceId === "string" && /^[A-Za-z0-9]{8,40}$/.test(voiceId) ? voiceId : "";
  const voice = picked || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const model = process.env.ELEVENLABS_MODEL || DEFAULT_MODEL;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: text.slice(0, 800),
        model_id: model,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true },
      }),
    },
  );

  if (!res.ok || !res.body) {
    return new Response((await res.text().catch(() => "")) || "TTS failed", { status: 502 });
  }
  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
