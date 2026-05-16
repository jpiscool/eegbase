import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm, PasswordForm } from "../settings/SettingsForms";

// Profile is the dedicated edit-your-own-login surface. Wrapped in a mini
// dark slate sidebar that matches DemoClient's strip-mode sidebar so the
// authenticated nav looks the same on every page (My Dashboard / Profile).
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

// Inline SVG matching the lucide LayoutDashboard / UserCircle so we don't
// pull in lucide-react for a single use here.
function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

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
    <div className="profile-page" style={{ display: "flex", alignItems: "flex-start", background: "#F0F4F8", minHeight: "100vh" }}>
      {/* Scoped input styling so the form inputs read on the dark cards. */}
      <style>{`
        .profile-page input { background: #0B1220 !important; border-color: #1E293B !important; color: #F1F5F9 !important; }
        .profile-page input:focus { outline: 2px solid #60A5FA !important; outline-offset: 1px !important; }
        .profile-page input[readonly] { color: #64748B !important; }
        .profile-page label { color: #CBD5E1 !important; }
        .profile-page button[type="submit"] { background: #2563EB !important; color: white !important; }
      `}</style>

      {/* Mini sidebar — same look as DemoClient strip sidebar. */}
      <nav
        aria-label="Sections"
        style={{
          width: 216,
          background: "#0F172A",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          borderRight: "1px solid #1E293B",
        }}
      >
        <div style={{ padding: "14px 0 28px" }}>
          <a
            href="/dashboard"
            style={{
              display: "flex", alignItems: "center", gap: 10, lineHeight: 1.3,
              width: "100%", padding: "8px 18px",
              fontSize: 13, fontWeight: 500,
              color: "#94A3B8", textDecoration: "none",
              borderLeft: "2px solid transparent",
            }}
          >
            <DashboardIcon />
            <span>My Dashboard</span>
          </a>
          <a
            href="/profile"
            aria-current="page"
            style={{
              display: "flex", alignItems: "center", gap: 10, lineHeight: 1.3,
              width: "100%", padding: "8px 18px",
              fontSize: 13, fontWeight: 600,
              color: "#F1F5F9", textDecoration: "none",
              background: "linear-gradient(90deg, rgba(96,165,250,0.14), rgba(96,165,250,0.04))",
              borderLeft: "2px solid #60A5FA",
            }}
          >
            <UserIcon />
            <span>Profile</span>
          </a>
        </div>
      </nav>

      {/* Main column — same #F0F4F8 surface DemoClient uses on /dashboard. */}
      <main style={{ flex: 1, minWidth: 0, padding: "24px 20px", minHeight: "100vh" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ color: "#0F172A", fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Profile</h1>
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 28 }}>
            Update your login email, display name, and password.
          </p>

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
        </div>
      </main>
    </div>
  );
}
