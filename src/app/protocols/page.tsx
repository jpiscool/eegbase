import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { protocols, assignments, sessions } from "@/lib/db/schema";
import { eq, count, avg, desc } from "drizzle-orm";
import Link from "next/link";
import { Clock, Users, Activity, Star, Trophy } from "lucide-react";
import { CreateProtocolModal } from "@/components/CreateProtocolModal";
import { DeleteProtocolButton } from "@/components/DeleteProtocolButton";
import { EditProtocolModal } from "@/components/EditProtocolModal";
import { LoadTemplatesButton } from "@/components/LoadTemplatesButton";

const DEVICE_LABELS: Record<string, string> = {
  mendi: "Mendi",
  muse: "Muse",
  simulator: "Simulator",
};

export default async function ProtocolsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const protocolList = await db
    .select({
      id: protocols.id,
      name: protocols.name,
      description: protocols.description,
      deviceType: protocols.deviceType,
      durationSeconds: protocols.durationSeconds,
      createdAt: protocols.createdAt,
      assignedCount: count(assignments.id),
      sessionCount: count(sessions.id),
      avgReward: avg(sessions.avgRewardScore),
    })
    .from(protocols)
    .leftJoin(assignments, eq(assignments.protocolId, protocols.id))
    .leftJoin(sessions, eq(sessions.protocolId, protocols.id))
    .where(eq(protocols.clinicId, clinicId))
    .groupBy(protocols.id)
    .orderBy(desc(avg(sessions.avgRewardScore)));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Protocols</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {protocolList.length} protocol{protocolList.length !== 1 ? "s" : ""} defined
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/protocols/templates"
            className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
          >
            Browse Templates
          </Link>
          {protocolList.length > 0 && <LoadTemplatesButton />}
          <CreateProtocolModal />
        </div>
      </div>

      {protocolList.length === 0 ? (
        <div
          className="rounded-xl border p-10 text-center"
          style={{ background: "linear-gradient(135deg, var(--brand-subtle) 0%, var(--surface-raised) 100%)", borderColor: "var(--brand-muted)" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--brand)" }}>No protocols yet</p>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
            Protocols define session duration, device type, and training parameters. Create your own or start with our pre-built templates.
          </p>
          <div className="flex items-center justify-center gap-3">
            <LoadTemplatesButton />
            <CreateProtocolModal />
          </div>
        </div>
      ) : (() => {
        // Find the best-performing protocol (by avg reward, with min 2 sessions)
        const bestProtocol = protocolList
          .filter((p) => Number(p.sessionCount) >= 2 && p.avgReward != null)
          .reduce<typeof protocolList[number] | null>((best, p) =>
            best == null || Number(p.avgReward) > Number(best.avgReward) ? p : best, null
          );

        return (
          <div className="grid gap-4">
            {protocolList.map((p) => {
              const mins = Math.round((p.durationSeconds ?? 1200) / 60);
              const avgReward = p.avgReward != null ? Number(p.avgReward) : null;
              const rewardColor = avgReward == null ? "var(--text-tertiary)"
                : avgReward >= 70 ? "var(--success)"
                : avgReward >= 40 ? "var(--warning)"
                : "var(--danger)";
              const rewardBg = avgReward == null ? "var(--surface-sunken)"
                : avgReward >= 70 ? "var(--success-subtle)"
                : avgReward >= 40 ? "var(--warning-subtle)"
                : "var(--danger-subtle)";
              const isTopPerformer = bestProtocol?.id === p.id;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border flex items-start gap-5 px-6 py-5 transition-colors"
                  style={{
                    background: "var(--surface-raised)",
                    borderColor: isTopPerformer ? "var(--brand)" : "var(--border-subtle)",
                    boxShadow: isTopPerformer ? "0 0 0 1px var(--brand)" : "var(--shadow-card)",
                  }}
                >
                  {/* Left: icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
                  >
                    <Activity size={18} />
                  </div>

                  {/* Middle: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        href={`/protocols/${p.id}`}
                        className="font-semibold text-sm transition-colors"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {p.name}
                      </Link>
                      {isTopPerformer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "#fef3c7", color: "#d97706" }}>
                          <Star size={9} style={{ fill: "#d97706" }} /> Top Performer
                        </span>
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
                      >
                        {DEVICE_LABELS[p.deviceType] ?? p.deviceType}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-sm mt-0.5 mb-2" style={{ color: "var(--text-tertiary)" }}>{p.description}</p>
                    )}
                    {/* Stats row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        <Clock size={11} />{mins} min
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        <Activity size={11} />
                        <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{p.sessionCount}</span>
                        &nbsp;session{Number(p.sessionCount) !== 1 ? "s" : ""}
                      </span>
                      {Number(p.assignedCount) > 0 && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                          <Users size={11} />
                          <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{p.assignedCount}</span>
                          &nbsp;assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: avg reward score + actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {avgReward != null && (
                      <div className="text-center">
                        <div
                          className="text-lg font-bold tabular-nums px-3 py-1 rounded-lg"
                          style={{ background: rewardBg, color: rewardColor }}
                        >
                          {avgReward.toFixed(1)}
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>avg reward</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <EditProtocolModal protocol={p} />
                      <DeleteProtocolButton id={p.id} name={p.name} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
