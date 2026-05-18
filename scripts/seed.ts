/**
 * Seed script — creates the first clinic + admin clinician account.
 * Run with: npx tsx scripts/seed.ts
 *
 * Set DATABASE_URL in .env.local before running.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import { DEFAULT_PROTOCOL_SEEDS } from "../src/lib/seed/default-protocols";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  const clinicName = process.argv[2] ?? "My Clinic";
  const adminEmail = process.argv[3] ?? "admin@clinic.com";
  const adminPassword = process.argv[4] ?? "changeme123";
  const adminName = process.argv[5] ?? "Admin";

  console.log(`Creating clinic: ${clinicName}`);
  const [clinic] = await db
    .insert(schema.clinics)
    .values({ name: clinicName })
    .returning();

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  console.log(`Creating admin: ${adminEmail}`);
  await db.insert(schema.clinicians).values({
    clinicId: clinic.id,
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: "admin",
  });

  // Populate the protocol library so the new clinic isn't empty on
  // first login. Same set is used by any future signup flow.
  console.log(`Seeding ${DEFAULT_PROTOCOL_SEEDS.length} starter protocols`);
  await db.insert(schema.protocols).values(
    DEFAULT_PROTOCOL_SEEDS.map((p) => ({
      clinicId: clinic.id,
      name: p.name,
      description: p.description,
      deviceType: p.deviceType,
      durationSeconds: p.durationSeconds,
      parameters: p.parameters,
    }))
  );

  console.log("Done. You can now sign in at /login");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
