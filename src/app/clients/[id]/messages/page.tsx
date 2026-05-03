import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, messages, clinicians } from "@/lib/db/schema";
import { eq, and, asc, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MessageThread } from "@/components/MessageThread";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) notFound();

  const [clinician] = await db
    .select({ name: clinicians.name })
    .from(clinicians)
    .where(eq(clinicians.id, session!.user!.id!))
    .limit(1);

  const [messageList] = await Promise.all([
    db
      .select()
      .from(messages)
      .where(eq(messages.clientId, id))
      .orderBy(asc(messages.createdAt)),
    // Mark all unread client messages as read when clinician opens the thread
    db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.clientId, id),
          eq(messages.senderRole, "client"),
          isNull(messages.readAt)
        )
      ),
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-0 pb-4 border-b border-gray-200">
        <Link
          href={`/clients/${id}`}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-xs text-gray-500">Messages · {messageList.length} total</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden mt-4">
        <MessageThread
          clientId={id}
          initialMessages={messageList}
          clinicianName={clinician?.name ?? "You"}
          clientName={client.name}
        />
      </div>
    </div>
  );
}
