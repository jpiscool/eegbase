import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PracticePortal } from "./PracticePortal";

export default async function PortalPracticePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [client] = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.checkInToken, token))
    .limit(1);

  if (!client) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "48px 40px",
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
            Invalid Link
          </h1>
          <p style={{ fontSize: 14, color: "#64748B" }}>
            This practice link is invalid or has expired. Please contact your clinician for a new link.
          </p>
        </div>
      </div>
    );
  }

  return <PracticePortal token={token} clientName={client.name} />;
}
