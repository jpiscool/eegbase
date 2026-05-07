"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Cmd = { kind: string; label: string; sub?: string; action: () => void; keywords?: string };

export function GlobalCommandK() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Disabled inside /demo since it has its own demo-specific palette
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    const sync = () => setDisabled(window.location.pathname.startsWith("/demo"));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const cmds: Cmd[] = useMemo(() => {
    const nav = (path: string) => () => { router.push(path); setOpen(false); };
    return [
      // Marketing
      { kind: "Page",  label: "Home",                 action: nav("/"),                          keywords: "landing" },
      { kind: "Demo",  label: "Live demo",            action: nav("/demo"),                       keywords: "try" },
      { kind: "Demo",  label: "Demo · AI Insights",   action: nav("/demo?tab=ai"),                keywords: "pattern detector cross-session" },
      { kind: "Demo",  label: "Demo · Live Session",  action: nav("/demo?tab=session"),           keywords: "video co-feedback" },
      { kind: "Demo",  label: "Demo · Brain Map",     action: nav("/demo?tab=brain"),             keywords: "normative qeeg" },
      { kind: "Demo",  label: "Demo · Reports",       action: nav("/demo?tab=reports"),           keywords: "registry irb" },
      { kind: "Demo",  label: "Demo · Marketing",     action: nav("/demo?tab=marketing"),         keywords: "white label coaching" },
      { kind: "Demo",  label: "Demo · Devices & API", action: nav("/demo?tab=devices"),           keywords: "mendi sidecar bids" },
      { kind: "Demo",  label: "Demo · Compliance",    action: nav("/demo?tab=compliance"),        keywords: "schrems hipaa soc" },
      { kind: "Page",  label: "Mendi partnership",    sub: "/mendi", action: nav("/mendi"),       keywords: "fnirs partner" },
      { kind: "Page",  label: "Mendi Clinical preview (white-label)", sub: "/mendi-clinical-preview", action: nav("/mendi-clinical-preview"), keywords: "white label brand" },
      { kind: "Page",  label: "Pricing",              sub: "/#pricing", action: nav("/#pricing"), keywords: "cost solo practice enterprise" },
      // Resource pages
      { kind: "Pages", label: "Research",             action: nav("/research"),                   keywords: "publication preprint paper" },
      { kind: "Pages", label: "Case studies",         action: nav("/case-studies"),               keywords: "outcomes" },
      { kind: "Pages", label: "Roadmap",              action: nav("/roadmap"),                    keywords: "future quarters" },
      { kind: "Pages", label: "Changelog",            action: nav("/changelog"),                  keywords: "shipped recent" },
      { kind: "Pages", label: "Status",               action: nav("/status"),                     keywords: "uptime incident" },
      { kind: "Pages", label: "Integrations",         action: nav("/integrations"),               keywords: "device hardware ehr" },
      { kind: "Pages", label: "API docs",             action: nav("/api-docs"),                   keywords: "rest webhook sdk" },
      { kind: "Pages", label: "Security",             action: nav("/security"),                   keywords: "soc2 schrems threat" },
      { kind: "Pages", label: "Privacy",              action: nav("/privacy"),                    keywords: "hipaa gdpr" },
      { kind: "Pages", label: "Terms",                action: nav("/terms"),                      keywords: "tos legal" },
      { kind: "Pages", label: "Team",                 action: nav("/team"),                       keywords: "hiring jobs" },
      { kind: "Pages", label: "Brand assets",         action: nav("/brand-assets"),               keywords: "logo color press" },
      { kind: "Pages", label: "Downloads",            action: nav("/downloads"),                  keywords: "bids irb sample" },
      { kind: "Pages", label: "Community",            action: nav("/community"),                  keywords: "forum protocols" },
      // Actions
      { kind: "Action", label: "Subscribe to changelog RSS", action: () => { window.open("/changelog/rss.xml", "_blank"); setOpen(false); } },
      { kind: "Action", label: "Email hello@eegbase.com",     action: () => { window.location.href = "mailto:hello@eegbase.com"; setOpen(false); } },
      { kind: "Action", label: "Email security@eegbase.com",  action: () => { window.location.href = "mailto:security@eegbase.com"; setOpen(false); } },
      { kind: "Action", label: "Open GitHub repo",             action: () => { window.open("https://github.com/eegbase/eegbase", "_blank"); setOpen(false); } },
      { kind: "Action", label: "Download BIDS-fNIRS sample",  action: () => { window.location.href = "/downloads/sub-021_ses-08_task-focus_nirs.json"; setOpen(false); } },
      { kind: "Action", label: "Download IRB packet sample",  action: () => { window.location.href = "/downloads/EEGBase-Mendi-IRB-Packet-Sample.docx"; setOpen(false); } },
    ];
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cmds;
    return cmds.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      c.kind.toLowerCase().includes(q) ||
      (c.keywords ?? "").toLowerCase().includes(q)
    );
  }, [query, cmds]);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (disabled || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 1200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 14, width: "100%", maxWidth: 600, overflow: "hidden", boxShadow: "0 32px 96px rgba(0,0,0,0.35)" }}>
        <input
          ref={inputRef}
          placeholder="Search pages, demo tabs, actions… ⌘K to toggle, esc to close"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", padding: "16px 20px", border: "none", borderBottom: "1px solid #E5E7EB", fontSize: 14, outline: "none" }}
        />
        <div style={{ maxHeight: 420, overflowY: "auto", padding: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.kind + ":" + c.label}
                onClick={c.action}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "none", background: "transparent", textAlign: "left", color: "#0F172A", fontSize: 13, cursor: "pointer", borderRadius: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 9, fontWeight: 800, color: c.kind === "Demo" ? "#7C3AED" : c.kind === "Action" ? "#10B981" : "#2563EB", padding: "2px 7px", background: c.kind === "Demo" ? "#EDE9FE" : c.kind === "Action" ? "#DCFCE7" : "#DBEAFE", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{c.kind}</span>
                <span style={{ flex: 1 }}>{c.label}</span>
                {c.sub && <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "ui-monospace, monospace" }}>{c.sub}</span>}
              </button>
            ))
          )}
        </div>
        <div style={{ padding: "8px 16px", borderTop: "1px solid #E5E7EB", background: "#F8FAFC", fontSize: 11, color: "#64748B", display: "flex", justifyContent: "space-between" }}>
          <span><kbd style={{ fontFamily: "ui-monospace, monospace", padding: "1px 5px", background: "white", border: "1px solid #E5E7EB", borderRadius: 3 }}>↵</kbd> select · <kbd style={{ fontFamily: "ui-monospace, monospace", padding: "1px 5px", background: "white", border: "1px solid #E5E7EB", borderRadius: 3, marginLeft: 4 }}>esc</kbd> close</span>
          <span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}
