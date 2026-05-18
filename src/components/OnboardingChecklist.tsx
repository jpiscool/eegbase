import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Target, UserPlus, Play, CheckCircle2, Circle } from "lucide-react";

// First-run guided checklist for fresh clinics. Renders nothing once
// every step is satisfied so it auto-dismisses as the clinician sets
// up their workspace.
//
// Steps (in order):
//   1. Protocols exist (seeded automatically — should always be ≥ 1
//      after `scripts/seed.ts` runs).
//   2. At least one client created.
//   3. At least one session recorded.
//
// Server component — counts are computed inline against the clinic's
// scoped tables. No client state.

export async function OnboardingChecklist() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId;
  if (!clinicId) return null;

  const [[protocolRow], [clientRow], [sessionRow]] = await Promise.all([
    db.select({ n: count() }).from(protocols).where(eq(protocols.clinicId, clinicId)),
    db.select({ n: count() }).from(clients).where(eq(clients.clinicId, clinicId)),
    db
      .select({ n: count() })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId)),
  ]);

  const hasProtocols = (protocolRow?.n ?? 0) > 0;
  const hasClients = (clientRow?.n ?? 0) > 0;
  const hasSessions = (sessionRow?.n ?? 0) > 0;

  // Once all three are done the checklist auto-dismisses.
  if (hasProtocols && hasClients && hasSessions) return null;

  const steps = [
    {
      done: hasProtocols,
      icon: Target,
      title: "Browse protocols",
      body: "Your library is pre-seeded with 6 starter protocols (Mendi + Muse). Open one to review or tune parameters.",
      cta: "Browse protocols →",
      href: "/protocols",
    },
    {
      done: hasClients,
      icon: UserPlus,
      title: "Add your first client",
      body: "Create a client chart to record sessions against. Just a name is required — everything else is optional.",
      cta: "Add client →",
      href: "/clients",
    },
    {
      done: hasSessions,
      icon: Play,
      title: "Record your first session",
      body: "Open the live recording surface, pick a client and protocol, and start training. The session saves automatically.",
      cta: "Start session →",
      href: "/sessions/live",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(96,165,250,0.06), rgba(167,139,250,0.06))",
      border: "1px solid rgba(96,165,250,0.25)",
      borderRadius: 14, padding: "16px 20px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>
            Get started with EEGBase
          </h3>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>
            {completedCount}/3 steps complete — finish setup to record your first session.
          </p>
        </div>
        <div style={{
          display: "flex", gap: 4, padding: "3px 10px",
          background: "rgba(96,165,250,0.10)", borderRadius: 99,
        }}>
          {steps.map((s, i) => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: s.done ? "#34D399" : "#475569",
            }} />
          ))}
        </div>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}>
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={i}
              href={s.href}
              style={{
                display: "flex", flexDirection: "column", gap: 6,
                background: s.done ? "rgba(52,211,153,0.05)" : "#020617",
                border: `1px solid ${s.done ? "rgba(52,211,153,0.25)" : "#1E293B"}`,
                borderRadius: 10, padding: "12px 14px",
                textDecoration: "none", color: "#CBD5E1",
                opacity: s.done ? 0.7 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {s.done
                  ? <CheckCircle2 size={14} color="#34D399" />
                  : <Circle size={14} color="#64748B" />}
                <Icon size={13} color={s.done ? "#34D399" : "#94A3B8"} />
                <strong style={{ fontSize: 12, color: "#F1F5F9" }}>{s.title}</strong>
              </div>
              <p style={{ fontSize: 11, lineHeight: 1.45, color: "#94A3B8", margin: 0 }}>
                {s.body}
              </p>
              {!s.done && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#60A5FA", marginTop: 2 }}>
                  {s.cta}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
