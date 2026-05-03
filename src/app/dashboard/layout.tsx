import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { messages, clients, clinicians } from "@/lib/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandMenu } from "@/components/CommandMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const clinicId = (session.user as { clinicId?: string })?.clinicId ?? "";

  // Unread messages (client-sent, not yet read)
  const [unreadRow] = await db
    .select({ count: count() })
    .from(messages)
    .innerJoin(clients, eq(messages.clientId, clients.id))
    .where(
      and(
        eq(clients.clinicId, clinicId),
        eq(messages.senderRole, "client"),
        isNull(messages.readAt)
      )
    );

  const unreadMessages = Number(unreadRow?.count ?? 0);

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar
        userName={session.user?.name ?? undefined}
        userEmail={session.user?.email ?? undefined}
        unreadMessages={unreadMessages}
      />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
      <CommandMenu />
    </div>
  );
}
