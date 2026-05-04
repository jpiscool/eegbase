import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians, clinics } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Users } from "lucide-react";
import { ProfileForm, PasswordForm, ClinicNameForm, WebhookForm, ApiKeyDisplay } from "./SettingsForms";

const card = "rounded-xl border p-6 mb-5";
const cardSt = { background: "var(--surface-raised)", borderColor: "var(--border-subtle)" };
const h2Cl = "text-base font-semibold mb-4";

export default async function SettingsPage() {
  const session = await auth();
  const clinicianId = session?.user?.id ?? "";
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [clinician] = await db
    .select({ name: clinicians.name, email: clinicians.email, role: clinicians.role, createdAt: clinicians.createdAt })
    .from(clinicians)
    .where(eq(clinicians.id, clinicianId))
    .limit(1);

  const [clinic] = await db
    .select({ name: clinics.name, webhookUrl: clinics.webhookUrl, createdAt: clinics.createdAt })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  const [teamCountRow] = await db
    .select({ count: count() })
    .from(clinicians)
    .where(eq(clinicians.clinicId, clinicId));

  const teamCount = Number(teamCountRow?.count ?? 0);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Settings</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>Manage your profile and account security.</p>

      {/* Clinic info */}
      <div className={card} style={cardSt}>
        <h2 className={h2Cl} style={{ color: "var(--text-primary)" }}>Clinic</h2>
        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
          {[
            { label: "Your Role", value: <span className="font-medium capitalize">{clinician?.role ?? "—"}</span> },
            { label: "Account Created", value: clinician?.createdAt ? new Date(clinician.createdAt).toLocaleDateString() : "—" },
            { label: "Clinic ID", value: <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{clinicId}</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</p>
              <p style={{ color: "var(--text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-5" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>Clinic Name</p>
          <ClinicNameForm currentName={clinic?.name ?? ""} />
        </div>
      </div>

      {/* Profile */}
      <div className={card} style={cardSt}>
        <h2 className={h2Cl} style={{ color: "var(--text-primary)" }}>Profile</h2>
        <ProfileForm name={clinician?.name ?? ""} email={clinician?.email ?? ""} />
      </div>

      {/* Password */}
      <div className={card} style={cardSt}>
        <h2 className={h2Cl} style={{ color: "var(--text-primary)" }}>Change Password</h2>
        <PasswordForm />
      </div>

      {/* Team */}
      <div className={card} style={cardSt}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Team</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {teamCount} member{teamCount !== 1 ? "s" : ""} in this clinic
            </p>
          </div>
          <Link
            href="/settings/team"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
          >
            <Users size={15} />
            Manage Team
          </Link>
        </div>
      </div>

      {/* Device Integrations */}
      <div className={card} style={cardSt}>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Device Integrations</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>Supported neurofeedback hardware</p>
        <div className="space-y-3">
          {[
            { name: "Mendi", description: "fNIRS prefrontal cortex monitor (oxyHb / deoxyHb)", note: "WebBluetooth live session + REST ingestion API" },
            { name: "Muse EEG", description: "Multi-channel EEG headband (TP9, AF7, AF8, TP10) — delta/theta/alpha/beta/gamma", note: "WebBluetooth live session — Muse 2 and Muse S supported" },
            { name: "Simulator", description: "Built-in signal simulator for development and demos", note: "Always available — noise level and trend strength configurable per protocol" },
          ].map(({ name, description, note }) => (
            <div key={name} className="flex items-start gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{name}</p>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: "var(--success-subtle)", color: "var(--success)" }}>
                    Active
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{description}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Access */}
      <div className={card} style={cardSt}>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>API Access</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          Use the REST API to ingest session data from external systems (e.g. Mendi cloud, research pipelines).
        </p>
        <ApiKeyDisplay clinicId={clinicId} />
        <div className="text-xs space-y-1.5" style={{ color: "var(--text-secondary)" }}>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Ingestion endpoint:</p>
          <p className="font-mono rounded px-3 py-2 border" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>POST /api/v1/sessions</p>
          <p style={{ color: "var(--text-tertiary)" }}>
            Accepts completed session JSON with{" "}
            <code className="rounded px-1" style={{ background: "var(--surface-sunken)" }}>samples</code>,{" "}
            <code className="rounded px-1" style={{ background: "var(--surface-sunken)" }}>preSession</code>, and{" "}
            <code className="rounded px-1" style={{ background: "var(--surface-sunken)" }}>postSession</code>{" "}
            questionnaire data. Returns{" "}
            <code className="rounded px-1" style={{ background: "var(--surface-sunken)" }}>{"{ sessionId }"}</code>.
          </p>
        </div>
      </div>

      {/* Webhooks */}
      <div className={card} style={cardSt}>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Webhooks</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          EEGBase will POST a JSON payload to this URL every time a session is saved. Useful for syncing with external systems, Zapier, or Mendi cloud.
        </p>
        <WebhookForm currentUrl={clinic?.webhookUrl ?? null} />
        <div className="mt-4 text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Payload shape:</p>
          <pre className="rounded p-3 font-mono text-[11px] overflow-x-auto border" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>{`{
  "event": "session.saved",
  "sessionId": "uuid",
  "clientName": "Sarah Mitchell",
  "clinicianName": "Dr. Jordan Lee",
  "deviceType": "mendi",
  "startedAt": "2026-05-11T09:00:00Z",
  "durationSeconds": 1200,
  "avgRewardScore": 68.4,
  "sampleCount": 1200,
  "preSession": { "focus": 5, "mood": 6, "anxiety": 4, "energy": 6 },
  "postSession": { "focus": 8, "mood": 7, "anxiety": 3, "energy": 7 },
  "timestamp": "2026-05-11T09:21:04Z"
}`}</pre>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Subscription</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Current plan and usage</p>
          </div>
          <span className="px-3 py-1 text-sm font-semibold rounded-full" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
            Pro Plan
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            { label: "Clients", current: "—", limit: "Unlimited" },
            { label: "Sessions / month", current: "—", limit: "Unlimited" },
            { label: "Storage", current: "—", limit: "10 GB" },
          ].map(({ label, current, limit }) => (
            <div key={label} className="rounded-lg p-3 border" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{current}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>of {limit}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Next billing date</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Billing managed by your admin</p>
          </div>
          <button
            disabled
            className="px-4 py-2 text-sm border rounded-lg cursor-not-allowed"
            style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
          >
            Manage Billing
          </button>
        </div>
      </div>
    </div>
  );
}
