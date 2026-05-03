import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians, clients } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { ArrowLeft, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

export default async function TeamPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  const currentUserId = session?.user?.id ?? "";

  const teamRows = await db
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
    .orderBy(clinicians.createdAt);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500">
            {teamRows.length} member{teamRows.length !== 1 ? "s" : ""} in this clinic
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Clinic Members</h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {teamRows.map((member) => (
            <li
              key={member.id}
              className="px-6 py-4 flex items-center gap-4"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  member.role === "admin" ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                {member.role === "admin" ? (
                  <ShieldCheck size={16} className="text-blue-600" />
                ) : (
                  <User size={16} className="text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </span>
                  {member.id === currentUserId && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                      You
                    </span>
                  )}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${
                      member.role === "admin"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{member.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500 font-medium">
                  {member.clientCount} client{member.clientCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <p className="text-sm font-medium text-gray-700 mb-1">Invite a team member</p>
        <p className="text-xs text-gray-400 mb-4">
          Send the registration link to a colleague — they'll join this clinic automatically.
        </p>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono select-all">
          {`${process.env.NEXTAUTH_URL ?? "https://app.eegbase.io"}/register`}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Self-registration is disabled by default — contact your admin to enable it.
        </p>
      </div>
    </div>
  );
}
