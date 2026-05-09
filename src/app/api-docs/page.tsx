import Link from "next/link";

export const metadata = {
  title: "API · EEGBase",
  description: "REST + WebSocket API reference for EEGBase. v1 stable in Q1 2027.",
};

const ENDPOINTS = [
  { method: "GET",  path: "/v1/clinics/{id}",                 desc: "Clinic settings, branding, configured devices, audit metadata." },
  { method: "GET",  path: "/v1/clients",                      desc: "Paginated list of clients in your clinic." },
  { method: "POST", path: "/v1/clients",                      desc: "Create a new client. Returns the canonical client object + portal magic link." },
  { method: "GET",  path: "/v1/clients/{id}/sessions",        desc: "All sessions for a client, oldest first. Includes signal-quality summary, outcome scores." },
  { method: "POST", path: "/v1/sessions",                     desc: "Start a new session. Returns a WebSocket URL + token for streaming." },
  { method: "GET",  path: "/v1/sessions/{id}/stream  · WS",   desc: "WebSocket: live OxyHb/DeoxyHb/EEG band power at sample rate. Closes when session ends." },
  { method: "GET",  path: "/v1/sessions/{id}/export",         desc: "Download BIDS-fNIRS-compliant SNIRF + JSON sidecar bundle." },
  { method: "POST", path: "/v1/sessions/{id}/soap",           desc: "Generate a SOAP / DAP / BIRP / GIRP / PIE / SIRP note from session transcript + signal data." },
  { method: "GET",  path: "/v1/protocols",                    desc: "Library of evidence-based protocols. Searchable by condition." },
  { method: "POST", path: "/v1/billing/superbill",            desc: "Generate a CMS-1500 superbill for a session. Returns PDF URL + 837P submission ID." },
  { method: "POST", path: "/v1/webhooks",                     desc: "Subscribe to events: session.started, session.completed, claim.posted, risk.flagged." },
];

const METHOD_COLOR: Record<string, string> = { GET: "#10B981", POST: "#3B82F6", PUT: "#F59E0B", DELETE: "#EF4444", PATCH: "#A78BFA" };

export default function ApiDocsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase API</span>
          </Link>
          <Link href="/contact" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Contact →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#06B6D4", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>API · v1 beta</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>REST + WebSocket API</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Stable v1 ships Q1 2027. Beta available now to enterprise customers. All endpoints accept Bearer-token auth (rotate via /settings/api-keys), respond JSON, and follow REST conventions.
        </p>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { val: "50k/min", lbl: "Rate limit · flagship" },
            { val: "250k",    lbl: "Concurrent WS streams" },
            { val: "<80 ms",  lbl: "Stream lag (95% of the time)" },
            { val: "TLS 1.3", lbl: "Encrypted in transit" },
          ].map((s) => (
            <div key={s.lbl} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Quickstart */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Quickstart</h2>
        <div style={{ background: "#0F172A", borderRadius: 14, padding: 20, marginBottom: 20, overflow: "auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>TypeScript</p>
          <pre style={{ margin: 0, fontSize: 12, color: "#CBD5E1", fontFamily: "ui-monospace, monospace", lineHeight: 1.7 }}>{`import { EEGBase } from "@eegbase/sdk";

const client = new EEGBase({ apiKey: process.env.EEGBASE_KEY });

// Subscribe to a live session
const session = await client.sessions.create({ clientId: "cl_021", protocol: "smr-cz" });
session.on("sample", (s) => {
  console.log(s.t, s.oxyHb_left, s.oxyHb_right, s.alpha, s.theta);
});
session.on("threshold", (e) => console.log("Reward!", e.score));
await session.start();`}</pre>
        </div>

        <div style={{ background: "#0F172A", borderRadius: 14, padding: 20, marginBottom: 28, overflow: "auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>cURL</p>
          <pre style={{ margin: 0, fontSize: 12, color: "#CBD5E1", fontFamily: "ui-monospace, monospace", lineHeight: 1.7 }}>{`curl https://api.eegbase.com/v1/sessions \\
  -H "Authorization: Bearer $EEGBASE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"clientId":"cl_021","protocol":"smr-cz","device":"mendi-v3"}'`}</pre>
        </div>

        {/* Endpoint table */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Endpoints</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
          {ENDPOINTS.map((e, i) => (
            <div key={e.path + i} style={{ display: "grid", gridTemplateColumns: "70px 320px 1fr", gap: 16, padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid #F3F4F6", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: METHOD_COLOR[e.method] || "#64748B", padding: "3px 8px", background: `${METHOD_COLOR[e.method] || "#64748B"}1A`, borderRadius: 6, textAlign: "center", letterSpacing: "0.06em" }}>{e.method}</span>
              <code style={{ fontSize: 12, color: "#0F172A", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{e.path}</code>
              <span style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{e.desc}</span>
            </div>
          ))}
        </div>

        {/* Webhooks */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Webhooks</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>
            Subscribe to clinic events. Exponential retry backoff (1s · 5s · 30s · 5m · 30m · 4h · 24h max). HMAC-SHA256 signed bodies. IP allowlist available.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              "session.started",
              "session.completed",
              "session.threshold_reached",
              "client.created",
              "client.consent_changed",
              "claim.submitted",
              "claim.posted",
              "claim.denied",
              "risk.flagged",
              "soap.drafted",
              "report.generated",
              "device.disconnected",
            ].map((ev) => (
              <code key={ev} style={{ fontSize: 11, padding: "4px 9px", background: "#F1F5F9", color: "#475569", borderRadius: 6, fontFamily: "ui-monospace, monospace" }}>{ev}</code>
            ))}
          </div>
        </div>

        {/* Resources */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Resources</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { title: "Postman collection", desc: "Import all endpoints + auth into Postman or Insomnia.", action: "Download .json" },
            { title: "OpenAPI 3.1 spec",    desc: "Machine-readable API description for codegen.",        action: "View spec" },
            { title: "TypeScript SDK",      desc: "@eegbase/sdk · types + WS subscription helpers.",      action: "npm install" },
          ].map((r) => (
            <div key={r.title} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.55, marginBottom: 8 }}>{r.desc}</div>
              <span style={{ fontSize: 11, color: "#06B6D4", fontWeight: 700 }}>{r.action} →</span>
            </div>
          ))}
        </div>

        <div style={{ background: "linear-gradient(135deg, #ECFEFF, #F0F9FF)", border: "1px solid #67E8F9", borderRadius: 14, padding: 20, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Need beta access?</h2>
          <p style={{ fontSize: 13, color: "#0E7490", lineHeight: 1.6, marginBottom: 12 }}>
            Enterprise customers + Mendi partners get v1 beta keys today. Public beta opens in a future update.
          </p>
          <a href="mailto:api@eegbase.com?subject=API%20beta%20access" style={{ display: "inline-block", padding: "10px 18px", background: "#06B6D4", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Request beta key →
          </a>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/integrations" style={{ color: "#9CA3AF" }}>Integrations</Link>
      </footer>
    </div>
  );
}
