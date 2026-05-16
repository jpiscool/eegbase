import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

// Auth-gate only — the dashboard home renders the polished DemoClient
// (its own sidebar + tab chrome), so we intentionally do NOT wrap it in
// the clinician-app Sidebar / TrustStrip / CommandMenu. Other authenticated
// sections (clients, sessions, protocols, …) live at their own top-level
// routes with their own layouts and are unaffected.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  return <>{children}</>;
}
