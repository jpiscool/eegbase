import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FileText, Key, Zap, Database, Wifi, BookOpen } from "lucide-react";

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-xl px-5 py-4 text-[12.5px] font-mono leading-relaxed overflow-x-auto">
      {children}
    </pre>
  );
}

function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColor =
    method === "POST" ? "bg-emerald-100 text-emerald-700" :
    method === "GET"  ? "bg-blue-100 text-blue-700" :
    "bg-gray-100 text-gray-600";
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5 ${methodColor}`}>
        {method}
      </span>
      <div>
        <code className="text-sm font-mono text-gray-900">{path}</code>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default async function DocsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [clinic] = await db
    .select({ name: clinics.name })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-gray-900">
          <BookOpen size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-sm text-gray-500">REST API reference for EEGBase integrations</p>
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
          <a key={label} href={href} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
            <Icon size={15} className="text-gray-400" />
            {label}
          </a>
        ))}
      </div>

      {/* Auth section */}
      <div id="auth" className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Authentication</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          All API requests require a Bearer token. Your API key is your <strong>Clinic ID</strong> — visible in Settings → API Access.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">Your API Key</p>
          <code className="text-sm font-mono text-blue-900 break-all">{clinicId}</code>
        </div>
        <Code>{`curl -X POST https://your-eegbase.com/api/v1/sessions \\
  -H "Authorization: Bearer ${clinicId || "<YOUR_CLINIC_ID>"}" \\
  -H "Content-Type: application/json" \\
  -d '{ ... }'`}</Code>
      </div>

      {/* Endpoints overview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Available Endpoints</h2>
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
      <div id="ingest" className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Database size={16} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">POST /api/v1/sessions</h2>
          <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded">201</span>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Push completed session data into EEGBase from a server-side integration (e.g. Mendi cloud, research pipeline, custom firmware).
          Returns <code className="bg-gray-100 px-1 rounded text-xs">{"{ sessionId }"}</code>.
        </p>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Request body</p>
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
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Response</p>
          <Code>{`// 201 Created
{ "sessionId": "3f4a9b2e-..." }

// 400 Bad Request
{ "error": "clientId does not belong to this clinic" }

// 401 Unauthorized
{ "error": "Invalid or missing API key" }`}</Code>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Example (curl)</p>
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
      <div id="webhooks" className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Outbound Webhooks</h2>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Configure a webhook URL in <a href="/settings" className="text-blue-600 hover:underline">Settings</a>. EEGBase will POST a JSON payload to your URL every time a session is saved — browser or API.
        </p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payload</p>
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
        <p className="text-xs text-gray-400 mt-3">Delivery: fire-and-forget with 8s timeout. Configure and test in <a href="/settings" className="text-blue-600 hover:underline">Settings → Webhooks</a>.</p>
      </div>

      {/* Devices */}
      <div id="devices" className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={16} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Supported Devices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Device</th>
                <th className="text-left py-2 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Modality</th>
                <th className="text-left py-2 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Signals</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Integration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-3 pr-6 font-medium text-gray-900">Mendi</td>
                <td className="py-3 pr-6 text-gray-500">fNIRS</td>
                <td className="py-3 pr-6 text-gray-500 text-xs font-mono">oxyHbLeft, oxyHbRight, deoxyHbLeft, deoxyHbRight</td>
                <td className="py-3"><span className="px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 rounded">WebBluetooth + REST API</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-6 font-medium text-gray-900">Muse 2 / S</td>
                <td className="py-3 pr-6 text-gray-500">EEG</td>
                <td className="py-3 pr-6 text-gray-500 text-xs font-mono">delta, theta, alpha, beta, gamma</td>
                <td className="py-3"><span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">WebBluetooth + REST API</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-6 font-medium text-gray-900">Custom / Research</td>
                <td className="py-3 pr-6 text-gray-500">Any</td>
                <td className="py-3 pr-6 text-gray-500 text-xs">Any field in the samples array</td>
                <td className="py-3"><span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded">REST API only</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate limits */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Limits &amp; Notes</h2>
        <ul className="space-y-2 text-sm text-gray-600">
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
