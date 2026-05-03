import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  if (!clinicId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Ownership check
  const [client] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) {
    return new NextResponse("Not found", { status: 404 });
  }

  const sessionList = await db
    .select({
      id: sessions.id,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      durationSeconds: sessions.durationSeconds,
      deviceType: sessions.deviceType,
      avgRewardScore: sessions.avgRewardScore,
      protocolName: protocols.name,
      preFocus: sessions.preFocus,
      postFocus: sessions.postFocus,
      preMood: sessions.preMood,
      postMood: sessions.postMood,
      preAnxiety: sessions.preAnxiety,
      postAnxiety: sessions.postAnxiety,
      preEnergy: sessions.preEnergy,
      postEnergy: sessions.postEnergy,
      postNotes: sessions.postNotes,
    })
    .from(sessions)
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(sessions.clientId, id))
    .orderBy(desc(sessions.startedAt));

  const headers = [
    "Session ID",
    "Date",
    "Started At",
    "Ended At",
    "Duration (s)",
    "Device",
    "Protocol",
    "Avg Reward Score",
    "Pre Focus",
    "Post Focus",
    "Focus Delta",
    "Pre Mood",
    "Post Mood",
    "Mood Delta",
    "Pre Anxiety",
    "Post Anxiety",
    "Anxiety Delta",
    "Pre Energy",
    "Post Energy",
    "Energy Delta",
    "Notes",
  ];

  function delta(pre: number | null, post: number | null): string {
    if (pre == null || post == null) return "";
    return String(post - pre);
  }

  function cell(v: unknown): string {
    if (v == null) return "";
    const s = String(v);
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (s.includes(",") || s.includes("\n") || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const rows = sessionList.map((s) => [
    s.id,
    new Date(s.startedAt).toLocaleDateString("en-US"),
    new Date(s.startedAt).toISOString(),
    s.endedAt ? new Date(s.endedAt).toISOString() : "",
    s.durationSeconds ?? "",
    s.deviceType,
    s.protocolName ?? "",
    s.avgRewardScore?.toFixed(2) ?? "",
    s.preFocus ?? "",
    s.postFocus ?? "",
    delta(s.preFocus, s.postFocus),
    s.preMood ?? "",
    s.postMood ?? "",
    delta(s.preMood, s.postMood),
    s.preAnxiety ?? "",
    s.postAnxiety ?? "",
    delta(s.preAnxiety, s.postAnxiety),
    s.preEnergy ?? "",
    s.postEnergy ?? "",
    delta(s.preEnergy, s.postEnergy),
    s.postNotes ?? "",
  ]);

  const csv = [
    headers.map(cell).join(","),
    ...rows.map((row) => row.map(cell).join(",")),
  ].join("\n");

  const filename = `${client.name.replace(/[^a-z0-9]/gi, "_")}_sessions.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
