import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, checkIns } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckInForm } from "@/components/CheckInForm";

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
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{client.name} — Daily Check-Ins</h1>
          <p className="text-sm text-gray-500">Lifestyle & symptom tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log a check-in */}
        <div className="lg:col-span-1">
          <CheckInForm clientId={id} />
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">History · last 30 entries</h2>
            </div>
            {checkInList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                No check-ins logged yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Date", "Sleep h", "Sleep Q", "Mood", "Anxiety", "Focus", "Energy", "Notes"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {checkInList.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                          {new Date(c.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{c.sleepHours ?? "—"}</td>
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
                        <td className="px-4 py-2.5 text-gray-400 max-w-[160px] truncate">
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
  if (val == null) return <span className="text-gray-300">—</span>;
  const good = invert ? val <= 4 : val >= 7;
  const bad = invert ? val >= 7 : val <= 4;
  return (
    <span
      className={`font-semibold ${
        good ? "text-emerald-600" : bad ? "text-red-500" : "text-amber-600"
      }`}
    >
      {val}
    </span>
  );
}
