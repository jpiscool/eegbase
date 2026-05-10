"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "eegbase-pwa-prompt-state";

export function InstallPwaPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // If user already dismissed within 30 days, don't show again
    if (stored) {
      try {
        const { ts } = JSON.parse(stored);
        if (Date.now() - ts < 30 * 24 * 60 * 60 * 1000) return;
      } catch {}
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      // Wait 30 seconds before showing — feels less aggressive
      setTimeout(() => setVisible(true), 30000);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), choice: "dismissed" })); } catch {}
  }

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const result = await evt.userChoice;
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), choice: result.outcome })); } catch {}
  }

  if (!visible || !evt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install EEGBase"
      style={{
        position: "fixed",
        bottom: 88, // sits above the cookie banner / sticky CTA
        right: 16,
        maxWidth: 340,
        zIndex: 90,
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        boxShadow: "0 16px 48px rgba(15,23,42,0.18)",
        padding: 16,
        animation: "slide-pwa 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`@keyframes slide-pwa { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 40, height: 40, background: "#2563EB", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Install EEGBase</div>
          <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.55, marginBottom: 10 }}>
            Add it to your dock for one-click access. Works offline. No app-store gatekeeping.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={install} style={{ flex: 1, padding: "8px 12px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Install</button>
            <button onClick={dismiss} style={{ padding: "8px 12px", background: "transparent", color: "#64748B", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Not now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
