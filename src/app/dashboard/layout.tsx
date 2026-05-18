import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandMenu } from "@/components/CommandMenu";
import { getReviewQueueCount } from "@/lib/reviewQueueCount";
import { TrustStrip } from "@/components/shared/TrustStrip";

// Wraps /dashboard in the same global Sidebar shell as /clients, /sessions,
// /settings, etc. so the logged-in chrome is identical on every route.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const clinicId = (session.user as { clinicId?: string })?.clinicId ?? "";
  const reviewQueueCount = await getReviewQueueCount(clinicId);

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar
        userName={session.user?.name ?? undefined}
        userEmail={session.user?.email ?? undefined}
        reviewQueueCount={reviewQueueCount}
      />
      <main className="flex-1 overflow-auto">
        <TrustStrip />
        <div className="p-8">{children}</div>
      </main>
      <CommandMenu />
    </div>
  );
}
