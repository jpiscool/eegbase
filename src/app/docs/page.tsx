import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Key, Zap, Database, Wifi, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Docs · EEGBase",
  description:
    "REST + WebSocket APIs for clinical neurofeedback. Endpoints, auth, rate limits, and SDK examples for Mendi fNIRS, Muse EEG, and the synthetic simulator.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Developer Docs · EEGBase",
    description: "REST + WebSocket APIs for clinical neurofeedback. BIDS-fNIRS native.",
    url: "/docs",
    type: "website",
  },
};

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-xl px-5 py-4 text-[12.5px] font-mono leading-relaxed overflow-x-auto">
      {children}
    </pre>
  );
}

function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const methodStyle =
    method === "POST" ? { background: "var(--success-subtle)", color: "var(--success)" } :
    method === "GET"  ? { background: "color-mix(in srgb, var(--brand) 12%, transparent)", color: "var(--brand)" } :
    { background: "var(--surface-sunken)", color: "var(--text-secondary)" };
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5" style={methodStyle}>
        {method}
      </span>
      <div>
        <code className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>{path}</code>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</p>
      </div>
    </div>
  );
}

export default async function DocsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId;

  // Only run the clinic lookup when there's a real UUID. Public/anonymous
  // visitors should still see the API docs — the original code passed
  // an empty string into a UUID column and Postgres rejected it
  // ("invalid input syntax for type uuid"), 500-ing the whole page.
  if (clinicId) {
    await db
      .select({ name: clinics.name })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-gray-900">
          <BookOpen size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>API Documentation</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>REST API reference for EEGBase integrations</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { icon: Key, label: "Authentication", href: "#auth" },
          { icon: Database, label: "Ingestion API", href: "#ingest" },
          { icon: Zap, label: "Webhooks", href: "#webhooks" },
          { icon: Wifi, label: "Devices", href: "#devices" },
        ].map(({ icon: Icon, label, href }) => (
          <a key={label} href={href} className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
            <Icon size={15} style={{ color: "var(--text-tertiary)" }} />
            {label}
          </a>
        ))}
      </div>

      {/* Auth section */}
      <div id="auth" className="rounded-xl p-6 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Authentication</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          All API requests require a Bearer token. Your API key is your <strong>Clinic ID</strong> — visible in Settings → API Access.
        </p>
        <div className="rounded-lg px-4 py-3 mb-4" style={{ background: "color-mix(in srgb, var(--brand) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--brand)" }}>Your API Key</p>
          <code className="text-sm font-mono break-all" style={{ color: "var(--brand)" }}>{clinicId}</code>
        </div>
        <Code>{`curl -X POST https://your-eegbase.com/api/v1/sessions \\
  -H "Authorization: Bearer ${clinicId || "<YOUR_CLINIC_ID>"}" \\
  -H "Content-Type: application/json" \\
  -d '{ ... }'`}</Code>
      </div>

      {/* Endpoints overview */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Available Endpoints</h2>
        </div>
        <div className="px-6 py-2">
          <Endpoint method="POST" path="/api/v1/sessions" description="Ingest a completed session with fNIRS or EEG samples" />
          <Endpoint method="GET"  path="/api/sessions/{id}" description="Export a single session as JSON (auth required)" />
          <Endpoint method="GET"  path="/api/sessions/export" description="Export all sessions as CSV (auth required)" />
          <Endpoint method="GET"  path="/api/clients/{id}/export" description="Export all sessions for a client as CSV" />
          <Endpoint method="POST" path="/api/v1/sessions (webhook)" description="Outbound — EEGBase sends this to your URL after each session is saved" />
        </div>
      </div>

      {/* Ingest API */}
      <div id="ingest" className="rounded-xl p-6 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Database size={16} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>POST /api/v1/sessions</h2>
          <span className="px-2 py-0.5 text-xs font-bold rounded" style={{ background: "var(--success-subtle)", color: "var(--success)" }}>201</span>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Push completed session data into EEGBase from a server-side integration (e.g. Mendi cloud, research pipeline, custom firmware).
          Returns <code className="px-1 rounded text-xs" style={{ background: "var(--surface-sunken)", color: "var(--text-primary)" }}>{"{ sessionId }"}</code>.
        </p>

        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Request body</p>
        <Code>{`{
  "clientId":        "uuid",           // required — must belong to your clinic
  "deviceType":      "mendi",          // "mendi" | "muse" | "simulator"
  "startedAt":       "2026-05-11T09:30:00Z",  // ISO 8601
  "durationSeconds": 1200,             // optional

  // Array of 1-second samples (up to 50,000)
  "samples": [
    {
      "timestampMs":   0,
      "oxyHbLeft":     0.05,           // μM  (Mendi fNIRS — oxygenated Hb)
      "oxyHbRight":    0.04,
      "deoxyHbLeft":  -0.02,           // μM  (de-oxygenated Hb)
      "deoxyHbRight": -0.03,
      "delta":         0.35,           // 0–1  (EEG band power — Muse)
      "theta":         0.40,
      "alpha":         0.50,
      "beta":          0.30,
      "gamma":         0.15,
      "rewardScore":   52.3            // 0–100 (computed reward signal)
    }
  ],

  // Pre-session questionnaire (optional, 1–10 integer scales)
  "preSession":  { "focus": 6, "mood": 7, "anxiety": 4, "energy": 7 },

  // Post-session questionnaire (optional)
  "postSession": { "focus": 8, "mood": 8, "anxiety": 3, "energy": 6, "notes": "..." },

  "protocolId":    "uuid",            // optional — assign to existing protocol
  "clinicalNotes": "..."              // optional free-text
}`}</Code>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Response</p>
          <Code>{`// 201 Created
{ "sessionId": "3f4a9b2e-..." }

// 400 Bad Request
{ "error": "clientId does not belong to this clinic" }

// 401 Unauthorized
{ "error": "Invalid or missing API key" }`}</Code>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Example (curl)</p>
          <Code>{`curl -X POST https://your-eegbase.com/api/v1/sessions \\
  -H "Authorization: Bearer ${clinicId || "<YOUR_CLINIC_ID>"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "<client-uuid>",
    "deviceType": "mendi",
    "startedAt": "2026-05-11T09:30:00Z",
    "durationSeconds": 1200,
    "samples": [
      { "timestampMs": 0, "oxyHbLeft": 0.05, "oxyHbRight": 0.04,
        "deoxyHbLeft": -0.02, "deoxyHbRight": -0.03, "rewardScore": 54.2 }
    ],
    "preSession": { "focus": 6, "mood": 7, "anxiety": 4, "energy": 6 },
    "postSession": { "focus": 8, "mood": 8, "anxiety": 3, "energy": 7 }
  }'`}</Code>
        </div>
      </div>

      {/* Webhooks */}
      <div id="webhooks" className="rounded-xl p-6 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Outbound Webhooks</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Configure a webhook URL in <a href="/settings" className="hover:underline" style={{ color: "var(--brand)" }}>Settings</a>. EEGBase will POST a JSON payload to your URL every time a session is saved — browser or API.
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Payload</p>
        <Code>{`{
  "event":          "session.saved",
  "sessionId":      "uuid",
  "clientName":     "Sarah Mitchell",
  "clinicianName":  "Dr. Jordan Lee",
  "deviceType":     "mendi",
  "startedAt":      "2026-05-11T09:30:00Z",
  "durationSeconds": 1200,
  "avgRewardScore": 68.4,
  "sampleCount":    1200,
  "preSession":     { "focus": 5, "mood": 6, "anxiety": 4, "energy": 6 },
  "postSession":    { "focus": 8, "mood": 7, "anxiety": 3, "energy": 7 },
  "timestamp":      "2026-05-11T09:51:04Z"
}`}</Code>
        <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>Delivery: fire-and-forget with 8s timeout. Configure and test in <a href="/settings" className="hover:underline" style={{ color: "var(--brand)" }}>Settings → Webhooks</a>.</p>
      </div>

      {/* Devices */}
      <div id="devices" className="rounded-xl p-6 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={16} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Supported Devices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th className="text-left py-2 pr-6 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Device</th>
                <th className="text-left py-2 pr-6 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Modality</th>
                <th className="text-left py-2 pr-6 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Signals</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Integration</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td className="py-3 pr-6 font-medium" style={{ color: "var(--text-primary)" }}>Mendi</td>
                <td className="py-3 pr-6" style={{ color: "var(--text-secondary)" }}>fNIRS</td>
                <td className="py-3 pr-6 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>oxyHbLeft, oxyHbRight, deoxyHbLeft, deoxyHbRight</td>
                <td className="py-3"><span className="px-2 py-0.5 text-xs font-medium rounded" style={{ background: "color-mix(in srgb, #7C3AED 10%, transparent)", color: "#7C3AED" }}>WebBluetooth + REST API</span></td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td className="py-3 pr-6 font-medium" style={{ color: "var(--text-primary)" }}>Muse 2 / S</td>
                <td className="py-3 pr-6" style={{ color: "var(--text-secondary)" }}>EEG</td>
                <td className="py-3 pr-6 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>delta, theta, alpha, beta, gamma</td>
                <td className="py-3"><span className="px-2 py-0.5 text-xs font-medium rounded" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>WebBluetooth + REST API</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-6 font-medium" style={{ color: "var(--text-primary)" }}>Custom / Research</td>
                <td className="py-3 pr-6" style={{ color: "var(--text-secondary)" }}>Any</td>
                <td className="py-3 pr-6 text-xs" style={{ color: "var(--text-secondary)" }}>Any field in the samples array</td>
                <td className="py-3"><span className="px-2 py-0.5 text-xs font-medium rounded" style={{ background: "var(--success-subtle)", color: "var(--success)" }}>REST API only</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate limits */}
      <div className="rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Limits &amp; Notes</h2>
        <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li>• <strong>Samples:</strong> Maximum 50,000 samples per ingestion request (~14 hours at 1 Hz)</li>
          <li>• <strong>Batch size:</strong> Samples are inserted in 1,000-row batches to avoid DB limits</li>
          <li>• <strong>Questionnaire scales:</strong> All pre/post fields must be integers 1–10; out-of-range values are silently dropped</li>
          <li>• <strong>Webhook timeout:</strong> 8 seconds; failures are silently discarded (fire-and-forget)</li>
          <li>• <strong>CORS:</strong> API is server-to-server; browser cross-origin requests are not supported</li>
        </ul>
      </div>
    </div>
  );
}
