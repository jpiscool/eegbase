import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { protocols, assignments, sessions } from "@/lib/db/schema";
import { eq, count, avg } from "drizzle-orm";
import Link from "next/link";
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
    .orderBy(protocols.createdAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Protocols</h1>
          <p className="text-sm text-gray-500">
            {protocolList.length} protocol{protocolList.length !== 1 ? "s" : ""} defined
          </p>
        </div>
        <div className="flex items-center gap-3">
          {protocolList.length > 0 && <LoadTemplatesButton />}
          <CreateProtocolModal />
        </div>
      </div>

      {protocolList.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-10 text-center">
          <p className="text-sm font-semibold text-blue-900 mb-1">No protocols yet</p>
          <p className="text-sm text-blue-600 mb-6 max-w-sm mx-auto">
            Protocols define session duration, device type, and training parameters. Create your own or start with our pre-built templates.
          </p>
          <div className="flex items-center justify-center gap-3">
            <LoadTemplatesButton />
            <CreateProtocolModal />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {protocolList.map((p) => {
            const mins = Math.round((p.durationSeconds ?? 1200) / 60);
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link href={`/protocols/${p.id}`} className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors">{p.name}</Link>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {DEVICE_LABELS[p.deviceType] ?? p.deviceType}
                    </span>
                    <span className="text-xs text-gray-400">{mins} min</span>
                    {p.assignedCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {p.assignedCount} assignment{p.assignedCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400">
                      <span className="font-medium text-gray-700">{p.sessionCount}</span>{" "}
                      session{p.sessionCount !== 1 ? "s" : ""}
                    </span>
                    {p.avgReward != null && (
                      <span className="text-xs text-gray-400">
                        avg reward{" "}
                        <span className={`font-semibold ${
                          Number(p.avgReward) >= 70 ? "text-emerald-600"
                          : Number(p.avgReward) >= 40 ? "text-amber-600"
                          : "text-red-500"
                        }`}>
                          {Number(p.avgReward).toFixed(1)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <EditProtocolModal protocol={p} />
                  <DeleteProtocolButton id={p.id} name={p.name} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
