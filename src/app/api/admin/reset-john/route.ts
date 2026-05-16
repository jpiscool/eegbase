/**
 * ONE-OFF admin endpoint: reset / create the john@eegbase.com clinician
 * account on whatever DB this Next.js instance is connected to.
 *
 * REMOVE THIS FILE IMMEDIATELY AFTER USE.
 *
 * Protected by a single fixed secret in the URL. The secret is rotated
 * each time this file is created — the value below is for one specific
 * deploy and gets deleted with the file.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { clinicians, clinics } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

const ONE_TIME_SECRET = "e6094cbfeac54e3d47f79a955a964622";
const NEW_EMAIL = "john@eegbase.com";
const OLD_EMAIL = "demo@eegbase.io";
const NEW_NAME = "John Traugott";
const PASSWORD = "demo2026";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== ONE_TIME_SECRET) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const hash = await bcrypt.hash(PASSWORD, 12);

  // Find the row to update — either the renamed one or the old one.
  const existing = await db
    .select()
    .from(clinicians)
    .where(or(eq(clinicians.email, NEW_EMAIL), eq(clinicians.email, OLD_EMAIL)))
    .limit(1);

  if (existing.length > 0) {
    const target = existing[0];
    const result = await db
      .update(clinicians)
      .set({ email: NEW_EMAIL, passwordHash: hash, name: NEW_NAME })
      .where(eq(clinicians.id, target.id))
      .returning({ id: clinicians.id, email: clinicians.email, name: clinicians.name });
    return NextResponse.json({
      ok: true,
      action: "updated",
      clinician: result[0],
      login: { email: NEW_EMAIL, password: PASSWORD },
    });
  }

  // No clinician — create the clinic + clinician.
  const existingClinic = await db.select().from(clinics).limit(1);
  let clinicId: string;
  if (existingClinic.length > 0) {
    clinicId = existingClinic[0].id;
  } else {
    const newClinic = await db
      .insert(clinics)
      .values({ name: "EEGBase Demo Clinic" })
      .returning({ id: clinics.id });
    clinicId = newClinic[0].id;
  }

  const inserted = await db
    .insert(clinicians)
    .values({
      clinicId,
      email: NEW_EMAIL,
      name: NEW_NAME,
      passwordHash: hash,
      role: "admin",
    })
    .returning({ id: clinicians.id, email: clinicians.email, name: clinicians.name });

  return NextResponse.json({
    ok: true,
    action: "created",
    clinic_id: clinicId,
    clinician: inserted[0],
    login: { email: NEW_EMAIL, password: PASSWORD },
  });
}

export async function GET() {
  return new NextResponse("POST with ?secret=... to reset", { status: 405 });
}
