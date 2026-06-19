"use client";

// Curated ElevenLabs preset voices (available on all accounts), grouped by type.
export const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", desc: "Warm (default)", group: "Female" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", desc: "Soft", group: "Female" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", desc: "Gentle", group: "Female" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", desc: "Bright", group: "Female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: "Jarvis-style · British", group: "Male" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", desc: "Calm · British", group: "Male" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", desc: "Soft", group: "Male" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", desc: "Gentle", group: "Male" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", desc: "Friendly", group: "Male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", desc: "Deep", group: "Male" },
];
export const DEFAULT_VOICE_ID = VOICES[0].id;
const GROUPS = ["Female", "Male"] as const;

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
        {GROUPS.map((g) => (
          <optgroup key={g} label={`${g} voices`}>
            {VOICES.filter((v) => v.group === g).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.desc} {g === "Female" ? "♀" : "♂"}
              </option>
            ))}
          </optgroup>
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
