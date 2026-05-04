"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateMemberRole(memberId: string, newRole: "clinician" | "admin") {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";
  const currentUserId = session?.user?.id ?? "";

  if (!clinicId) throw new Error("Unauthorized");

  // Verify current user is admin
  const [me] = await db
    .select({ role: clinicians.role })
    .from(clinicians)
    .where(and(eq(clinicians.id, currentUserId), eq(clinicians.clinicId, clinicId)))
    .limit(1);

  if (me?.role !== "admin") throw new Error("Only admins can change roles");
  if (memberId === currentUserId) throw new Error("Cannot change your own role");

  // Verify target belongs to same clinic
  const [target] = await db
    .select({ id: clinicians.id })
    .from(clinicians)
    .where(and(eq(clinicians.id, memberId), eq(clinicians.clinicId, clinicId)))
    .limit(1);

  if (!target) throw new Error("Member not found");

  await db.update(clinicians).set({ role: newRole }).where(eq(clinicians.id, memberId));
  revalidatePath("/settings/team");
}
