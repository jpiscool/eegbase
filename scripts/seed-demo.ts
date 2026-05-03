import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  const [clinic] = await db.select().from(schema.clinics).limit(1);
  const [clinician] = await db.select().from(schema.clinicians).limit(1);

  const clientData = [
    { name: "Sarah Mitchell", email: "sarah.m@example.com", notes: "ADHD, anxiety. Goal: improve focus during work.", goals: "Reduce anxiety, improve sustained attention" },
    { name: "Marcus Chen", email: "marcus.c@example.com", notes: "Post-concussion syndrome. Mild cognitive fatigue.", goals: "Restore baseline cognitive function" },
    { name: "Amara Osei", email: "amara.o@example.com", notes: "Performance anxiety — musician.", goals: "Calm pre-performance nerves, maintain peak state" },
  ];

  const inserted = await db.insert(schema.clients).values(
    clientData.map((c) => ({ ...c, clinicId: clinic.id, clinicianId: clinician.id }))
  ).returning();

  const [p1, p2] = await db.insert(schema.protocols).values([
    { clinicId: clinic.id, name: "Prefrontal Upregulation", description: "Increase oxyHb in left and right PFC. Standard Mendi protocol.", deviceType: "mendi", durationSeconds: 1200 },
    { clinicId: clinic.id, name: "Alpha-Theta Relaxation", description: "Deep relaxation / performance protocol.", deviceType: "simulator", durationSeconds: 1800 },
  ]).returning();

  await db.insert(schema.assignments).values([
    { clientId: inserted[0].id, protocolId: p1.id },
    { clientId: inserted[2].id, protocolId: p2.id },
  ]);

  const now = new Date();

  // 8 sessions for Sarah, trending upward
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 3);
    await db.insert(schema.sessions).values({
      clientId: inserted[0].id,
      protocolId: p1.id,
      deviceType: "mendi",
      startedAt: d,
      endedAt: new Date(d.getTime() + 1200000),
      durationSeconds: 1200,
      avgRewardScore: 45 + (7 - i) * 4 + Math.random() * 5,
      preFocus: 4,
      postFocus: 4 + Math.floor((7 - i) * 0.5) + 1,
      preMood: 5,
      postMood: 6,
      preAnxiety: 7,
      postAnxiety: 5,
      preEnergy: 5,
      postEnergy: 6,
      postNotes: i === 0 ? "Best session yet — client reported feeling significantly calmer and more focused." : null,
    });
  }

  // 3 sessions for Marcus
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 5);
    await db.insert(schema.sessions).values({
      clientId: inserted[1].id,
      deviceType: "simulator",
      startedAt: d,
      endedAt: new Date(d.getTime() + 600000),
      durationSeconds: 600,
      avgRewardScore: 55 + (2 - i) * 6,
      preFocus: 4, postFocus: 6,
      preMood: 5, postMood: 6,
      preAnxiety: 6, postAnxiety: 5,
      preEnergy: 4, postEnergy: 5,
    });
  }

  // 7 check-ins for Sarah
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    await db.insert(schema.checkIns).values({
      clientId: inserted[0].id,
      date: d,
      sleepHours: 6.5 + Math.random(),
      sleepQuality: 5 + Math.floor((6 - i) * 0.3),
      mood: 5 + Math.floor((6 - i) * 0.2),
      anxiety: 7 - Math.floor((6 - i) * 0.4),
      focus: 5 + Math.floor((6 - i) * 0.4),
      energy: 5 + Math.floor((6 - i) * 0.2),
    });
  }

  // A message thread for Sarah
  await db.insert(schema.messages).values([
    {
      clientId: inserted[0].id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "Hi Sarah! Great progress this week — your reward scores are trending up nicely. How are you feeling day-to-day?",
    },
    {
      clientId: inserted[0].id,
      clinicianId: clinician.id,
      senderRole: "client",
      body: "Hi! Honestly feeling much better. The morning sessions especially seem to help me stay focused through the workday.",
    },
    {
      clientId: inserted[0].id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "That's exactly what we're aiming for. Let's stick with the morning schedule. See you Thursday!",
    },
  ]);

  console.log("Demo data seeded:");
  console.log("  Clients:", inserted.map((c) => c.name).join(", "));
  console.log("  Protocols:", p1.name, "/", p2.name);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
