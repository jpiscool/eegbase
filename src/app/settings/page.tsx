import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians, clinics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
        <PasswordForm />
      </div>
    </div>
  );
}
