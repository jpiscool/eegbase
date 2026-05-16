"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clinicians, clinics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateClinicName(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) return { error: "No clinic" };

  const name = (formData.get("clinicName") as string).trim();
  if (!name) return { error: "Clinic name is required" };

  await db.update(clinics).set({ name }).where(eq(clinics.id, clinicId));

  revalidatePath("/settings");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = (formData.get("name") as string).trim();
  const emailRaw = formData.get("email");
  if (!name) return { error: "Name is required" };

  const updates: { name: string; email?: string } = { name };

  // Email is optional — if absent we leave it as-is (matches old behaviour).
  // When provided, validate format + uniqueness so a user editing their
  // own login on /profile can change their sign-in address.
  if (typeof emailRaw === "string") {
    const email = emailRaw.trim().toLowerCase();
    if (!email) return { error: "Email is required" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Enter a valid email address" };
    }
    const [existing] = await db
      .select({ id: clinicians.id })
      .from(clinicians)
      .where(eq(clinicians.email, email))
      .limit(1);
    if (existing && existing.id !== session.user.id) {
      return { error: "That email is already in use" };
    }
    updates.email = email;
  }

  await db
    .update(clinicians)
    .set(updates)
    .where(eq(clinicians.id, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/profile");
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

export async function testWebhook(): Promise<{ ok: boolean; status?: number; error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) return { ok: false, error: "No clinic" };

  const [clinic] = await db
    .select({ webhookUrl: clinics.webhookUrl })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  if (!clinic?.webhookUrl) return { ok: false, error: "No webhook URL configured" };

  try {
    const res = await fetch(clinic.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "EEGBase/1.0" },
      body: JSON.stringify({
        event: "test",
        message: "EEGBase webhook test — your endpoint is correctly configured!",
        clinicId,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed" };
  }
}

export async function updateWebhookUrl(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) return { error: "No clinic" };

  const url = (formData.get("webhookUrl") as string).trim();
  if (url && !url.startsWith("https://") && !url.startsWith("http://")) {
    return { error: "Webhook URL must start with http:// or https://" };
  }

  await db.update(clinics).set({ webhookUrl: url || null }).where(eq(clinics.id, clinicId));
  revalidatePath("/settings");
  return { success: true };
}
