"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Name is required" };

  await db
    .update(clinicians)
    .set({ name })
    .where(eq(clinicians.id, session.user.id));

  revalidatePath("/settings");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  const [clinician] = await db
    .select({ passwordHash: clinicians.passwordHash })
    .from(clinicians)
    .where(eq(clinicians.id, session.user.id))
    .limit(1);

  if (!clinician?.passwordHash) return { error: "Account error" };

  const valid = await bcrypt.compare(currentPassword, clinician.passwordHash);
  if (!valid) return { error: "Current password is incorrect" };

  const hash = await bcrypt.hash(newPassword, 12);
  await db
    .update(clinicians)
    .set({ passwordHash: hash })
    .where(eq(clinicians.id, session.user.id));

  return { success: true };
}
