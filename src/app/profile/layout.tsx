import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

// Auth-gate only — Profile is reached from the strip-mode dashboard, so we
// intentionally render WITHOUT the clinician Sidebar / TrustStrip / CommandMenu
// to match that minimal surface. A small back link inside the page handles
// navigation back to /dashboard.
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return <>{children}</>;
}
