import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians, clinics } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Users } from "lucide-react";
import { ProfileForm, PasswordForm, ClinicNameForm } from "./SettingsForms";

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
    .select({ name: clinics.name, createdAt: clinics.createdAt })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  const [teamCountRow] = await db
    .select({ count: count() })
    .from(clinicians)
    .where(eq(clinicians.clinicId, clinicId));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your profile and account security.</p>

      {/* Clinic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Clinic</h2>
        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Your Role</p>
            <p className="text-gray-900 font-medium capitalize">{clinician?.role ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Account Created</p>
            <p className="text-gray-900">
              {clinician?.createdAt ? new Date(clinician.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Clinic ID</p>
            <p className="text-gray-400 font-mono text-xs truncate">{clinicId}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Clinic Name</p>
          <ClinicNameForm currentName={clinic?.name ?? ""} />
        </div>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
        <ProfileForm name={clinician?.name ?? ""} email={clinician?.email ?? ""} />
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
        <PasswordForm />
      </div>

      {/* Team */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Team</h2>
            <p className="text-sm text-gray-500">
              {Number(teamCountRow?.count ?? 0)} member{Number(teamCountRow?.count ?? 0) !== 1 ? "s" : ""} in this clinic
            </p>
          </div>
          <Link
            href="/settings/team"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users size={15} />
            Manage Team
          </Link>
        </div>
      </div>

      {/* Device Integrations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Device Integrations</h2>
        <p className="text-sm text-gray-400 mb-4">Supported neurofeedback hardware</p>
        <div className="space-y-3">
          {[
            {
              name: "Mendi",
              description: "fNIRS prefrontal cortex monitor (oxyHb / deoxyHb)",
              status: "ready",
              note: "Native integration — pending API key configuration",
            },
            {
              name: "Simulator",
              description: "Built-in signal simulator for development and demos",
              status: "active",
              note: "Always available",
            },
          ].map(({ name, description, status, note }) => (
            <div key={name} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {status === "active" ? "Active" : "Coming Soon"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Subscription</h2>
            <p className="text-sm text-gray-500">Current plan and usage</p>
          </div>
          <span className="px-3 py-1 text-sm font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
            Pro Plan
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            { label: "Clients", current: "—", limit: "Unlimited" },
            { label: "Sessions / month", current: "—", limit: "Unlimited" },
            { label: "Storage", current: "—", limit: "10 GB" },
          ].map(({ label, current, limit }) => (
            <div key={label} className="border border-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-gray-900">{current}</p>
              <p className="text-xs text-gray-400">of {limit}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Next billing date</p>
            <p className="text-sm font-medium text-gray-700">Billing managed by your admin</p>
          </div>
          <button
            disabled
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
          >
            Manage Billing
          </button>
        </div>
      </div>
    </div>
  );
}
