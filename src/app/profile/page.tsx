import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm, PasswordForm } from "../settings/SettingsForms";

// Profile is the dedicated edit-your-own-login surface. Settings still hosts
// clinic-wide config (webhook, API key, billing); Profile is just the bits
// a clinician changes about themselves.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile · EEGBase",
  description: "Edit your login and personal info.",
  robots: { index: false, follow: false },
};

const card = "rounded-xl border p-6 mb-5";
const cardSt = { background: "var(--surface-raised)", borderColor: "var(--border-subtle)" };
const h2Cl = "text-base font-semibold mb-4";

export default async function ProfilePage() {
  const session = await auth();
  // The /profile layout already redirects unauthenticated visitors, but in
  // the App Router server pages and their layouts evaluate in parallel —
  // so we must also gate here, otherwise the empty user id below would
  // be sent to Postgres and rejected as an invalid UUID.
  if (!session?.user?.id) redirect("/login");
  const clinicianId = session.user.id;

  const [clinician] = await db
    .select({
      name: clinicians.name,
      email: clinicians.email,
      role: clinicians.role,
      createdAt: clinicians.createdAt,
    })
    .from(clinicians)
    .where(eq(clinicians.id, clinicianId))
    .limit(1);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Profile</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        Update your login email, display name, and password.
      </p>

      {/* Account summary */}
      <div className={card} style={cardSt}>
        <h2 className={h2Cl} style={{ color: "var(--text-primary)" }}>Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>Role</p>
            <p className="capitalize" style={{ color: "var(--text-primary)" }}>{clinician?.role ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-tertiary)" }}>Joined</p>
            <p style={{ color: "var(--text-primary)" }}>
              {clinician?.createdAt ? new Date(clinician.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Profile (name + email) */}
      <div className={card} style={cardSt}>
        <h2 className={h2Cl} style={{ color: "var(--text-primary)" }}>Login & Identity</h2>
        <ProfileForm
          name={clinician?.name ?? ""}
          email={clinician?.email ?? ""}
          editableEmail
        />
      </div>

      {/* Password */}
      <div className={card} style={cardSt}>
        <h2 className={h2Cl} style={{ color: "var(--text-primary)" }}>Change Password</h2>
        <PasswordForm />
      </div>
    </div>
  );
}
