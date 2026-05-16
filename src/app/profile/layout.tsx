import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Sidebar } from "@/components/layout/sidebar";
import { getReviewQueueCount } from "@/lib/reviewQueueCount";

// Auth-gate + clinician Sidebar — Profile uses the same sidebar shell as
// the rest of the logged-in app so the nav is consistent everywhere.
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
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
