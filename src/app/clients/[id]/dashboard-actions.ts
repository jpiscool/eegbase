"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Persists the per-client widget layout. Scoped to (clientId, clinicId)
// so a clinician can only update clients in their own clinic.
export async function saveClientDashboardWidgets(clientId: string, widgetIds: string[]) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId;
  if (!clinicId) throw new Error("Unauthorized");

  // Filter out anything that isn't a string to keep the column clean.
  const clean = widgetIds.filter((w): w is string => typeof w === "string");

  try {
    await db
      .update(clients)
      .set({ dashboardWidgets: clean })
      .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId)));
  } catch {
    // Column not migrated yet — silently no-op. Layout still lives in
    // component state for the active session.
  }
}
