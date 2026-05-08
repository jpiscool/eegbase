"use client";

import { useState, useEffect, useRef } from "react";

type Msg = { role: "bot" | "user"; text: string };

const STORAGE_KEY = "eegbase-chat";

const QUICK = [
  { label: "What does EEGBase do?",    answer: "EEGBase is the clinical layer for any neurofeedback hardware. Mendi at home, Muse in clinic, Polar HRV, and Apple Health become one client record, one SOAP note, one billable session. Open-source, MIT-licensed, with native Mendi support and an AI cross-session pattern detector." },
  { label: "Pricing?",                 answer: "Solo at $19/session, Practice at $349/clinic/mo, Enterprise custom. All plans get a 30-day free trial, no card required. Mendi-attached clinics get 20% off Practice/Enterprise. Full pricing at /#pricing — currency toggle for USD/EUR/GBP/CAD/AUD." },
  { label: "Is it HIPAA compliant?",   answer: "Yes — we operate under signed BAA. AES-256 at rest, TLS 1.3 in transit, SOC 2 Type II audited Q1 2026 by Coalfire, Bishop Fox pen-tested. EU clinics get Schrems II SCCs. See /security for the full posture." },
  { label: "Does it work with Mendi?", answer: "Yes — Mendi is our flagship integration. 10 Hz prefrontal fNIRS (Fp1/Fp2), sub-80ms latency, 96.4% MAR accuracy, BLE auto-reconnect under 1.4s. See /devices for the full hardware breakdown." },
  { label: "Talk to a human",          answer: "Email hello@eegbase.com or fill out /contact. We answer within 24 hours. Or book a 30-min call directly at /mendi#book-meeting." },
];

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hi! I'm the EEGBase mini-bot. I can answer the most common questions or route you to a real human. What's on your mind?" },
  ]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, open]);

  function ask(question: string, answer: string) {
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setTimeout(() => setMsgs((m) => [...m, { role: "bot", text: answer }]), 320);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const q = draft.trim();
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setDraft("");
    // Mock-response heuristic — real impl would route to Claude or escalate to human
    setTimeout(() => {
      let answer = "Thanks — let me get a human on this. Email hello@eegbase.com with this thread or fill out /contact and we'll respond within 24 hours.";
      const lc = q.toLowerCase();
      if (lc.match(/price|cost|how much|paid plan/)) answer = QUICK[1].answer;
      else if (lc.match(/hipaa|secur|priv|compliance|gdpr/)) answer = QUICK[2].answer;
      else if (lc.match(/mendi|fnirs|hardware|device/)) answer = QUICK[3].answer;
      else if (lc.match(/what is|what does|do you do|about/)) answer = QUICK[0].answer;
      else if (lc.match(/human|person|sales|book|demo|call/)) answer = QUICK[4].answer;
      setMsgs((m) => [...m, { role: "bot", text: answer }]);
      try {
        const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        log.push({ ts: Date.now(), q, a: answer });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(-50)));
      } catch {}
    }, 380);
  }

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 80,
          width: 52,
          height: 52,
          borderRadius: 99,
          background: open ? "#0F172A" : "#2563EB",
          border: "none",
          cursor: "pointer",
          color: "white",
          fontSize: 22,
          boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
        }}
        title="Ask EEGBase"
      >
        <span aria-hidden="true">{open ? "×" : "💬"}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="EEGBase chat"
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            zIndex: 80,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            height: 460,
            background: "white",
            borderRadius: 14,
            boxShadow: "0 16px 48px rgba(15,23,42,0.18)",
            border: "1px solid #E5E7EB",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "chat-slide 0.25s ease",
          }}
        >
          <style>{`@keyframes chat-slide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <div style={{ padding: "12px 16px", background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "white" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Ask EEGBase</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>Mock-bot for demo · real human via /contact</div>
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#FAFAFA" }}>
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.55,
                  background: m.role === "user" ? "#2563EB" : "white",
                  color: m.role === "user" ? "white" : "#0F172A",
                  border: m.role === "bot" ? "1px solid #E5E7EB" : "none",
                  whiteSpace: "pre-wrap",
                }}
              >{m.text}</div>
            ))}
          </div>
          {/* Quick actions */}
          <div style={{ display: "flex", gap: 6, padding: "8px 10px", overflowX: "auto", borderTop: "1px solid #F3F4F6", background: "white" }}>
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => ask(q.label, q.answer)}
                style={{ fontSize: 11, padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 99, background: "white", color: "#475569", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >{q.label}</button>
            ))}
          </div>
          <form onSubmit={send} style={{ padding: 10, borderTop: "1px solid #F3F4F6", background: "white", display: "flex", gap: 8 }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask anything…" style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none" }} />
            <button type="submit" style={{ padding: "8px 14px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}
