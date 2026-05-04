"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { consumables } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireClinicId(): Promise<string> {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  if (!clinicId) throw new Error("Unauthorized");
  return clinicId;
}

export async function addConsumable(formData: FormData) {
  const clinicId = await requireClinicId();

  await db.insert(consumables).values({
    clinicId,
    name: (formData.get("name") as string).trim(),
    unit: (formData.get("unit") as string).trim() || "units",
    currentStock: Number(formData.get("currentStock")) || 0,
    parLevel: Number(formData.get("parLevel")) || 10,
    usagePerSession: formData.get("usagePerSession") ? Number(formData.get("usagePerSession")) : null,
    notes: (formData.get("notes") as string)?.trim() || null,
  });

  revalidatePath("/settings/inventory");
}

export async function updateStock(id: string, delta: number) {
  const clinicId = await requireClinicId();

  const [item] = await db
    .select({ id: consumables.id, currentStock: consumables.currentStock })
    .from(consumables)
    .where(and(eq(consumables.id, id), eq(consumables.clinicId, clinicId)))
    .limit(1);

  if (!item) throw new Error("Not found");

  const newStock = Math.max(0, item.currentStock + delta);
  await db.update(consumables).set({ currentStock: newStock, updatedAt: new Date() }).where(eq(consumables.id, id));
  revalidatePath("/settings/inventory");
}

export async function deleteConsumable(id: string) {
  const clinicId = await requireClinicId();
  await db.delete(consumables).where(and(eq(consumables.id, id), eq(consumables.clinicId, clinicId)));
  revalidatePath("/settings/inventory");
}
