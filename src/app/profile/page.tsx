import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm, PasswordForm } from "../settings/SettingsForms";

// Profile is the dedicated edit-your-own-login surface. Settings still hosts
// clinic-wide config (webhook, API key, billing); Profile is just the bits
// a clinician changes about themselves.
//
// Styled to match the strip-mode dashboard's dark aesthetic — same slate
// surfaces, no marketing chrome, just the editable bits and a back link.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile · EEGBase",
  description: "Edit your login and personal info.",
  robots: { index: false, follow: false },
};

const cardStyle: React.CSSProperties = {
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
};

const headingStyle: React.CSSProperties = {
  color: "#F1F5F9",
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 16,
  letterSpacing: 0.2,
};

const labelStyle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  color: "#F1F5F9",
  fontSize: 14,
};

export default async function ProfilePage() {
  const session = await auth();
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
    <div className="profile-dark" style={{ minHeight: "100vh", background: "#020617", padding: "32px 24px" }}>
      {/* Override the shared form inputs (which use CSS vars defaulting to
          light) so they read correctly on this strip-mode dark surface. */}
      <style>{`
        .profile-dark input {
          background: #0B1220 !important;
          border-color: #1E293B !important;
          color: #F1F5F9 !important;
        }
        .profile-dark input:focus {
          outline: 2px solid #2563EB;
          outline-offset: 1px;
        }
        .profile-dark label {
          color: #CBD5E1 !important;
        }
        .profile-dark button[type="submit"] {
          background: #2563EB !important;
          color: white !important;
        }
        .profile-dark p {
          color: #94A3B8;
        }
      `}</style>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Back link + heading */}
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#60A5FA",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: 16,
          }}
        >
          ← Back to dashboard
        </Link>
        <h1 style={{ color: "#F1F5F9", fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Profile</h1>
        <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 28 }}>
          Update your login email, display name, and password.
        </p>

        {/* Account summary */}
        <div style={cardStyle}>
          <h2 style={headingStyle}>Account</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={labelStyle}>Role</p>
              <p style={{ ...valueStyle, textTransform: "capitalize" }}>{clinician?.role ?? "—"}</p>
            </div>
            <div>
              <p style={labelStyle}>Joined</p>
              <p style={valueStyle}>
                {clinician?.createdAt ? new Date(clinician.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Login & identity (name + email) */}
        <div style={cardStyle}>
          <h2 style={headingStyle}>Login & Identity</h2>
          <ProfileForm
            name={clinician?.name ?? ""}
            email={clinician?.email ?? ""}
            editableEmail
          />
        </div>

        {/* Password */}
        <div style={cardStyle}>
          <h2 style={headingStyle}>Change Password</h2>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
