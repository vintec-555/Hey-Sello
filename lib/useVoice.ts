"use client";

// Voice for Hey Sello.
// STT: Web Speech API (SpeechRecognition) listening for the "Hey Sello" wake word — free.
// TTS: ElevenLabs (natural voice) when configured, else the browser's SpeechSynthesis.
// Works in Chrome/Edge/Safari (not Firefox).
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
  const awaitingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const premiumRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  function startRec() {
    if (typeof window === "undefined" || !onRef.current || speakingRef.current) return;
    try {
      recRef.current?.start();
      setStatus(awaitingRef.current ? "listening" : "wake");
    } catch {
      /* already started */
    }
  }

  function pickVoice() {
    const vs = voicesRef.current;
    return (
      vs.find((v) => /en[-_]US/i.test(v.lang) && /(Google US|Samantha|Aria|Natural|Jenny)/i.test(v.name)) ||
      vs.find((v) => /^en/i.test(v.lang)) ||
      vs[0]
    );
  }

  // Browser TTS (free fallback).
  function playBrowser(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return drain();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.03;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = drain;
    u.onerror = drain;
    window.speechSynthesis.speak(u);
  }

  // ElevenLabs TTS (premium); falls back to the browser voice on any error.
  async function playPremium(text: string) {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("tts");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); drain(); };
      audio.onerror = () => { URL.revokeObjectURL(url); playBrowser(text); };
      await audio.play();
    } catch {
      playBrowser(text);
    }
  }

  function drain() {
    const next = queueRef.current.shift();
    if (!next) {
      speakingRef.current = false;
      audioRef.current = null;
      startRec();
      return;
    }
    speakingRef.current = true;
    setStatus("speaking");
    if (premiumRef.current) playPremium(next);
    else playBrowser(next);
  }

  function speak(text: string) {
    if (!onRef.current) return;
    const clean = text.replace(/\*\*/g, "").replace(/[#*_`>]/g, "").slice(0, 700).trim();
    if (!clean) return;
    try { recRef.current?.stop(); } catch {}
    queueRef.current.push(clean);
    if (!speakingRef.current) drain();
  }

  function handle(transcript: string) {
    const raw = transcript.trim();
    const t = raw.toLowerCase();
    if (awaitingRef.current) {
      awaitingRef.current = false;
      setStatus("thinking");
      try { recRef.current?.stop(); } catch {}
      cmdRef.current(raw);
      return;
    }
    const hits = WAKE.map((w) => t.indexOf(w)).filter((i) => i >= 0).sort((a, b) => a - b);
    if (hits.length === 0) return;
    const hit = hits[0];
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
  }

  const enable = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    setOn(true);
    onRef.current = true;
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
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setOn(false); onRef.current = false; setStatus("off");
      }
    };
    recRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disable = useCallback(() => {
    setOn(false);
    onRef.current = false;
    awaitingRef.current = false;
    queueRef.current = [];
    speakingRef.current = false;
    setStatus("off");
    try { recRef.current?.stop(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    try { audioRef.current?.pause(); } catch {}
    recRef.current = null;
    audioRef.current = null;
  }, []);

  const resume = useCallback(() => {
    if (onRef.current && !speakingRef.current) startRec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPremium = useCallback((v: boolean) => { premiumRef.current = v; }, []);

  return { on, status, supported, enable, disable, speak, resume, setPremium };
}
