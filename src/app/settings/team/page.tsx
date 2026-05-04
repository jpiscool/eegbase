import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians, clients, sessions } from "@/lib/db/schema";
import { eq, count, gte, and } from "drizzle-orm";
import { ArrowLeft, ShieldCheck, User, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";
import { RoleChangeBtn } from "@/components/RoleChangeBtn";

export default async function TeamPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  const currentUserId = session?.user?.id ?? "";
  const currentUserRole = (session?.user as { role?: string })?.role ?? "clinician";
  const isAdmin = currentUserRole === "admin";

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [teamRows, weekSessions] = await Promise.all([
    db
      .select({
        id: clinicians.id,
        name: clinicians.name,
        email: clinicians.email,
        role: clinicians.role,
        createdAt: clinicians.createdAt,
        clientCount: count(clients.id),
      })
      .from(clinicians)
      .leftJoin(clients, eq(clients.clinicianId, clinicians.id))
      .where(eq(clinicians.clinicId, clinicId))
      .groupBy(clinicians.id)
      .orderBy(clinicians.createdAt),
    db
      .select({
        clinicianId: clients.clinicianId,
        avgRewardScore: sessions.avgRewardScore,
      })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(gte(sessions.startedAt, oneWeekAgo)),
  ]);

  const statsByClinicianId = new Map<string, { count: number; rewardSum: number; rewardCount: number }>();
  for (const s of weekSessions) {
    const cid = s.clinicianId;
    const existing = statsByClinicianId.get(cid) ?? { count: 0, rewardSum: 0, rewardCount: 0 };
    existing.count += 1;
    if (s.avgRewardScore != null) {
      existing.rewardSum += s.avgRewardScore;
      existing.rewardCount += 1;
    }
    statsByClinicianId.set(cid, existing);
  }

  const totalSessionsThisWeek = weekSessions.length;

  function rewardStyle(v: number): React.CSSProperties {
    if (v >= 70) return { color: "var(--success)" };
    if (v >= 40) return { color: "var(--warning)" };
    return { color: "var(--danger)" };
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Team</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {teamRows.length} member{teamRows.length !== 1 ? "s" : ""} · {totalSessionsThisWeek} session{totalSessionsThisWeek !== 1 ? "s" : ""} this week
          </p>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-6">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Clinic Members</p>
            <p className="text-xs font-medium text-right" style={{ color: "var(--text-tertiary)" }}>Clients</p>
            <p className="text-xs font-medium text-right" style={{ color: "var(--text-tertiary)" }}>Sessions (7d)</p>
            <p className="text-xs font-medium text-right" style={{ color: "var(--text-tertiary)" }}>Avg Reward</p>
          </div>
        </div>
        <ul className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {teamRows.map((member) => {
            const stats = statsByClinicianId.get(member.id);
            const sessionsThisWeek = stats?.count ?? 0;
            const avgReward = stats && stats.rewardCount > 0
              ? stats.rewardSum / stats.rewardCount
              : null;
            return (
              <li
                key={member.id}
                className="px-6 py-4 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={member.role === "admin"
                    ? { background: "color-mix(in srgb, var(--brand) 12%, transparent)", color: "var(--brand)" }
                    : { background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}
                >
                  {member.role === "admin" ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {member.name}
                    </span>
                    {member.id === currentUserId && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
                        You
                      </span>
                    )}
                    <span
                      className="text-xs px-1.5 py-0.5 rounded capitalize font-medium"
                      style={member.role === "admin"
                        ? { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }
                        : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
                    >
                      {member.role}
                    </span>
                    {isAdmin && member.id !== currentUserId && (
                      <RoleChangeBtn memberId={member.id} currentRole={member.role} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>{member.email}</p>
                </div>
                {/* Clients */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {member.clientCount}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>client{member.clientCount !== 1 ? "s" : ""}</p>
                </div>
                {/* Sessions this week */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold flex items-center justify-end gap-1" style={{ color: sessionsThisWeek > 0 ? "var(--brand)" : "var(--text-tertiary)" }}>
                    {sessionsThisWeek > 0 && <Activity size={12} />}
                    {sessionsThisWeek}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>this week</p>
                </div>
                {/* Avg reward */}
                <div className="text-right shrink-0 w-20">
                  {avgReward != null ? (
                    <>
                      <p className="text-sm font-semibold flex items-center justify-end gap-1" style={rewardStyle(avgReward)}>
                        <TrendingUp size={12} />
                        {avgReward.toFixed(1)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>avg reward</p>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--border-default)" }}>—</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border p-5 text-center" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Invite a team member</p>
        <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
          Send the registration link to a colleague — they&apos;ll join this clinic automatically.
        </p>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono select-all" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
          {`${process.env.NEXTAUTH_URL ?? "https://app.eegbase.io"}/register`}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
          Self-registration is disabled by default — contact your admin to enable it.
        </p>
      </div>
    </div>
  );
}
