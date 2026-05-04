/**
 * /docs/mendi-sdk — Public one-pager for the Mendi BLE integration.
 * No authentication required.
 *
 * Purpose: Share with Mendi team to show exactly what we need from them.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mendi BLE Integration — EEGBase",
  description: "What EEGBase needs from Mendi to complete the BLE WebBluetooth integration.",
};

function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: "#0F172A",
        color: "#E2E8F0",
        borderRadius: 12,
        padding: "18px 22px",
        fontSize: "0.78rem",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineHeight: 1.8,
        overflowX: "auto",
        border: "1px solid #1E293B",
      }}
    >
      {children}
    </pre>
  );
}

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      style={{
        background: "var(--surface-raised, white)",
        border: "1px solid var(--border-subtle, #E2E8F0)",
        borderRadius: 16,
        padding: "28px 32px",
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: "Pending" | "Assumed" | "Confirmed" | "Done" }) {
  const styles: Record<typeof status, { bg: string; color: string }> = {
    Pending:   { bg: "#FEF3C7", color: "#D97706" },
    Assumed:   { bg: "#EFF6FF", color: "#2563EB" },
    Confirmed: { bg: "#D1FAE5", color: "#059669" },
    Done:      { bg: "#D1FAE5", color: "#059669" },
  };
  const s = styles[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 99,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

export default function MendiSdkPage() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 64px" }}>

      {/* Top nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
        <Link
          href="/"
          style={{
            fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.03em",
            color: "#0F172A", textDecoration: "none",
          }}
        >
          EEG<span style={{ color: "#2563EB" }}>Base</span>
        </Link>
        <Link
          href="/docs"
          style={{ fontSize: "0.82rem", color: "#64748B", textDecoration: "none" }}
        >
          ← Full API docs
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: "0.72rem", fontWeight: 700, color: "#7C3AED",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12,
          }}
        >
          Integration Brief · Mendi × EEGBase
        </div>
        <h1
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            fontWeight: 800, color: "#0F172A",
            letterSpacing: "-0.03em", lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Mendi BLE Integration —{" "}
          <span style={{ color: "#7C3AED" }}>What We Need</span>
        </h1>
        <p style={{ fontSize: "1.05rem", color: "#475569", lineHeight: 1.6, maxWidth: 640 }}>
          EEGBase already has a complete WebBluetooth adapter for Mendi. To wire it up to
          real hardware, we need <strong style={{ color: "#0F172A" }}>3 values</strong> — and it can be done in an afternoon.
        </p>

        {/* "3 values, one afternoon" callout */}
        <div
          style={{
            marginTop: 24, padding: "18px 24px",
            background: "linear-gradient(135deg, #EDE9FE 0%, #F0F9FF 100%)",
            border: "1.5px solid #C4B5FD",
            borderRadius: 14,
            display: "flex", alignItems: "center", gap: 20,
          }}
        >
          <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>⚡</div>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#4C1D95", letterSpacing: "-0.02em" }}>
              3 values, one afternoon
            </div>
            <div style={{ fontSize: "0.82rem", color: "#6D28D9", marginTop: 4, lineHeight: 1.5 }}>
              BLE Service UUID · GATT Characteristic UUID · Byte layout — that is the entire integration surface.
              Everything else (connect flow, error handling, data storage, visualisation) is already built.
            </div>
          </div>
        </div>
      </div>

      {/* Table: what we need */}
      <Section id="what-we-need">
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, background: "#7C3AED", borderRadius: "50%", display: "inline-block" }} />
          What We Need From Mendi
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-subtle, #E2E8F0)" }}>
                {["Item", "Example / Current Value", "Notes", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left", paddingBottom: 12, paddingRight: 16,
                      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em",
                      textTransform: "uppercase", color: "var(--text-tertiary, #94A3B8)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  item: "BLE Service UUID",
                  example: "0000xxxx-0000-1000-8000-00805f9b34fb",
                  current: "Placeholder: 00001234-0000-1000-8000-00805f9b34fb",
                  notes: "Primary GATT service the headband advertises",
                  status: "Pending" as const,
                },
                {
                  item: "GATT Characteristic UUID",
                  example: "0000xxxx-0000-1000-8000-00805f9b34fb",
                  current: "Placeholder: 00001235-0000-1000-8000-00805f9b34fb",
                  notes: "Notify characteristic that streams fNIRS data",
                  status: "Pending" as const,
                },
                {
                  item: "Byte layout",
                  example: "20 bytes · 5 × float32 LE: [oxyHbL, oxyHbR, deoxyHbL, deoxyHbR, reward]",
                  current: "Assumed from Mendi app behaviour — not confirmed",
                  notes: "DataView parsing is ready; just needs field positions confirmed",
                  status: "Assumed" as const,
                },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid var(--border-subtle, #F1F5F9)", verticalAlign: "top" }}
                >
                  <td style={{ padding: "16px 16px 16px 0", fontWeight: 700, color: "var(--text-primary, #0F172A)", whiteSpace: "nowrap" }}>
                    {row.item}
                  </td>
                  <td style={{ padding: "16px 16px 16px 0", color: "var(--text-secondary, #475569)" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#6366F1", marginBottom: 4 }}>
                      {row.example}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary, #94A3B8)" }}>
                      Currently: {row.current}
                    </div>
                  </td>
                  <td style={{ padding: "16px 16px 16px 0", color: "var(--text-secondary, #64748B)", fontSize: "0.82rem" }}>
                    {row.notes}
                  </td>
                  <td style={{ padding: "16px 0", whiteSpace: "nowrap" }}>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Code block: exact lines to update */}
      <Section id="code-to-update">
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, background: "#2563EB", borderRadius: "50%", display: "inline-block" }} />
          Exact Lines to Update in <code style={{ fontSize: "0.82rem", color: "#7C3AED" }}>src/lib/device/mendi.ts</code>
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary, #64748B)", marginBottom: 18, lineHeight: 1.6 }}>
          The adapter is complete. The only two constants that need real values:
        </p>
        <Code>{`// src/lib/device/mendi.ts — lines 30-31

// ── Current (placeholder) ─────────────────────────────────────────────────────
const MENDI_SERVICE_UUID    = "00001234-0000-1000-8000-00805f9b34fb";  // ← replace
const MENDI_FNIRS_CHAR_UUID = "00001235-0000-1000-8000-00805f9b34fb";  // ← replace

// ── After update (example) ────────────────────────────────────────────────────
const MENDI_SERVICE_UUID    = "<actual-service-uuid-from-mendi>";
const MENDI_FNIRS_CHAR_UUID = "<actual-characteristic-uuid-from-mendi>";`}</Code>

        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary, #64748B)", marginBottom: 14, lineHeight: 1.6 }}>
            If the byte layout differs from our assumption, update the <code style={{ fontSize: "0.8rem", color: "#7C3AED" }}>_parse()</code> method below.
            The output shape (<code style={{ fontSize: "0.8rem", color: "#7C3AED" }}>DeviceSample</code>) must not change — everything downstream depends on it.
          </p>
          <Code>{`// Current _parse() — assumes 5 × float32 LE (20 bytes)
// Bytes 0-3  : oxyHbLeft   (μM)
// Bytes 4-7  : oxyHbRight  (μM)
// Bytes 8-11 : deoxyHbLeft (μM)
// Bytes 12-15: deoxyHbRight(μM)
// Bytes 16-19: rewardScore (0-100)  — optional, computed if absent

private _parse(view: DataView): DeviceSample {
  const oxyHbLeft   = view.byteLength >= 4  ? view.getFloat32(0,  true) : undefined;
  const oxyHbRight  = view.byteLength >= 8  ? view.getFloat32(4,  true) : undefined;
  const deoxyHbLeft = view.byteLength >= 12 ? view.getFloat32(8,  true) : undefined;
  const deoxyHbRight= view.byteLength >= 16 ? view.getFloat32(12, true) : undefined;
  const rewardScore = view.byteLength >= 20 ? view.getFloat32(16, true) : undefined;
  // ...
}`}</Code>
        </div>
      </Section>

      {/* If Mendi has a JS SDK */}
      <Section id="js-sdk">
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, background: "#10B981", borderRadius: "50%", display: "inline-block" }} />
          If Mendi Has a JS SDK
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #64748B)", lineHeight: 1.7, marginBottom: 16 }}>
          If Mendi provides a JavaScript/TypeScript SDK (npm package or CDN) instead of raw BLE UUIDs, the swap takes roughly <strong style={{ color: "#0F172A" }}>15 minutes</strong>:
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: "0.83rem", color: "var(--text-secondary, #64748B)" }}>
          {[
            ["Replace connect()", "Swap the navigator.bluetooth.requestDevice() block with the SDK's connect() call."],
            ["Replace _parse()", "Call the SDK's data accessor instead of reading DataView bytes manually."],
            ["Keep DeviceSample", "The output shape — { timestampMs, oxyHbLeft, oxyHbRight, deoxyHbLeft, deoxyHbRight, rewardScore } — must stay the same."],
            ["Zero downstream changes", "Session engine, charts, storage, API — everything else continues to work unchanged."],
          ].map(([title, body], i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ width: 20, height: 20, background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, color: "#059669", marginTop: 1 }}>
                {i + 1}
              </span>
              <div>
                <strong style={{ color: "#0F172A" }}>{title}: </strong>{body}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* REST API alternative */}
      <Section id="rest-api">
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, background: "#F59E0B", borderRadius: "50%", display: "inline-block" }} />
          REST API Alternative
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #64748B)", lineHeight: 1.7, marginBottom: 18 }}>
          If hardware integration is not available yet, Mendi can push completed sessions directly to EEGBase via REST — no BLE required.
          The same endpoint is used by the EEGBase desktop session flow.
        </p>
        <Code>{`POST /api/v1/sessions
Authorization: Bearer <clinic-id>
Content-Type: application/json

{
  "clientId":        "<client-uuid>",
  "deviceType":      "mendi",
  "startedAt":       "2026-05-11T09:30:00Z",
  "durationSeconds": 600,
  "samples": [
    {
      "timestampMs":    0,
      "oxyHbLeft":      0.05,    // μM — oxygenated Hb, left PFC
      "oxyHbRight":     0.04,    // μM — oxygenated Hb, right PFC
      "deoxyHbLeft":   -0.02,    // μM — de-oxygenated Hb, left
      "deoxyHbRight":  -0.03,    // μM — de-oxygenated Hb, right
      "rewardScore":    62.1     // 0–100, optional (computed if omitted)
    }
    // ... up to 50,000 samples
  ],
  "preSession":  { "focus": 6, "mood": 7, "anxiety": 4, "energy": 6 },
  "postSession": { "focus": 8, "mood": 8, "anxiety": 3, "energy": 7 }
}

// Response: 201 Created
{ "sessionId": "3f4a9b2e-..." }`}</Code>
        <p style={{ marginTop: 14, fontSize: "0.78rem", color: "var(--text-tertiary, #94A3B8)", lineHeight: 1.6 }}>
          A working demo push script is in the repo: <code>scripts/demo-api-push.sh</code> (bash) and{" "}
          <code>scripts/demo-api-push.ts</code> (TypeScript). Run <code>npm run demo:api</code> to test.
        </p>
      </Section>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "0.78rem", color: "#94A3B8", paddingTop: 16 }}>
        <Link href="/docs" style={{ color: "#2563EB", textDecoration: "none" }}>API Docs</Link>
        {" · "}
        <Link href="/demo" style={{ color: "#2563EB", textDecoration: "none" }}>Live Demo</Link>
        {" · "}
        <a href="https://github.com/eegbase/eegbase" style={{ color: "#2563EB", textDecoration: "none" }}>GitHub</a>
      </div>
    </div>
  );
}
