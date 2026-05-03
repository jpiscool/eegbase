import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, protocols } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { LiveSessionView } from "@/components/LiveSessionView";

export default async function LiveSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; protocolId?: string }>;
}) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  const { clientId: defaultClientId, protocolId: defaultProtocolId } = await searchParams;

  const [clientList, protocolList] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.clinicId, clinicId))
      .orderBy(clients.name),
    db
      .select({ id: protocols.id, name: protocols.name, deviceType: protocols.deviceType, durationSeconds: protocols.durationSeconds })
      .from(protocols)
      .where(eq(protocols.clinicId, clinicId))
      .orderBy(protocols.name),
  ]);

  return (
    <LiveSessionView
      clients={clientList}
      protocols={protocolList}
      defaultClientId={defaultClientId}
      defaultProtocolId={defaultProtocolId}
    />
  );
}
