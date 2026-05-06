"use client";

import Link from "next/link";

// White-label "Mendi Clinical" preview — visceral artifact for the partnership pitch.
// All styles are inline so this page is fully self-contained and renders the rebrand
// even if other parts of the codebase change.

const MENDI_VIOLET = "#7C3AED";
const MENDI_VIOLET_LIGHT = "#A78BFA";
const MENDI_VIOLET_BG = "#1E1B4B";
const NAVY = "#0F172A";
const INK = "#1E293B";
const MUTED = "#94A3B8";
const SUBTLE = "#CBD5E1";
const BORDER = "#1E293B";
const SUCCESS = "#34D399";
const PANEL_BG = "#0A1320";
const SOFT = "#475569";

export default function MendiClinicalPreviewPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* TOP NAV — public site */}
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14 }}>
            <Link href="/mendi" style={{ color: "#6B7280", textDecoration: "none" }}>Partnership</Link>
            <Link href="/demo" style={{ color: "#6B7280", textDecoration: "none" }}>Live demo</Link>
            <a href="mailto:hello@eegbase.com" style={{ fontWeight: 600, padding: "8px 16px", background: MENDI_VIOLET, color: "#fff", borderRadius: 8, textDecoration: "none" }}>
              Talk to us →
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${MENDI_VIOLET_BG} 50%, #3B0764 100%)`, color: "#fff", padding: "72px 24px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#DDD6FE", marginBottom: 24, border: "1px solid rgba(196,181,253,0.3)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: MENDI_VIOLET_LIGHT }} />
            White-label preview · for Mendi&apos;s eyes only
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 18 }}>
            What &ldquo;<span style={{ color: MENDI_VIOLET_LIGHT }}>Mendi Clinical</span>&rdquo; could look like
          </h1>
          <p style={{ fontSize: 17, color: "#C4B5FD", lineHeight: 1.7, maxWidth: 720, marginBottom: 12 }}>
            Same EEGBase platform · Mendi&apos;s brand · Mendi&apos;s domain · Mendi keeps the customer relationship.
            One toggle, two-week launch, sixty-forty rev share.
          </p>
          <p style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
            This page is a visual mockup. Mendi has not yet approved, signed, or commissioned this design.
          </p>
        </div>
      </section>

      {/* SIDE-BY-SIDE COMPARISON */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* LEFT — EEGBase default */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", padding: "3px 8px", background: "#F3F4F6", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>Today · default theme</span>
            </div>
            <DashboardMock variant="eegbase" />
            <div style={{ marginTop: 12, fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
              <strong style={{ color: "#111" }}>Standard EEGBase brand</strong> — what every clinic sees by default. Blue primary, &ldquo;EEGBase&rdquo; wordmark, eegbase.app domain.
            </div>
          </div>

          {/* RIGHT — Mendi Clinical */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", padding: "3px 8px", background: MENDI_VIOLET, borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>White-label · Mendi-attached clinics</span>
            </div>
            <DashboardMock variant="mendi" />
            <div style={{ marginTop: 12, fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
              <strong style={{ color: "#111" }}>Mendi Clinical mode</strong> — same EEGBase platform under Mendi&apos;s brand. Violet primary, Mendi wordmark, mendi-clinical.app domain.
            </div>
          </div>
        </div>
      </section>

      {/* WHAT CHANGED */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 8, letterSpacing: "-0.02em" }}>
          What changes when Mendi Clinical mode is on
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
          One toggle in admin settings. Theme propagates across all 16 tabs, the patient portal, the booking page, the share-link viewer, and outbound emails.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[
            { label: "Logo + wordmark", before: "EEGBase blue square", after: "Mendi spectrum logo + wordmark" },
            { label: "Primary color", before: "#2563EB blue", after: "#7C3AED Mendi violet" },
            { label: "Custom domain", before: "yourclinic.eegbase.app", after: "yourclinic.mendi-clinical.app" },
            { label: "Email sender", before: "noreply@eegbase.app", after: "noreply@mendi-clinical.app" },
            { label: "PDF report header", before: "EEGBase Progress Report", after: "Mendi Clinical Progress Report" },
            { label: "Patient portal", before: "EEGBase-branded mobile app", after: "Mendi-branded · same codebase" },
            { label: "Footer", before: "Powered by EEGBase", after: "Mendi Clinical · powered by EEGBase (small)" },
            { label: "Customer relationship", before: "Clinic ↔ EEGBase", after: "Clinic ↔ Mendi · EEGBase invisible" },
          ].map((row, i) => (
            <div key={row.label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 16px 1fr", alignItems: "center", gap: 8, fontSize: 13 }}>
                <div style={{ color: "#9CA3AF", textDecoration: "line-through" }}>{row.before}</div>
                <div style={{ color: MENDI_VIOLET, fontWeight: 700, textAlign: "center" }}>→</div>
                <div style={{ color: "#111", fontWeight: 600 }}>{row.after}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMERCIAL TERMS */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${MENDI_VIOLET_BG} 100%)`, borderRadius: 20, padding: "36px 32px", color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MENDI_VIOLET_LIGHT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Commercials · proposal</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.02em" }}>How the rev share works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { val: "60 / 40", label: "Mendi / EEGBase rev split", sub: "On every clinic SaaS subscription" },
              { val: "$349", label: "Practice tier list price", sub: "Per clinic / month · Mendi sees 60% = $209" },
              { val: "0 hrs", label: "Mendi engineering required", sub: "Theme switcher only · no fork" },
              { val: "2 wk", label: "Time to launch", sub: "DPA signed · co-mark approved · DNS live" },
            ].map((c) => (
              <div key={c.label} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(196,181,253,0.2)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: MENDI_VIOLET_LIGHT, letterSpacing: "-0.03em", marginBottom: 6 }}>{c.val}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{c.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(0,0,0,0.25)", borderRadius: 8, fontSize: 12, color: "#C4B5FD", lineHeight: 1.7 }}>
            <strong style={{ color: "#fff" }}>Audited via Stripe Connect</strong> — quarterly settlement, no spreadsheets, no trust-me. Mendi gets a real-time revenue dashboard the day the partnership goes live.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ background: "#fff", border: `2px solid ${MENDI_VIOLET}`, borderRadius: 16, padding: "32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Want to see this rendered against real Mendi assets?
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 22, maxWidth: 640, margin: "0 auto 22px" }}>
            Send us your logo, brand colors, and target subdomain. We&apos;ll spin up a private staging URL within 48 hours so your team can click through every tab in Mendi-branded form.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:hello@eegbase.com?subject=Mendi%20Clinical%20staging%20request" style={{ padding: "12px 22px", background: MENDI_VIOLET, color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Request private staging →
            </a>
            <Link href="/mendi" style={{ padding: "12px 22px", background: "transparent", border: "1px solid #E5E7EB", color: "#374151", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              See full partnership doc
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER DISCLOSURE */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 11, color: "#9CA3AF" }}>
        Mockup only. Mendi has not approved or commissioned this page. Brand colors and logo treatment are illustrative.<br />
        © 2026 EEGBase · MIT licensed · github.com/eegbase/eegbase
      </footer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard mockup component — used twice with different theme variants
// ────────────────────────────────────────────────────────────────────────────
function DashboardMock({ variant }: { variant: "eegbase" | "mendi" }) {
  const isMendi = variant === "mendi";
  const accent = isMendi ? MENDI_VIOLET : "#2563EB";
  const accentLight = isMendi ? MENDI_VIOLET_LIGHT : "#60A5FA";
  const brandName = isMendi ? "Mendi Clinical" : "EEGBase";
  const brandPrefix = isMendi ? "M" : "E";
  const brandPrefixB = isMendi ? "C" : "B";
  const tabBadge = isMendi ? "MENDI" : "DEMO";

  return (
    <div style={{ background: NAVY, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB" }}>
      {/* Top bar */}
      <div style={{ background: NAVY, borderBottom: `1px solid ${BORDER}`, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 44 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>{brandPrefix}{brandPrefix === "M" ? "endi" : "EG"}</span>
            <span style={{ color: accentLight, fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>{isMendi ? "Clinical" : "Base"}</span>
          </div>
          <span style={{ background: `${accent}26`, color: accentLight, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {tabBadge}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: SUCCESS, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: SUCCESS }} />
            LIVE
          </span>
          <span style={{ fontSize: 8, color: MUTED, padding: "2px 5px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99, fontWeight: 700, textTransform: "uppercase" }}>HIPAA</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "4px 10px", background: accent, color: "#fff", borderRadius: 6 }}>Get Access →</span>
        </div>
      </div>

      <div style={{ display: "flex", height: 280 }}>
        {/* Sidebar */}
        <div style={{ width: 130, background: "#0B1628", borderRight: `1px solid ${BORDER}`, padding: "8px 0" }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: SOFT, padding: "6px 12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>During session</div>
          {[
            { name: "Live Session", active: true, badge: tabBadge },
            { name: "Game Mode" },
            { name: "Brain Map" },
            { name: "Heart & Breath" },
          ].map((t) => (
            <div key={t.name} style={{ padding: "5px 12px", fontSize: 10, color: t.active ? "#F1F5F9" : MUTED, borderLeft: t.active ? `2px solid ${accentLight}` : "2px solid transparent", background: t.active ? `${accent}1A` : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{t.name}</span>
              {t.badge && <span style={{ fontSize: 7, color: accentLight, background: `${accentLight}26`, padding: "1px 4px", borderRadius: 3, fontWeight: 800 }}>{t.badge}</span>}
            </div>
          ))}
          <div style={{ fontSize: 8, fontWeight: 700, color: SOFT, padding: "12px 12px 6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Records</div>
          {["Questionnaires", "Progress", "AI Insights", "Reports"].map((n, i) => (
            <div key={n} style={{ padding: "5px 12px", fontSize: 10, color: MUTED }}>
              {n} {i === 2 && <span style={{ fontSize: 7, color: accentLight, background: `${accentLight}26`, padding: "1px 4px", borderRadius: 3, fontWeight: 800, marginLeft: 4 }}>{tabBadge}</span>}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 14, background: NAVY }}>
          {/* Co-feedback panel mock */}
          <div style={{ background: `linear-gradient(135deg, ${PANEL_BG}, #0A1A2E)`, border: `1px solid ${accent}`, borderRadius: 10, padding: 10, marginBottom: 10, display: "flex", gap: 10 }}>
            <div style={{ width: 60, height: 50, borderRadius: 6, background: `linear-gradient(135deg, ${accentLight}, ${accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>SM</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: accentLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>HIPAA video · co-feedback</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                {[
                  { k: "Latency",  v: "120ms" },
                  { k: "Sync",     v: "±80ms" },
                  { k: "Encrypt",  v: "DTLS" },
                  { k: "BAA",      v: "Daily" },
                ].map((s) => (
                  <div key={s.k} style={{ background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "3px 5px" }}>
                    <div style={{ fontSize: 7, color: MUTED, fontWeight: 700, textTransform: "uppercase" }}>{s.k}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#F1F5F9" }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reward score mock */}
          <div style={{ background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#F1F5F9" }}>Reward Score · Session 8</span>
              <span style={{ fontSize: 9, color: SUCCESS, fontWeight: 700 }}>+0.3 ↑</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: "-0.02em" }}>56</div>
              <div style={{ flex: 1, height: 18, background: "#0F172A", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                <svg viewBox="0 0 200 18" width="100%" height="18">
                  <path d="M 0,12 Q 25,8 50,11 T 100,9 T 150,7 T 200,5" fill="none" stroke={accent} strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Signal pills */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[
              { name: isMendi ? "Mendi fNIRS" : "Mendi fNIRS", q: "96%" },
              { name: "Cz EEG", q: "88%" },
              { name: "Polar HRV", q: "99%" },
            ].map((p) => (
              <div key={p.name} style={{ background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 99, padding: "3px 8px", fontSize: 9, color: SUBTLE, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: SUCCESS }} />
                <span>{p.name}</span>
                <span style={{ color: MUTED }}>{p.q}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
