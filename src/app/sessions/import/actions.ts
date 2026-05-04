"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface CsvRow {
  client_email: string;
  started_at: string;
  duration_seconds?: string;
  device_type?: string;
  avg_reward_score?: string;
  notes?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importSessionsFromCsv(csvText: string): Promise<ImportResult> {
  const authSession = await auth();
  if (!authSession?.user) throw new Error("Unauthorized");
  const clinicId = (authSession.user as { clinicId?: string }).clinicId!;

  const lines = csvText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { imported: 0, skipped: 0, errors: ["CSV must have a header row and at least one data row"] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const requiredCols = ["client_email", "started_at"];
  const missing = requiredCols.filter((c) => !header.includes(c));
  if (missing.length > 0) return { imported: 0, skipped: 0, errors: [`Missing required columns: ${missing.join(", ")}`] };

  // Fetch all clinic clients indexed by email
  const clinicClients = await db
    .select({ id: clients.id, email: clients.email })
    .from(clients)
    .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)));
  const clientByEmail = new Map(clinicClients.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c.id]));

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    header.forEach((h, idx) => { row[h] = values[idx] ?? ""; });

    const typedRow = row as unknown as CsvRow;
    const email = typedRow.client_email?.toLowerCase();
    const startedAt = typedRow.started_at;

    if (!email || !startedAt) { errors.push(`Row ${i + 1}: missing client_email or started_at`); skipped++; continue; }
    const clientId = clientByEmail.get(email);
    if (!clientId) { errors.push(`Row ${i + 1}: no active client found with email "${email}"`); skipped++; continue; }

    const startDate = new Date(startedAt);
    if (isNaN(startDate.getTime())) { errors.push(`Row ${i + 1}: invalid date "${startedAt}"`); skipped++; continue; }

    const durationSeconds = typedRow.duration_seconds ? parseInt(typedRow.duration_seconds) : null;
    const avgRewardScore = typedRow.avg_reward_score ? parseFloat(typedRow.avg_reward_score) : null;
    const deviceType = typedRow.device_type || "simulator";
    const notes = typedRow.notes || null;

    await db.insert(sessions).values({
      clientId,
      startedAt: startDate,
      durationSeconds: !isNaN(durationSeconds!) ? durationSeconds : null,
      avgRewardScore: avgRewardScore != null && !isNaN(avgRewardScore) ? avgRewardScore : null,
      deviceType,
      notes,
    });
    imported++;
  }

  revalidatePath("/sessions");
  return { imported, skipped, errors };
}
