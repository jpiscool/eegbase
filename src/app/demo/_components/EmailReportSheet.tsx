"use client";

import { useEffect, useState, useRef } from "react";

// Tiny email-the-report modal. Opens from the post-session report screen
// (next to Download PDF + Copy share link) and from any expanded session
// row on the patient detail. Demo-only: fakes a 600ms loading state and
// shows a 'Sent ✓' confirmation, then dismisses. Production wires this
// to a server action that uses Resend or SES.

interface EmailReportSheetProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  defaultRecipient?: string;
  patientFirstName?: string;
}

export function EmailReportSheet({ open, setOpen, defaultRecipient = "", patientFirstName = "you" }: EmailReportSheetProps) {
  const [email, setEmail] = useState(defaultRecipient);
  const [note, setNote] = useState(`Hi — sharing ${patientFirstName === "you" ? "today's" : `${patientFirstName}'s`} session report. Let me know if you have questions.`);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSent(false);
      setBusy(false);
      setEmail(defaultRecipient);
      setNote(`Hi — sharing ${patientFirstName === "you" ? "today's" : `${patientFirstName}'s`} session report. Let me know if you have questions.`);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, defaultRecipient, patientFirstName]);

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

  function send() {
    if (!email.trim() || !email.includes("@") || busy) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
      setTimeout(() => setOpen(false), 1800);
    }, 600);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Email report"
      onClick={() => !busy && setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
      >
        {sent ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
              ✓
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Sent to <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Email report</p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Send the PDF as an email</h2>
              <p className="text-sm text-gray-500 leading-relaxed">One field, one click. No copy-paste.</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label htmlFor="email-to" className="block text-xs text-gray-500 mb-1.5">Send to</label>
                <input
                  ref={inputRef}
                  id="email-to"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="email-note" className="block text-xs text-gray-500 mb-1.5">Cover note</label>
                <textarea
                  id="email-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:border-blue-300 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={busy || !email.trim() || !email.includes("@")}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
