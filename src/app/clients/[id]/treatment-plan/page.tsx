import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, protocols, treatmentPlans, sessions } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { TreatmentPlanForm } from "@/components/TreatmentPlanForm";

const OUTCOME_MEASURES = [
  { value: "adhd-rs", label: "ADHD-RS (Attention)" },
  { value: "gad7", label: "GAD-7 (Anxiety)" },
  { value: "phq9", label: "PHQ-9 (Depression)" },
  { value: "pcl5", label: "PCL-5 (PTSD)" },
  { value: "psqi", label: "PSQI (Sleep Quality)" },
  { value: "conners", label: "Conners (ADHD — parent/teacher)" },
];

export default async function TreatmentPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [[client], protocolList, [existingPlan], sessionCountRow] = await Promise.all([
    db.select({ id: clients.id, name: clients.name, notes: clients.notes, goals: clients.goals })
      .from(clients).where(and(eq(clients.id, id), eq(clients.clinicId, clinicId))).limit(1),
    db.select({ id: protocols.id, name: protocols.name })
      .from(protocols).where(eq(protocols.clinicId, clinicId)).orderBy(protocols.name),
    db.select().from(treatmentPlans)
      .where(and(eq(treatmentPlans.clientId, id), eq(treatmentPlans.status, "active")))
      .orderBy(desc(treatmentPlans.startDate)).limit(1),
    db.select({ total: count() }).from(sessions).where(eq(sessions.clientId, id)),
  ]);

  if (!client) notFound();

  const completedSessions = Number(sessionCountRow[0]?.total ?? 0);
  const progressPct = existingPlan?.targetSessionCount
    ? Math.min(100, Math.round((completedSessions / existingPlan.targetSessionCount) * 100))
    : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Treatment Plan</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{client.name}</p>
        </div>
      </div>

      {/* Active plan summary */}
      {existingPlan && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={15} style={{ color: "var(--success)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Active Plan</h2>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--success-subtle)", color: "var(--success)" }}>Active</span>
          </div>
          {existingPlan.targetSessionCount != null && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                <span>{completedSessions} of {existingPlan.targetSessionCount} sessions completed</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "var(--success)" }} />
              </div>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {existingPlan.sessionFrequency && (
              <>
                <dt style={{ color: "var(--text-tertiary)" }}>Frequency</dt>
                <dd style={{ color: "var(--text-primary)" }}>{existingPlan.sessionFrequency}</dd>
              </>
            )}
            {existingPlan.outcomeMeasures && existingPlan.outcomeMeasures.length > 0 && (
              <>
                <dt style={{ color: "var(--text-tertiary)" }}>Outcome Measures</dt>
                <dd style={{ color: "var(--text-primary)" }}>
                  {existingPlan.outcomeMeasures.map((m) => OUTCOME_MEASURES.find((o) => o.value === m)?.label ?? m).join(", ")}
                </dd>
              </>
            )}
            {existingPlan.reviewDate && (
              <>
                <dt style={{ color: "var(--text-tertiary)" }}>Review Date</dt>
                <dd style={{ color: "var(--text-primary)" }}>{new Date(existingPlan.reviewDate).toLocaleDateString()}</dd>
              </>
            )}
          </dl>
          {existingPlan.presentingConcerns && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>PRESENTING CONCERNS</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{existingPlan.presentingConcerns}</p>
            </div>
          )}
          {existingPlan.decisionRules && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>DECISION RULES</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{existingPlan.decisionRules}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit / Create form */}
      <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {existingPlan ? "Update Plan" : "Create Treatment Plan"}
        </h2>
        <TreatmentPlanForm
          clientId={id}
          protocols={protocolList}
          outcomeMeasureOptions={OUTCOME_MEASURES}
          existing={existingPlan ? {
            presentingConcerns: existingPlan.presentingConcerns ?? "",
            protocolId: existingPlan.protocolId ?? "",
            targetSessionCount: existingPlan.targetSessionCount ?? undefined,
            sessionFrequency: existingPlan.sessionFrequency ?? "",
            outcomeMeasures: existingPlan.outcomeMeasures ?? [],
            decisionRules: existingPlan.decisionRules ?? "",
            goals: existingPlan.goals ?? "",
            reviewDate: existingPlan.reviewDate ? new Date(existingPlan.reviewDate).toISOString().split("T")[0] : "",
          } : undefined}
        />
      </div>
    </div>
  );
}
