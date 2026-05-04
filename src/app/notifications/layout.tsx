import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { messages, clients, appointments } from "@/lib/db/schema";
import { eq, and, isNull, count, gte, lte } from "drizzle-orm";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandMenu } from "@/components/CommandMenu";
import { getReviewQueueCount } from "@/lib/reviewQueueCount";

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const clinicId = (session.user as { clinicId?: string })?.clinicId ?? "";
  const reviewQueueCount = await getReviewQueueCount(clinicId);

  const [unreadRow] = await db
    .select({ count: count() })
    .from(messages)
    .innerJoin(clients, eq(messages.clientId, clients.id))
    .where(and(eq(clients.clinicId, clinicId), eq(messages.senderRole, "client"), isNull(messages.readAt)));

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [upcomingRow] = await db
    .select({ count: count() })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .where(and(eq(clients.clinicId, clinicId), gte(appointments.scheduledAt, now), lte(appointments.scheduledAt, tomorrow)));

  const unreadMessages = Number(unreadRow?.count ?? 0);
  const notificationCount = unreadMessages + Number(upcomingRow?.count ?? 0);

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar
        userName={session.user?.name ?? undefined}
        userEmail={session.user?.email ?? undefined}
        unreadMessages={unreadMessages}
        notificationCount={notificationCount}
        reviewQueueCount={reviewQueueCount}
      />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
      <CommandMenu />
    </div>
  );
}
