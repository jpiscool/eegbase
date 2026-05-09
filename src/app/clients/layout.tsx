import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandMenu } from "@/components/CommandMenu";
import { getReviewQueueCount } from "@/lib/reviewQueueCount";
import { TrustStrip } from "@/components/shared/TrustStrip";

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const clinicId = (session.user as { clinicId?: string })?.clinicId ?? "";
  const reviewQueueCount = await getReviewQueueCount(clinicId);

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} reviewQueueCount={reviewQueueCount} />
      <main className="flex-1 overflow-auto">
        <TrustStrip />
        <div className="p-8">{children}</div>
      </main>
      <CommandMenu />
    </div>
  );
}
