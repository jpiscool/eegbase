import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

// Auth-gate only — /profile renders its own page with a matching mini
// sidebar (same look as DemoClient's strip sidebar) so the nav feels
// consistent across the logged-in surface.
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return <>{children}</>;
}
