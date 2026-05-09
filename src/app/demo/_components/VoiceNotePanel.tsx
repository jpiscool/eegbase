"use client";

import { useState, useRef, useEffect } from "react";
import { polishNote } from "../polish-note-action";

// Phase 31 — Voice note during a live session.
//
// Clinician taps the mic, speaks the SOAP-style note while watching the
// session, taps stop. Browser's built-in SpeechRecognition (webkit-prefixed
// in Safari) streams a live transcript. Then "Polish into note" sends the
// raw transcript to a server action that uses Claude Haiku (or a canned
// fallback) to clean it up into a SOAP draft.
//
// Designed to live at the bottom of SessionView for clinicians only. Single
// surface, three states: idle / recording / polished. No settings, no
// language picker, no editing during recording.
//
// Browser support: SpeechRecognition is Chrome/Safari/Edge. Firefox doesn't
// implement it. We feature-detect and quietly hide the panel when unsupported.

// SpeechRecognition is not in the standard TS DOM lib yet. Light shim.
type SR = {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] & { length: number } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SRCtor = new () => SR;
function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Phase = "idle" | "recording" | "polishing" | "polished";

export function VoiceNotePanel() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [polished, setPolished] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recognizer = useRef<SR | null>(null);
  const liveBufferRef = useRef("");

  useEffect(() => {
    setSupported(getSR() !== null);
  }, []);

  function start() {
    setErr(null);
    setTranscript("");
    setPolished("");
    liveBufferRef.current = "";
    const SRCtor = getSR();
    if (!SRCtor) {
      setErr("Voice capture isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    const r = new SRCtor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e) => {
      let finalAdd = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript;
        if (res.isFinal) finalAdd += text + " ";
        else interim += text;
      }
      if (finalAdd) liveBufferRef.current += finalAdd;
      setTranscript((liveBufferRef.current + interim).trim());
    };
    r.onerror = (e) => {
      setErr(e.error === "no-speech" ? "Didn't catch any speech. Try again." : `Recording error: ${e.error}`);
      setPhase("idle");
    };
    r.onend = () => {
      // If we end while still in "recording" the user must have hit stop or
      // browser auto-ended; either way the transcript is final.
      setTranscript(liveBufferRef.current.trim());
    };
    recognizer.current = r;
    r.start();
    setPhase("recording");
  }

  function stop() {
    recognizer.current?.stop();
    setPhase("idle");
  }

  async function polish() {
    if (!transcript.trim()) {
      setErr("Nothing to polish — record a note first.");
      return;
    }
    setPhase("polishing");
    setErr(null);
    try {
      const r = await polishNote(transcript);
      if (!r.ok) {
        setErr(r.error);
        setPhase("idle");
      } else {
        setPolished(r.text);
        setPhase("polished");
      }
    } catch (e) {
      setErr((e as Error).message ?? "Polish failed.");
      setPhase("idle");
    }
  }

  function reset() {
    setPhase("idle");
    setTranscript("");
    setPolished("");
    setErr(null);
    liveBufferRef.current = "";
  }

  function copyPolished() {
    navigator.clipboard?.writeText(polished).catch(() => {});
  }

  // Don't render the section at all if the browser doesn't support voice.
  // Better to omit than to show a disabled feature.
  if (supported === false) return null;
  if (supported === null) return null; // pre-mount, avoid SSR mismatch

  return (
    <section className="mt-8 mb-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Voice note</h2>
        <p className="text-xs text-gray-400">Speak the note while you watch. AI cleans it.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        {/* Top row: mic button + status */}
        <div className="flex items-center gap-4 mb-4">
          {phase === "idle" && (
            <button
              onClick={start}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <span aria-hidden>●</span> Start recording
            </button>
          )}
          {phase === "recording" && (
            <button
              onClick={stop}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <span aria-hidden className="w-2 h-2 rounded-full bg-white animate-pulse" /> Stop
            </button>
          )}
          {(phase === "polishing" || phase === "polished") && (
            <button
              onClick={reset}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Start over
            </button>
          )}

          <p className="text-xs text-gray-500 flex-1 min-w-0">
            {phase === "idle" && !transcript && "Tap start, speak the note, then tap stop. Polish turns it into a clean draft."}
            {phase === "idle" && transcript && "Recording stopped. Polish the transcript or record again."}
            {phase === "recording" && "Listening… speak naturally."}
            {phase === "polishing" && "Polishing into a clean note…"}
            {phase === "polished" && "Polished. Copy and paste into your EHR or edit further below."}
          </p>
        </div>

        {/* Raw transcript — visible in recording + idle-with-content */}
        {(phase === "recording" || (phase === "idle" && transcript)) && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Raw transcript</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-3 min-h-[60px] whitespace-pre-wrap">
              {transcript || <span className="text-gray-400 italic">…</span>}
            </p>
          </div>
        )}

        {/* Polished output */}
        {phase === "polished" && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">Polished note</p>
            <p className="text-sm text-gray-800 leading-relaxed bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 whitespace-pre-wrap">
              {polished}
            </p>
          </div>
        )}

        {/* Action row */}
        {(phase === "idle" && transcript) && (
          <button
            onClick={polish}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Polish into note <span aria-hidden>→</span>
          </button>
        )}
        {phase === "polished" && (
          <button
            onClick={copyPolished}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Copy polished note
          </button>
        )}

        {err && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-3">
            {err}
          </p>
        )}
      </div>
    </section>
  );
}
