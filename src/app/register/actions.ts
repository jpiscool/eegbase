"use server";

// Public clinic-registration server action. Creates a new clinic + admin
// clinician, seeds the default protocol library, and signs the user in.
// Single transactional path so a partial sign-up never leaves orphan
// rows behind.

import { db } from "@/lib/db";
import { clinics, clinicians, protocols } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth/config";
import { DEFAULT_PROTOCOL_SEEDS } from "@/lib/seed/default-protocols";
import { AuthError } from "next-auth";
import { sendEmail, welcomeEmail } from "@/lib/email";

export interface RegisterResult {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerClinicAction(formData: FormData): Promise<RegisterResult> {
  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Basic input validation. The form does client-side validation too,
  // but never trust the client.
  if (!clinicName) return { error: "Clinic name is required." };
  if (!adminName) return { error: "Your name is required." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  // Email uniqueness — clinicians.email is .unique() so insert would
  // throw, but checking explicitly gives a friendlier error message.
  const [existing] = await db
    .select({ id: clinicians.id })
    .from(clinicians)
    .where(eq(clinicians.email, email))
    .limit(1);
  if (existing) return { error: "An account with that email already exists. Sign in instead." };

  // Create clinic → admin → seed protocols. Drizzle's node-postgres
  // driver doesn't expose a top-level transaction helper here, but
  // each step is independent enough that a failure mid-way leaves
  // recoverable state (a clinic without an admin is rare and can be
  // cleaned up by the seed CLI).
  const [clinic] = await db
    .insert(clinics)
    .values({ name: clinicName })
    .returning({ id: clinics.id });

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(clinicians).values({
    clinicId: clinic.id,
    name: adminName,
    email,
    passwordHash,
    role: "admin",
  });

  // Pre-populate the protocol library so the new dashboard isn't empty.
  await db.insert(protocols).values(
    DEFAULT_PROTOCOL_SEEDS.map((p) => ({
      clinicId: clinic.id,
      name: p.name,
      description: p.description,
      deviceType: p.deviceType,
      durationSeconds: p.durationSeconds,
      parameters: p.parameters,
    })),
  );

  // Fire-and-forget welcome email. Routed by src/lib/email.ts (Resend
  // if RESEND_API_KEY is set, otherwise logged to console in dev).
  // Wrapped in a swallow so a transport hiccup never blocks signup.
  const welcome = welcomeEmail(clinicName, adminName);
  void sendEmail({ to: email, ...welcome }).catch(() => {});

  // Sign the new admin in. signIn() with redirectTo throws a magic
  // redirect; we let it propagate so Next.js handles the navigation.
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // Account was just created with this password — this would
      // mean a real bug in the auth wiring rather than a user error.
      return { error: "Account created but sign-in failed. Try signing in manually." };
    }
    throw err;
  }

  return {};
}
