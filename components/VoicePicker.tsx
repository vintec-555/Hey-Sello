"use client";

// Curated ElevenLabs preset voices (available on all accounts).
export const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", desc: "Warm · female (default)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", desc: "Soft · female" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", desc: "Bright · female" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", desc: "Friendly · male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", desc: "Deep · male" },
];
export const DEFAULT_VOICE_ID = VOICES[0].id;

export default function VoicePicker({
  value,
  premium,
  onChange,
  onPreview,
}: {
  value: string;
  premium: boolean;
  onChange: (id: string) => void;
  onPreview: () => void;
}) {
  return (
    <div className="voice-settings">
      <span className="voice-settings__label">🔊 Sello’s voice</span>
      <select className="voice-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {VOICES.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} — {v.desc}
          </option>
        ))}
      </select>
      <button type="button" className="voice-preview" onClick={onPreview}>
        ▶ Preview
      </button>
      {!premium && (
        <span className="voice-settings__hint">
          add <code>ELEVENLABS_API_KEY</code> for these voices — using the browser voice for now
        </span>
      )}
    </div>
  );
}
