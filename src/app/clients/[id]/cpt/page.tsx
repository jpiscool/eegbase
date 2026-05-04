import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, cptResults } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CPTTest } from "@/components/CPTTest";
import Link from "next/link";
import { ArrowLeft, Brain, AlertTriangle, CheckCircle2, Info } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Omission rate = misses / targetCount × 100 */
function omissionRate(misses: number, targetCount: number): number {
  if (targetCount === 0) return 0;
  return (misses / targetCount) * 100;
}

/** Commission rate = falseAlarms / non-targets × 100 */
function commissionRate(falseAlarms: number, totalStimuli: number, targetCount: number): number {
  const nonTargets = totalStimuli - targetCount;
  if (nonTargets <= 0) return 0;
  return (falseAlarms / nonTargets) * 100;
}

type PerformanceLabel = "Excellent" | "Good" | "Average" | "Below Average";

function performanceLabel(
  omission: number,
  commission: number,
  accuracy: number
): PerformanceLabel {
  const attentionConcern = omission > 15;
  const impulsivityConcern = commission > 10;
  if (!attentionConcern && !impulsivityConcern && accuracy >= 85) return "Excellent";
  if (!attentionConcern && !impulsivityConcern) return "Good";
  if (attentionConcern && impulsivityConcern) return "Below Average";
  return "Average";
}

const LABEL_STYLE: Record<
  PerformanceLabel,
  { background: string; color: string }
> = {
  Excellent: { background: "var(--success-subtle)", color: "var(--success)" },
  Good: { background: "color-mix(in srgb, #3B82F6 12%, transparent)", color: "#2563EB" },
  Average: { background: "var(--warning-subtle)", color: "var(--warning)" },
  "Below Average": { background: "var(--danger-subtle)", color: "var(--danger)" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [client] = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) notFound();

  const results = await db
    .select()
    .from(cptResults)
    .where(eq(cptResults.clientId, id))
    .orderBy(desc(cptResults.administeredAt));

  const hasResults = results.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href={`/clients/${id}`} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            CPT Assessment
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {client.name}
          </p>
        </div>
      </div>

      {/* ── Test component ── */}
      <CPTTest clientId={id} />

      {/* ── Score Interpretation Card ── */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} style={{ color: "var(--brand)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Score Interpretation
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            {
              metric: "Hits",
              description:
                "Correct responses to target stimuli. Higher is better — reflects sustained attention.",
            },
            {
              metric: "Misses (Omissions)",
              description:
                "Targets that were not responded to. Omission rate > 15% suggests an attention concern.",
            },
            {
              metric: "False Alarms (Commissions)",
              description:
                "Responses to non-target stimuli. Commission rate > 10% is associated with impulsivity.",
            },
            {
              metric: "Reaction Time",
              description:
                "Average time (ms) from stimulus to correct response. Slower times can indicate processing speed issues.",
            },
          ].map(({ metric, description }) => (
            <div
              key={metric}
              className="rounded-lg p-3"
              style={{
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {metric}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Clinical threshold callouts */}
        <div className="mt-4 space-y-2">
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
            style={{
              background: "var(--warning-subtle)",
              border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
            }}
          >
            <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
            <span style={{ color: "var(--warning)" }}>
              <strong>Attention concern:</strong> Omission errors &gt; 15% of targets
            </span>
          </div>
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
            style={{
              background: "var(--danger-subtle)",
              border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
            }}
          >
            <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
            <span style={{ color: "var(--danger)" }}>
              <strong>Impulsivity concern:</strong> Commission errors &gt; 10% of non-target stimuli
            </span>
          </div>
        </div>
      </div>

      {/* ── Results History ── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div
          className="px-5 py-4 flex items-center gap-2 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <Brain size={16} style={{ color: "var(--brand)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Results History
          </h2>
          {hasResults && (
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}
            >
              {results.length} test{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!hasResults ? (
          /* ── Empty state ── */
          <div className="px-6 py-12 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--surface-sunken)" }}
            >
              <Brain size={22} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              No CPT results yet
            </p>
            <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Run the 3-minute test above to establish a cognitive baseline for{" "}
              {client.name}.
            </p>
          </div>
        ) : (
          /* ── Results table ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                style={{
                  background: "var(--surface-sunken)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <tr>
                  {[
                    "Date",
                    "Score (H / M / FA)",
                    "Reaction Time",
                    "Omission %",
                    "Commission %",
                    "Performance",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium text-xs whitespace-nowrap"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const omission = omissionRate(r.misses, r.targetCount);
                  const commission = commissionRate(
                    r.falseAlarms,
                    r.totalStimuli,
                    r.targetCount
                  );
                  const label = performanceLabel(omission, commission, r.accuracy * 100);
                  const labelSt = LABEL_STYLE[label];
                  const attentionFlag = omission > 15;
                  const impulsivityFlag = commission > 10;

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom:
                          i < results.length - 1
                            ? "1px solid var(--border-subtle)"
                            : "none",
                      }}
                    >
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                        {new Date(r.administeredAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Score hits/misses/false alarms */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                        <span style={{ color: "var(--success)" }}>{r.hits}</span>
                        <span style={{ color: "var(--text-tertiary)" }}> / </span>
                        <span style={{ color: "var(--warning)" }}>{r.misses}</span>
                        <span style={{ color: "var(--text-tertiary)" }}> / </span>
                        <span style={{ color: "var(--danger)" }}>{r.falseAlarms}</span>
                      </td>

                      {/* Reaction time */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-secondary)" }}>
                        {r.avgReactionTimeMs != null
                          ? `${r.avgReactionTimeMs} ms`
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>

                      {/* Omission % */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium"
                          style={{
                            color: attentionFlag ? "var(--danger)" : "var(--text-secondary)",
                          }}
                        >
                          {attentionFlag && <AlertTriangle size={11} />}
                          {omission.toFixed(1)}%
                        </span>
                      </td>

                      {/* Commission % */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium"
                          style={{
                            color: impulsivityFlag ? "var(--danger)" : "var(--text-secondary)",
                          }}
                        >
                          {impulsivityFlag && <AlertTriangle size={11} />}
                          {commission.toFixed(1)}%
                        </span>
                      </td>

                      {/* Performance label */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={labelSt}
                        >
                          {label === "Excellent" && <CheckCircle2 size={11} />}
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
