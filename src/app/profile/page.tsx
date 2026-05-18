import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm, PasswordForm } from "../settings/SettingsForms";
import { signOutAction } from "../auth-actions";

// Profile is the dedicated edit-your-own-login surface. The page is wrapped
// in the global Sidebar shell via profile/layout.tsx, so we render only the
// content column here — no in-page sidebar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile · EEGBase",
  description: "Edit your login and personal info.",
  robots: { index: false, follow: false },
};

const cardStyle: React.CSSProperties = {
  background: "#111A1F",
  border: "1px solid #1F2A30",
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
    <div className="profile-page" style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Scoped input styling so the form inputs read on the dark cards. */}
      <style>{`
        .profile-page input { background: #07090B !important; border-color: #1F2A30 !important; color: #F1F5F9 !important; }
        .profile-page input:focus { outline: 2px solid #2DD4BF !important; outline-offset: 1px !important; }
        .profile-page input[readonly] { color: #64748B !important; }
        .profile-page label { color: #CBD5E1 !important; }
        .profile-page button[type="submit"] { background: #0F766E !important; color: white !important; }
        .profile-page button[type="submit"]:hover { background: #0D6A60 !important; }
      `}</style>

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

      <div style={cardStyle}>
        <h2 style={headingStyle}>Login & Identity</h2>
        <ProfileForm
          name={clinician?.name ?? ""}
          email={clinician?.email ?? ""}
          editableEmail
        />
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>Change Password</h2>
        <PasswordForm />
      </div>

      {/* Sign-out card — POSTs to the signOutAction server action,
          which clears the NextAuth cookie and redirects to /login. */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>Sign out</h2>
        <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.5, marginBottom: 16, marginTop: 0 }}>
          Signed in as <strong style={{ color: "#F1F5F9" }}>{clinician?.email ?? "—"}</strong>.
          Signing out will end this session and return you to the login screen.
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              background: "rgba(248,113,113,0.12)",
              color: "#F87171",
              border: "1px solid rgba(248,113,113,0.35)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
