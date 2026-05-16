import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

// Auth-gate only — the stripped sidebar lives inside DemoClient (its
// existing .demo-sidebar nav), which is the same sidebar already shown
// on /demo. Don't wrap it in any other shell so there's exactly one
// sidebar on the logged-in dashboard.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  return <>{children}</>;
}
