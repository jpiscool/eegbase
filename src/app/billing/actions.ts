"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface InvoicePayload {
  clientId: string;
  sessionId?: string;
  amountCents: number;
  currency?: string;
  description: string;
  cptCode?: string;
  dueDate?: string;
  notes?: string;
}

export async function createInvoice(payload: InvoicePayload): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const clinicId = (session.user as { clinicId?: string }).clinicId!;

  const [row] = await db
    .insert(invoices)
    .values({
      clinicId,
      clientId: payload.clientId,
      sessionId: payload.sessionId ?? null,
      amountCents: payload.amountCents,
      currency: payload.currency ?? "USD",
      description: payload.description,
      cptCode: payload.cptCode ?? null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      notes: payload.notes ?? null,
      status: "draft",
    })
    .returning({ id: invoices.id });

  revalidatePath("/billing");
  return row.id;
}

export async function updateInvoiceStatus(
  id: string,
  status: "draft" | "sent" | "paid" | "waived"
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.update(invoices).set({ status }).where(eq(invoices.id, id));
  revalidatePath("/billing");
}
