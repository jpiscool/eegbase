import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols } from "@/lib/db/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as { clinicId?: string }).clinicId ?? "";
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ clients: [], sessions: [], protocols: [] });

  const pattern = `%${q}%`;

  const [clientResults, protocolResults, sessionResults] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name, email: clients.email })
      .from(clients)
      .where(
        and(
          eq(clients.clinicId, clinicId),
          or(ilike(clients.name, pattern), ilike(clients.email, pattern))
        )
      )
      .limit(5),

    db
      .select({ id: protocols.id, name: protocols.name, deviceType: protocols.deviceType })
      .from(protocols)
      .where(and(eq(protocols.clinicId, clinicId), ilike(protocols.name, pattern)))
      .limit(3),

    db
      .select({
        id: sessions.id,
        clientName: clients.name,
        startedAt: sessions.startedAt,
        deviceType: sessions.deviceType,
      })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .where(ilike(clients.name, pattern))
      .orderBy(desc(sessions.startedAt))
      .limit(4),
  ]);

  return NextResponse.json({
    clients: clientResults.map((c) => ({
      id: c.id,
      label: c.name,
      sub: c.email ?? "",
      href: `/clients/${c.id}`,
    })),
    protocols: protocolResults.map((p) => ({
      id: p.id,
      label: p.name,
      sub: p.deviceType,
      href: `/protocols/${p.id}`,
    })),
    sessions: sessionResults.map((s) => ({
      id: s.id,
      label: `Session — ${s.clientName}`,
      sub: new Date(s.startedAt).toLocaleDateString(),
      href: `/sessions/${s.id}`,
    })),
  });
}
