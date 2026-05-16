import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Sidebar } from "@/components/layout/sidebar";
import { getReviewQueueCount } from "@/lib/reviewQueueCount";

// Auth-gate + wrap the dashboard in the clinician Sidebar so logged-in users
// have a consistent nav across every authenticated surface. DemoClient's
// internal nav is suppressed in appMode='strip' so the two sidebars don't
// stack. TrustStrip + CommandMenu are intentionally skipped here to keep
// the strip-mode landing free of marketing chrome.
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
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
