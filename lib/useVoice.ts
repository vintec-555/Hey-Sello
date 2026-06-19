"use client";

// Free, browser-native voice for Hey Sello.
// STT: Web Speech API (SpeechRecognition) listening for the "Hey Sello" wake word.
// TTS: SpeechSynthesis speaks the agent's replies.
// No API keys, no backend. Works in Chrome/Edge/Safari (not Firefox).
import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceStatus = "off" | "wake" | "listening" | "thinking" | "speaking";

const WAKE = ["hey sello", "hey cello", "hey solo", "a sello"]; // tolerate STT mishears

export function useVoice(onCommand: (text: string) => void) {
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("off");
  const [supported, setSupported] = useState(true);

  const recRef = useRef<any>(null);
  const onRef = useRef(on);
  const speakingRef = useRef(false);
  const awaitingRef = useRef(false); // heard "Hey Sello" alone, next utterance is the command
  const queueRef = useRef<string[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const cmdRef = useRef(onCommand);
  cmdRef.current = onCommand;
  onRef.current = on;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || !window.speechSynthesis) setSupported(false);
    const load = () => (voicesRef.current = window.speechSynthesis?.getVoices() ?? []);
    load();
    window.speechSynthesis?.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", load);
  }, []);

  const startRec = useCallback(() => {
    if (typeof window === "undefined" || !onRef.current || speakingRef.current) return;
    try {
      recRef.current?.start();
      setStatus(awaitingRef.current ? "listening" : "wake");
    } catch {
      /* already started */
    }
  }, []);

  const pickVoice = () => {
    const vs = voicesRef.current;
    return (
      vs.find((v) => /en[-_]US/i.test(v.lang) && /(Google US|Samantha|Aria|Natural|Jenny)/i.test(v.name)) ||
      vs.find((v) => /^en/i.test(v.lang)) ||
      vs[0]
    );
  };

  const drain = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      speakingRef.current = false;
      startRec();
      return;
    }
    speakingRef.current = true;
    setStatus("speaking");
    const u = new SpeechSynthesisUtterance(next);
    u.rate = 1.03;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = drain;
    u.onerror = drain;
    window.speechSynthesis.speak(u);
  }, [startRec]);

  // Speak text aloud (recognition is paused while speaking to avoid feedback).
  const speak = useCallback(
    (text: string) => {
      if (!onRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
      const clean = text.replace(/\*\*/g, "").replace(/[#*_`>]/g, "").slice(0, 600);
      try {
        recRef.current?.stop();
      } catch {}
      queueRef.current.push(clean);
      if (!speakingRef.current) drain();
    },
    [drain],
  );

  const handle = useCallback((transcript: string) => {
    const raw = transcript.trim();
    const t = raw.toLowerCase();

    if (awaitingRef.current) {
      awaitingRef.current = false;
      setStatus("thinking");
      try { recRef.current?.stop(); } catch {}
      cmdRef.current(raw);
      return;
    }
    const hit = WAKE.map((w) => t.indexOf(w)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (hit === undefined) return;
    const w = WAKE.find((x) => t.indexOf(x) === hit)!;
    const after = raw.slice(hit + w.length).replace(/^[\s,.!?]+/, "").trim();
    if (after) {
      setStatus("thinking");
      try { recRef.current?.stop(); } catch {}
      cmdRef.current(after);
    } else {
      awaitingRef.current = true;
      setStatus("listening");
    }
  }, []);

  const enable = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    setOn(true);
    onRef.current = true;
    // Unlock speechSynthesis + confirm with a short greeting (must be in a user gesture).
    speak("Voice on. Say, Hey Sello, then your task.");
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const r = e.results[e.results.length - 1];
      if (r.isFinal) handle(r[0].transcript as string);
    };
    rec.onend = () => { if (onRef.current && !speakingRef.current) startRec(); };
    rec.onerror = (e: any) => { if (e.error === "not-allowed") { setOn(false); onRef.current = false; setStatus("off"); } };
    recRef.current = rec;
  }, [handle, speak, startRec]);

  const disable = useCallback(() => {
    setOn(false);
    onRef.current = false;
    awaitingRef.current = false;
    queueRef.current = [];
    speakingRef.current = false;
    setStatus("off");
    try { recRef.current?.stop(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    recRef.current = null;
  }, []);

  // Call when an agent run finishes with no spoken reply, to resume listening.
  const resume = useCallback(() => {
    if (onRef.current && !speakingRef.current) startRec();
  }, [startRec]);

  return { on, status, supported, enable, disable, speak, resume, setStatus };
}
