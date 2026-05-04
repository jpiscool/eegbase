import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, checkIns } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckInForm } from "@/components/CheckInForm";
import { CheckInTrendChart } from "@/components/CheckInTrendChart";
import { CheckInLinkButton } from "@/components/CheckInLinkButton";

export default async function CheckInsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) notFound();

  const checkInList = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.clientId, id))
    .orderBy(desc(checkIns.date))
    .limit(30);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/clients/${id}`}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{client.name} — Daily Check-Ins</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Lifestyle &amp; symptom tracking</p>
        </div>
      </div>

      {/* Client check-in link */}
      <div className="rounded-xl border p-4 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="mb-2">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Client Self-Check-In Link</p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Send this link to your client so they can log daily check-ins from any device — no account needed.</p>
        </div>
        <CheckInLinkButton clientId={id} initialToken={client.checkInToken ?? null} />
      </div>

      {checkInList.length > 1 && (
        <div className="rounded-xl border p-6 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Symptom Trends · Last {checkInList.length} check-ins
          </h2>
          <CheckInTrendChart
            data={[...checkInList].reverse().map((c) => ({
              date: new Date(c.date),
              mood: c.mood,
              anxiety: c.anxiety,
              focus: c.focus,
              energy: c.energy,
              sleepQuality: c.sleepQuality,
            }))}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log a check-in */}
        <div className="lg:col-span-1">
          <CheckInForm clientId={id} />
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>History · last 30 entries</h2>
            </div>
            {checkInList.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: "var(--text-tertiary)" }}>
                No check-ins logged yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
                    <tr>
                      {["Date", "Sleep h", "Sleep Q", "Mood", "Anxiety", "Focus", "Energy", "Notes"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                    {checkInList.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                          {new Date(c.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{c.sleepHours ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <ScoreBadge val={c.sleepQuality} />
                        </td>
                        <td className="px-4 py-2.5">
                          <ScoreBadge val={c.mood} />
                        </td>
                        <td className="px-4 py-2.5">
                          <ScoreBadge val={c.anxiety} invert />
                        </td>
                        <td className="px-4 py-2.5">
                          <ScoreBadge val={c.focus} />
                        </td>
                        <td className="px-4 py-2.5">
                          <ScoreBadge val={c.energy} />
                        </td>
                        <td className="px-4 py-2.5 max-w-[160px] truncate" style={{ color: "var(--text-tertiary)" }}>
                          {c.notes ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ val, invert }: { val: number | null; invert?: boolean }) {
  if (val == null) return <span style={{ color: "var(--border-default)" }}>—</span>;
  const good = invert ? val <= 4 : val >= 7;
  const bad = invert ? val >= 7 : val <= 4;
  return (
    <span
      className="font-semibold"
      style={{ color: good ? "var(--success)" : bad ? "var(--danger)" : "var(--warning)" }}
    >
      {val}
    </span>
  );
}
