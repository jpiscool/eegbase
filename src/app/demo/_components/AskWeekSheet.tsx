"use client";

import { useState, useRef, useEffect } from "react";
import { askAboutWeek, type AskMessage } from "../ask-week-action";

interface AskWeekSheetProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  audience: "clinician" | "home";
  patientFirstName?: string;
}

// Starters are audience-aware. Home-user reads "me / my", clinician reads
// the patient's first name. Falls back to generic phrasing if no name.
function startersFor(audience: "clinician" | "home", patientFirstName: string) {
  if (audience === "home") {
    return [
      "What changed for me this week?",
      "Show me what's working.",
    ];
  }
  return [
    `What changed for ${patientFirstName} this week?`,
    `Show me what's working for ${patientFirstName}.`,
  ];
}

export function AskWeekSheet({ open, setOpen, audience, patientFirstName = "your client" }: AskWeekSheetProps) {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, busy]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (open && e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setErr(null);
    const next: AskMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      const r = await askAboutWeek(next);
      if (!r.ok) {
        setErr(r.error);
        setMessages(next); // leave the user message visible; no fake reply
      } else {
        setMessages([...next, { role: "assistant", content: r.text }]);
      }
    } catch (e) {
      setErr((e as Error).message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setMessages([]);
    setErr(null);
    setDraft("");
  }

  if (!open) return null;

  const heading =
    audience === "home"
      ? "Ask about your week"
      : `Ask about ${patientFirstName}\u2019s week`;
  const subhead =
    audience === "home"
      ? "Real Claude Haiku answer, grounded in your last 4 sessions and patterns."
      : `Real Claude Haiku answer, grounded in ${patientFirstName}\u2019s last 4 sessions and patterns.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Ask AI</p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{heading}</h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{subhead}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-gray-400 hover:text-gray-700 text-lg flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">Try a starter:</p>
              <div className="flex flex-col gap-2">
                {startersFor(audience, patientFirstName).map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={busy}
                    className="text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m, i) => (
                <li key={i} className={m.role === "user" ? "text-right" : ""}>
                  <span
                    className={`inline-block max-w-[85%] text-left px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </span>
                </li>
              ))}
              {busy && (
                <li>
                  <span className="inline-block bg-gray-100 text-gray-500 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" /> thinking…
                  </span>
                </li>
              )}
              {err && (
                <li>
                  <span className="inline-block bg-rose-50 text-rose-700 text-xs px-3 py-2 rounded-lg border border-rose-200">
                    {err}
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(draft); }}
            placeholder="Ask anything about your training…"
            disabled={busy}
            aria-label="Message"
            className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 disabled:opacity-50"
          />
          <button
            onClick={() => send(draft)}
            disabled={busy || !draft.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold flex-shrink-0"
          >
            Send
          </button>
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="px-2 py-2 text-xs text-gray-400 hover:text-gray-700"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
