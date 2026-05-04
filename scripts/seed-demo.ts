/**
 * seed-demo.ts — Pacific Neurofeedback demo clinic
 * Creates a rich, realistic demo dataset for the EEGBase platform.
 *
 * Run: npm run seed:demo
 *
 * Clinic:    Pacific Neurofeedback
 * Clinician: Dr. Sarah Chen  (demo@eegbase.io / demo2026)
 * Clients:   10 (varied presentations, all Mendi fNIRS)
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as schema from "../src/lib/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ── Helpers ───────────────────────────────────────────────────────────────────

function randWalk(prev: number, min: number, max: number, step = 0.02): number {
  const next = prev + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

function round(v: number, places = 3) {
  return Math.round(v * 10 ** places) / 10 ** places;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Generate fNIRS + reward data points for a session.
 * quality ∈ [0, 1] — higher = more upward trend (later sessions look better).
 */
async function seedDataPoints(
  sessionId: string,
  durationSec: number,
  quality: number,
  deviceType: "mendi" | "simulator"
) {
  let oxyL = 0.02 + quality * 0.02;
  let oxyR = 0.01 + quality * 0.02;
  let deoxyL = -0.01;
  let deoxyR = -0.02;
  let delta = 0.35, theta = 0.40, alpha = 0.50, beta = 0.30, gamma = 0.15;

  const rows: Array<typeof schema.sessionDataPoints.$inferInsert> = [];

  for (let t = 0; t < durationSec; t++) {
    const progress = t / durationSec;
    const trendRate = quality * 0.08;
    const trend = Math.min(progress * trendRate, quality * 0.2);
    const noise = 0.05;

    oxyL = randWalk(oxyL + trend * 0.002, -0.2, 0.9, noise);
    oxyR = randWalk(oxyR + trend * 0.002, -0.2, 0.9, noise);
    deoxyL = randWalk(deoxyL - trend * 0.001, -0.5, 0.3, noise * 0.8);
    deoxyR = randWalk(deoxyR - trend * 0.001, -0.5, 0.3, noise * 0.8);

    delta = randWalk(delta, 0.1, 0.7, noise);
    theta = randWalk(theta, 0.1, 0.8, noise);
    alpha = randWalk(alpha, 0.1, 0.9, noise * 1.2);
    beta  = randWalk(beta,  0.05, 0.7, noise * 0.9);
    gamma = randWalk(gamma, 0.02, 0.5, noise * 0.7);

    const oxyAvg = (oxyL + oxyR) / 2;
    const rewardScore = round(Math.max(0, Math.min(100, 50 + oxyAvg * 80 + trend * 15)), 1);

    rows.push({
      sessionId,
      timestampMs: t * 1000,
      ...(deviceType !== "simulator"
        ? {
            oxyHbLeft:    round(oxyL),
            oxyHbRight:   round(oxyR),
            deoxyHbLeft:  round(deoxyL),
            deoxyHbRight: round(deoxyR),
          }
        : {}),
      delta:  round(delta),
      theta:  round(theta),
      alpha:  round(alpha),
      beta:   round(beta),
      gamma:  round(gamma),
      rewardScore,
    });
  }

  // Insert in 500-row batches
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(schema.sessionDataPoints).values(rows.slice(i, i + BATCH));
  }
}

// ── Session factory ───────────────────────────────────────────────────────────

interface SessionSpec {
  clientId: string;
  protocolId: string;
  sessionIndex: number;   // 0-based (used for trending quality)
  totalSessions: number;
  daysAgoStart: number;
  baseReward: number;     // early session avg reward score
  peakReward: number;     // late session avg reward score
  preFocus: number;
  postFocusBase: number;
  preMood: number;
  postMoodBase: number;
  preAnxiety: number;
  postAnxietyBase: number;
  preEnergy: number;
  postEnergyBase: number;
  notes?: string | null;
  postNotes?: string | null;
  tags?: string[] | null;
}

async function createSession(spec: SessionSpec): Promise<string> {
  const progress = spec.totalSessions > 1 ? spec.sessionIndex / (spec.totalSessions - 1) : 0;
  const quality  = 0.1 + progress * 0.85;
  const avgReward = round(spec.baseReward + (spec.peakReward - spec.baseReward) * progress, 1);

  const startedAt = daysAgo(spec.daysAgoStart);
  const endedAt   = new Date(startedAt.getTime() + 1200000);

  const [saved] = await db
    .insert(schema.sessions)
    .values({
      clientId:      spec.clientId,
      protocolId:    spec.protocolId,
      deviceType:    "mendi",
      startedAt,
      endedAt,
      durationSeconds: 1200,
      avgRewardScore:  avgReward,
      preFocus:  clamp(spec.preFocus,  1, 10) as unknown as number,
      postFocus: clamp(Math.round(spec.postFocusBase + progress * 2), 1, 10) as unknown as number,
      preMood:   clamp(spec.preMood,   1, 10) as unknown as number,
      postMood:  clamp(Math.round(spec.postMoodBase  + progress * 2), 1, 10) as unknown as number,
      preAnxiety:  clamp(spec.preAnxiety,  1, 10) as unknown as number,
      postAnxiety: clamp(Math.round(spec.postAnxietyBase - progress * 2), 1, 10) as unknown as number,
      preEnergy:   clamp(spec.preEnergy,   1, 10) as unknown as number,
      postEnergy:  clamp(Math.round(spec.postEnergyBase  + progress * 2), 1, 10) as unknown as number,
      notes:     spec.notes ?? null,
      postNotes: spec.postNotes ?? null,
      tags:      spec.tags ?? null,
    })
    .returning({ id: schema.sessions.id });

  await seedDataPoints(saved.id, 1200, quality, "mendi");
  return saved.id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Pacific Neurofeedback — demo seed starting…\n");

  // ── 1. Clinic ──────────────────────────────────────────────────────────────
  const [clinic] = await db
    .insert(schema.clinics)
    .values({ name: "Pacific Neurofeedback" })
    .returning();
  console.log(`Clinic created: ${clinic.name} (${clinic.id})`);

  // ── 2. Clinician ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo2026", 12);
  const [clinician] = await db
    .insert(schema.clinicians)
    .values({
      clinicId:     clinic.id,
      name:         "Dr. Sarah Chen",
      email:        "demo@eegbase.io",
      passwordHash,
      role:         "admin",
    })
    .returning();
  console.log(`Clinician created: ${clinician.name} (${clinician.email})\n`);

  // ── 3. Protocol ────────────────────────────────────────────────────────────
  const [protocol] = await db
    .insert(schema.protocols)
    .values({
      clinicId:        clinic.id,
      name:            "fNIRS Prefrontal Upregulation",
      description:     "Increase oxyHb in left and right PFC via Mendi fNIRS. " +
                       "Evidence-based frontal attention protocol for focus, executive function, " +
                       "anxiety regulation, and performance optimization.",
      deviceType:      "mendi",
      durationSeconds: 1200,
      parameters: {
        rewardThreshold:  0.05,
        smoothingWindow:  8,
        baselineSeconds:  60,
        feedbackMode:     "visual",
      },
    })
    .returning();
  console.log(`Protocol created: ${protocol.name}\n`);

  // ── 4. Clients ─────────────────────────────────────────────────────────────

  const clientDefs = [
    // 1 — Marcus Webb, 34, ADHD + anxiety, 22 sessions, strong improvement
    {
      name:          "Marcus Webb",
      email:         "marcus.webb@example.com",
      dateOfBirth:   new Date("1990-03-14"),
      notes:         "ADHD combined presentation + generalised anxiety. " +
                     "High-performing software engineer; reports difficulty sustaining attention " +
                     "during deep work and frequent racing thoughts before meetings. " +
                     "No medication. Motivated and consistent with scheduling.",
      goals:         "Improve sustained attention during deep work blocks; reduce pre-meeting anxiety.",
      referralSource: "Psychiatrist referral",
    },
    // 2 — Elena Vasquez, 28, anxiety/stress, 18 sessions, steady improvement
    {
      name:          "Elena Vasquez",
      email:         "elena.vasquez@example.com",
      dateOfBirth:   new Date("1996-07-22"),
      notes:         "Generalised anxiety and work-related stress. Marketing manager with " +
                     "demanding deadlines. Reports tension headaches and difficulty winding down " +
                     "in the evenings. No prior mental health treatment.",
      goals:         "Reduce baseline anxiety; improve sleep onset latency.",
      referralSource: "Self-referral (Instagram)",
    },
    // 3 — James O'Brien, 41, PTSD/trauma, 15 sessions, moderate improvement
    {
      name:          "James O'Brien",
      email:         "james.obrien@example.com",
      dateOfBirth:   new Date("1983-11-05"),
      notes:         "PTSD — motor vehicle accident 2 years ago. Concurrent therapy with " +
                     "licensed trauma therapist (Dr. Lim). Reports hypervigilance, disrupted sleep, " +
                     "and intrusive thoughts. Currently on low-dose SSRI.",
      goals:         "Reduce hypervigilance; improve sleep continuity; support PTSD recovery.",
      referralSource: "Therapist referral (Dr. Lim)",
    },
    // 4 — Priya Sharma, 31, focus/performance, 12 sessions, good progress
    {
      name:          "Priya Sharma",
      email:         "priya.sharma@example.com",
      dateOfBirth:   new Date("1993-01-30"),
      notes:         "Performance optimisation — medical resident seeking improved cognitive stamina. " +
                     "No clinical diagnoses. Reports fatigue during long hospital shifts and " +
                     "difficulty transitioning from work to rest. Goal-oriented and highly motivated.",
      goals:         "Increase cognitive endurance during long shifts; faster mental recovery.",
      referralSource: "Colleague recommendation",
    },
    // 5 — Daniel Kim, 16, ADHD, 8 sessions, early progress (parents involved)
    {
      name:          "Daniel Kim",
      email:         "daniel.kim.parent@example.com",
      dateOfBirth:   new Date("2008-09-12"),
      notes:         "ADHD-Inattentive, diagnosed age 12. Currently taking low-dose methylphenidate. " +
                     "Parents report difficulty with homework focus and organisation. " +
                     "Sessions scheduled after school on Tuesdays and Thursdays. " +
                     "Parent (Jennifer Kim) present for first 5 minutes of each session.",
      goals:         "Improve homework focus; reduce task-switching difficulties.",
      referralSource: "Paediatrician referral",
    },
    // 6 — Rachel Thompson, 45, depression + brain fog, 6 sessions, early
    {
      name:          "Rachel Thompson",
      email:         "rachel.thompson@example.com",
      dateOfBirth:   new Date("1979-05-18"),
      notes:         "Major depressive disorder (moderate) + subjective cognitive fog. " +
                     "Currently in remission on antidepressant (sertraline 100mg). " +
                     "Primary concern is persistent mental fatigue and word-finding difficulties. " +
                     "Coordinator at a non-profit organisation.",
      goals:         "Reduce brain fog; improve mood stability and daily energy levels.",
      referralSource: "GP referral",
    },
    // 7 — Tyler Rodriguez, 29, sleep + anxiety, 4 sessions, just started
    {
      name:          "Tyler Rodriguez",
      email:         "tyler.rodriguez@example.com",
      dateOfBirth:   new Date("1995-12-03"),
      notes:         "Sleep onset insomnia and generalised anxiety. Freelance graphic designer; " +
                     "irregular schedule contributing to circadian disruption. Reports lying awake " +
                     "2–3 hours before sleep most nights. No medication.",
      goals:         "Reduce pre-sleep mental arousal; improve sleep onset.",
      referralSource: "Online search",
    },
    // 8 — Amara Okafor, 38, ADHD, 2 sessions, onboarding
    {
      name:          "Amara Okafor",
      email:         "amara.okafor@example.com",
      dateOfBirth:   new Date("1986-08-27"),
      notes:         "ADHD combined presentation — recently diagnosed at age 37. " +
                     "Senior project manager; masking difficulties at work. " +
                     "Exploring non-pharmacological approaches before considering medication.",
      goals:         "Understand her neurofeedback baseline; improve executive planning.",
      referralSource: "ADHD support group recommendation",
    },
    // 9 — Sarah Mitchell, 52, cognitive decline prevention, 1 session
    {
      name:          "Sarah Mitchell",
      email:         "sarah.mitchell@example.com",
      dateOfBirth:   new Date("1972-02-14"),
      notes:         "Preventive cognitive health — family history of early-onset Alzheimer's. " +
                     "No current cognitive impairment (MoCA 28/30). Retired nurse, highly engaged " +
                     "in lifestyle interventions. Interested in long-term brain health monitoring.",
      goals:         "Establish cognitive baseline; monitor prefrontal oxygenation over time.",
      referralSource: "Neurologist recommendation",
    },
    // 10 — Noah Petersen, 24, performance optimization, 0 sessions
    {
      name:          "Noah Petersen",
      email:         "noah.petersen@example.com",
      dateOfBirth:   new Date("2000-06-09"),
      notes:         "Performance optimisation — competitive eSports player and part-time student. " +
                     "Interested in improving reaction time and sustained attention during tournaments. " +
                     "No clinical concerns. Enrolled after reading a research article on fNIRS.",
      goals:         "Optimise prefrontal activation for competitive gaming performance.",
      referralSource: "Research article (self-referral)",
    },
  ];

  const insertedClients = await db
    .insert(schema.clients)
    .values(
      clientDefs.map((c) => ({
        ...c,
        clinicId:      clinic.id,
        clinicianId:   clinician.id,
        active:        true,
        reportToken:   crypto.randomUUID(),
        checkInToken:  crypto.randomUUID(),
      }))
    )
    .returning();

  console.log(`Clients created: ${insertedClients.map((c) => c.name).join(", ")}\n`);

  const [marcus, elena, james, priya, daniel, rachel, tyler, amara, sarahM, noah] = insertedClients;

  // ── 5. Assign protocol to all clients ─────────────────────────────────────
  await db.insert(schema.assignments).values(
    insertedClients.map((c) => ({
      clientId:   c.id,
      protocolId: protocol.id,
      active:     true,
    }))
  );
  console.log("Protocol assignments created\n");

  // ── 6. Sessions ────────────────────────────────────────────────────────────

  console.log("Creating sessions with Mendi fNIRS time series…");

  // Spacing helper: spread N sessions evenly over a span of days (ending today)
  function sessionDayOffset(total: number, index: number, spanDays: number): number {
    // index 0 = oldest; index total-1 = most recent (1 day ago)
    const step = spanDays / Math.max(1, total - 1);
    return Math.round(spanDays - index * step) + 1;
  }

  // ── Marcus Webb: 22 sessions, strong improvement ─────────────────────────
  const marcusSessionIds: string[] = [];
  for (let i = 0; i < 22; i++) {
    const id = await createSession({
      clientId:       marcus.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  22,
      daysAgoStart:   sessionDayOffset(22, i, 84),
      baseReward:     46,
      peakReward:     74,
      preFocus:       4,
      postFocusBase:  6,
      preMood:        5,
      postMoodBase:   6,
      preAnxiety:     7,
      postAnxietyBase: 6,
      preEnergy:      4,
      postEnergyBase: 6,
      notes: i === 0 ? "Baseline session. Marcus engaged well; some difficulty settling initially." :
             i === 10 ? "Halfway milestone. Client reports improved focus during morning standup calls." :
             i === 21 ? "Exceptional session. Marcus reports he stopped using his office white noise machine — no longer needed." : null,
      postNotes: i === 21 ? "This was my best session yet. I could feel my mind quiet down within the first few minutes." : null,
      tags: i === 0 ? ["baseline"] :
            i === 10 ? ["week-8", "midpoint-review"] :
            i === 21 ? ["high-performance", "discharge-review"] : null,
    });
    marcusSessionIds.push(id);
    process.stdout.write(`  Marcus ${i + 1}/22\r`);
  }
  console.log(`  Marcus: 22 sessions ✓`);

  // ── Elena Vasquez: 18 sessions, steady improvement ────────────────────────
  const elenaSessionIds: string[] = [];
  for (let i = 0; i < 18; i++) {
    const id = await createSession({
      clientId:       elena.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  18,
      daysAgoStart:   sessionDayOffset(18, i, 70),
      baseReward:     47,
      peakReward:     69,
      preFocus:       5,
      postFocusBase:  6,
      preMood:        5,
      postMoodBase:   6,
      preAnxiety:     8,
      postAnxietyBase: 7,
      preEnergy:      5,
      postEnergyBase: 6,
      notes: i === 0 ? "Baseline. Elena visibly tense at start; relaxed considerably by mid-session." :
             i === 17 ? "Elena reports sleeping through the night 5 of the last 7 days — significant milestone." : null,
      postNotes: i === 17 ? "I didn't realise how much chronic tension I was carrying. This has been life-changing." : null,
      tags: i === 0 ? ["baseline"] : i === 17 ? ["final-review", "sleep-milestone"] : null,
    });
    elenaSessionIds.push(id);
    process.stdout.write(`  Elena ${i + 1}/18\r`);
  }
  console.log(`  Elena: 18 sessions ✓`);

  // ── James O'Brien: 15 sessions, moderate improvement ─────────────────────
  const jamesSessionIds: string[] = [];
  for (let i = 0; i < 15; i++) {
    const id = await createSession({
      clientId:       james.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  15,
      daysAgoStart:   sessionDayOffset(15, i, 60),
      baseReward:     44,
      peakReward:     62,
      preFocus:       4,
      postFocusBase:  5,
      preMood:        4,
      postMoodBase:   5,
      preAnxiety:     8,
      postAnxietyBase: 7,
      preEnergy:      3,
      postEnergyBase: 5,
      notes: i === 0 ? "Baseline. James cautious and reserved. Explained fNIRS mechanism; he found the science reassuring." :
             i === 7 ? "Co-treating therapist (Dr. Lim) reports James described fewer intrusive thoughts this week." :
             i === 14 ? "James arrived relaxed. Reported his first full night of sleep (7 hrs) in over two years." : null,
      postNotes: i === 14 ? "Slept 7 hours straight on Thursday. I didn't think that was possible anymore." : null,
      tags: i === 0 ? ["baseline"] : i === 7 ? ["midpoint", "co-treatment-note"] : i === 14 ? ["sleep-milestone"] : null,
    });
    jamesSessionIds.push(id);
    process.stdout.write(`  James ${i + 1}/15\r`);
  }
  console.log(`  James: 15 sessions ✓`);

  // ── Priya Sharma: 12 sessions, good progress ──────────────────────────────
  const priyaSessionIds: string[] = [];
  for (let i = 0; i < 12; i++) {
    const id = await createSession({
      clientId:       priya.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  12,
      daysAgoStart:   sessionDayOffset(12, i, 48),
      baseReward:     50,
      peakReward:     70,
      preFocus:       6,
      postFocusBase:  7,
      preMood:        6,
      postMoodBase:   7,
      preAnxiety:     5,
      postAnxietyBase: 4,
      preEnergy:      5,
      postEnergyBase: 7,
      notes: i === 0 ? "Baseline. Priya analytically engaged — asked detailed questions about fNIRS signal processing." :
             i === 11 ? "Priya reported completing a 14-hour shift with maintained focus throughout. Remarkable progress." : null,
      postNotes: i === 11 ? "My attending noticed I seemed sharper in afternoon rounds. That never used to happen." : null,
      tags: i === 0 ? ["baseline"] : i === 11 ? ["performance-peak"] : null,
    });
    priyaSessionIds.push(id);
    process.stdout.write(`  Priya ${i + 1}/12\r`);
  }
  console.log(`  Priya: 12 sessions ✓`);

  // ── Daniel Kim: 8 sessions, early progress ────────────────────────────────
  const danielSessionIds: string[] = [];
  for (let i = 0; i < 8; i++) {
    const id = await createSession({
      clientId:       daniel.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  8,
      daysAgoStart:   sessionDayOffset(8, i, 32),
      baseReward:     43,
      peakReward:     59,
      preFocus:       3,
      postFocusBase:  5,
      preMood:        6,
      postMoodBase:   7,
      preAnxiety:     4,
      postAnxietyBase: 3,
      preEnergy:      5,
      postEnergyBase: 6,
      notes: i === 0 ? "Baseline. Daniel curious and engaged; parent (Jennifer) present. Explained protocol in age-appropriate terms." :
             i === 7 ? "Jennifer reports Daniel completed homework without prompting 4 nights in a row — first time ever." : null,
      postNotes: i === 7 ? "It's actually kind of fun watching the brain bar go up." : null,
      tags: i === 0 ? ["baseline", "pediatric"] : i === 7 ? ["parent-report-milestone"] : null,
    });
    danielSessionIds.push(id);
    process.stdout.write(`  Daniel ${i + 1}/8\r`);
  }
  console.log(`  Daniel: 8 sessions ✓`);

  // ── Rachel Thompson: 6 sessions, early ───────────────────────────────────
  const rachelSessionIds: string[] = [];
  for (let i = 0; i < 6; i++) {
    const id = await createSession({
      clientId:       rachel.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  6,
      daysAgoStart:   sessionDayOffset(6, i, 24),
      baseReward:     45,
      peakReward:     56,
      preFocus:       3,
      postFocusBase:  4,
      preMood:        4,
      postMoodBase:   5,
      preAnxiety:     5,
      postAnxietyBase: 4,
      preEnergy:      3,
      postEnergyBase: 5,
      notes: i === 0 ? "Baseline. Rachel fatigued at arrival. Described brain fog as feeling 'like thinking through cotton wool'." :
             i === 5 ? "Rachel found the right word mid-sentence twice without pausing — noted it herself, visibly pleased." : null,
      tags: i === 0 ? ["baseline"] : i === 5 ? ["cognition-note"] : null,
    });
    rachelSessionIds.push(id);
    process.stdout.write(`  Rachel ${i + 1}/6\r`);
  }
  console.log(`  Rachel: 6 sessions ✓`);

  // ── Tyler Rodriguez: 4 sessions, just started ─────────────────────────────
  const tylerSessionIds: string[] = [];
  for (let i = 0; i < 4; i++) {
    const id = await createSession({
      clientId:       tyler.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  4,
      daysAgoStart:   sessionDayOffset(4, i, 16),
      baseReward:     45,
      peakReward:     52,
      preFocus:       5,
      postFocusBase:  6,
      preMood:        5,
      postMoodBase:   6,
      preAnxiety:     7,
      postAnxietyBase: 6,
      preEnergy:      4,
      postEnergyBase: 5,
      notes: i === 0 ? "Baseline. Tyler sceptical but open. Works late into night; agreed to trial a consistent sleep window." : null,
      tags: i === 0 ? ["baseline"] : null,
    });
    tylerSessionIds.push(id);
    process.stdout.write(`  Tyler ${i + 1}/4\r`);
  }
  console.log(`  Tyler: 4 sessions ✓`);

  // ── Amara Okafor: 2 sessions, onboarding ──────────────────────────────────
  const amaraSessionIds: string[] = [];
  for (let i = 0; i < 2; i++) {
    const id = await createSession({
      clientId:       amara.id,
      protocolId:     protocol.id,
      sessionIndex:   i,
      totalSessions:  2,
      daysAgoStart:   sessionDayOffset(2, i, 8),
      baseReward:     46,
      peakReward:     49,
      preFocus:       4,
      postFocusBase:  5,
      preMood:        6,
      postMoodBase:   6,
      preAnxiety:     5,
      postAnxietyBase: 4,
      preEnergy:      5,
      postEnergyBase: 6,
      notes: i === 0 ? "Baseline onboarding session. Amara found the bilateral fNIRS display fascinating; good first engagement." : null,
      tags: i === 0 ? ["baseline", "onboarding"] : null,
    });
    amaraSessionIds.push(id);
    process.stdout.write(`  Amara ${i + 1}/2\r`);
  }
  console.log(`  Amara: 2 sessions ✓`);

  // ── Sarah Mitchell: 1 session ─────────────────────────────────────────────
  const [sarahMSessionId] = [await createSession({
    clientId:       sarahM.id,
    protocolId:     protocol.id,
    sessionIndex:   0,
    totalSessions:  1,
    daysAgoStart:   3,
    baseReward:     51,
    peakReward:     51,
    preFocus:       7,
    postFocusBase:  8,
    preMood:        7,
    postMoodBase:   8,
    preAnxiety:     3,
    postAnxietyBase: 3,
    preEnergy:      7,
    postEnergyBase: 7,
    notes: "Baseline session. Sarah Mitchell (not same as clinician) is highly informed — has read fNIRS literature. " +
           "Excellent prefrontal baseline for her age. Establishing longitudinal tracking point.",
    tags: ["baseline", "cognitive-health"],
  })];
  console.log(`  Sarah Mitchell: 1 session ✓`);
  console.log(`  Noah Petersen: 0 sessions (enrolled, not started)\n`);

  // ── 7. Goals ───────────────────────────────────────────────────────────────

  const inSixWeeks    = daysAgo(-42);
  const inThreeMonths = daysAgo(-90);
  const inTenWeeks    = daysAgo(-70);
  const completed14d  = daysAgo(14);

  await db.insert(schema.goals).values([
    // Marcus Webb
    {
      clientId: marcus.id,
      title: "Achieve avg reward score ≥ 70 for 3 consecutive sessions",
      description: "Primary fNIRS outcome: sustained prefrontal upregulation.",
      targetDate: inSixWeeks,
      status: "achieved",
      completedAt: daysAgo(4),
    },
    {
      clientId: marcus.id,
      title: "Reduce self-reported pre-meeting anxiety to ≤ 3/10",
      description: "7-day rolling average anxiety ≤ 3/10 on daily check-in.",
      targetDate: inThreeMonths,
      status: "active",
    },
    // Elena Vasquez
    {
      clientId: elena.id,
      title: "Sleep through the night ≥ 5 of 7 nights",
      description: "Subjective sleep quality ≥ 8/10; sleep hours ≥ 7.",
      targetDate: inSixWeeks,
      status: "achieved",
      completedAt: daysAgo(5),
    },
    {
      clientId: elena.id,
      title: "Reduce GAD-7 score to below clinical threshold (< 10)",
      targetDate: inThreeMonths,
      status: "active",
    },
    // James O'Brien
    {
      clientId: james.id,
      title: "Achieve ≥ 6 hrs uninterrupted sleep consistently",
      description: "Co-measure with co-treating therapist Dr. Lim.",
      targetDate: inTenWeeks,
      status: "achieved",
      completedAt: daysAgo(2),
    },
    {
      clientId: james.id,
      title: "Reduce hypervigilance rating (self-report) to ≤ 3/10",
      targetDate: inThreeMonths,
      status: "active",
    },
    // Priya Sharma
    {
      clientId: priya.id,
      title: "Maintain focus score ≥ 8 post-session during 12+ hour shifts",
      description: "Self-report after clinical shifts exceeding 12 hours.",
      targetDate: inSixWeeks,
      status: "achieved",
      completedAt: daysAgo(6),
    },
    {
      clientId: priya.id,
      title: "Complete 12-session performance optimisation block",
      targetDate: completed14d,
      status: "achieved",
      completedAt: daysAgo(7),
    },
    // Daniel Kim
    {
      clientId: daniel.id,
      title: "Complete homework independently ≥ 4 nights per week",
      description: "Parent-reported outcome (Jennifer Kim).",
      targetDate: inSixWeeks,
      status: "active",
    },
    {
      clientId: daniel.id,
      title: "Avg reward score ≥ 55 within 10 sessions",
      targetDate: inTenWeeks,
      status: "active",
    },
  ]);
  console.log("Goals seeded ✓");

  // ── 8. Check-ins ───────────────────────────────────────────────────────────

  async function seedCheckIns(
    clientId: string,
    days: number,
    opts: {
      sleepBase: number;
      moodBase: number;
      anxietyBase: number;
      focusBase: number;
      energyBase: number;
      trend: number; // positive = improving over time
      lastNote?: string;
    }
  ) {
    for (let i = days - 1; i >= 0; i--) {
      const progress = (days - 1 - i) / (days - 1);
      const d = daysAgo(i);
      await db.insert(schema.checkIns).values({
        clientId,
        date: d,
        sleepHours:   round(opts.sleepBase + Math.random() * 1.5, 1),
        sleepQuality: clamp(Math.round(opts.moodBase   + progress * opts.trend * 2), 1, 10) as unknown as number,
        mood:         clamp(Math.round(opts.moodBase   + progress * opts.trend * 2), 1, 10) as unknown as number,
        anxiety:      clamp(Math.round(opts.anxietyBase - progress * opts.trend * 2), 1, 10) as unknown as number,
        focus:        clamp(Math.round(opts.focusBase  + progress * opts.trend * 2), 1, 10) as unknown as number,
        energy:       clamp(Math.round(opts.energyBase + progress * opts.trend * 1.5), 1, 10) as unknown as number,
        notes: i === 0 && opts.lastNote ? opts.lastNote : null,
      });
    }
  }

  await seedCheckIns(marcus.id, 14, {
    sleepBase: 6.5, moodBase: 5, anxietyBase: 7, focusBase: 5, energyBase: 5, trend: 1.2,
    lastNote: "Best week in months. Finished a complex feature at work without losing the thread.",
  });
  await seedCheckIns(elena.id, 10, {
    sleepBase: 7.0, moodBase: 5, anxietyBase: 8, focusBase: 5, energyBase: 5, trend: 1.0,
    lastNote: "Slept 8 hours three nights in a row. Tension headaches almost gone.",
  });
  await seedCheckIns(james.id, 8, {
    sleepBase: 5.5, moodBase: 4, anxietyBase: 7, focusBase: 4, energyBase: 4, trend: 0.8,
    lastNote: "Slept through the night Thursday. Mentioned it to Dr. Lim at our session.",
  });
  await seedCheckIns(priya.id, 7, {
    sleepBase: 7.5, moodBase: 6, anxietyBase: 4, focusBase: 7, energyBase: 6, trend: 0.7,
    lastNote: "Post-call recovery felt faster than usual. Felt sharp by early afternoon.",
  });
  await seedCheckIns(daniel.id, 6, {
    sleepBase: 8.5, moodBase: 7, anxietyBase: 4, focusBase: 5, energyBase: 7, trend: 0.8,
    lastNote: "Did homework without being asked twice this week. Mom said she cried.",
  });
  await seedCheckIns(rachel.id, 5, {
    sleepBase: 7.0, moodBase: 4, anxietyBase: 5, focusBase: 4, energyBase: 4, trend: 0.5,
    lastNote: "Word-finding a little easier this week. Still foggy in the mornings.",
  });
  await seedCheckIns(tyler.id, 5, {
    sleepBase: 6.0, moodBase: 5, anxietyBase: 7, focusBase: 5, energyBase: 5, trend: 0.4,
    lastNote: "Fell asleep within 45 min two nights this week — down from 2+ hours.",
  });
  await seedCheckIns(amara.id, 4, {
    sleepBase: 7.0, moodBase: 6, anxietyBase: 5, focusBase: 5, energyBase: 6, trend: 0.3,
  });
  console.log("Check-ins seeded ✓");

  // ── 9. SOAP Notes (top 5 clients, last 2–3 sessions each) ─────────────────

  // Marcus — last 3 sessions
  const marcusLast3 = marcusSessionIds.slice(-3);
  await db.insert(schema.soapNotes).values([
    {
      sessionId: marcusLast3[0],
      subjective: "Marcus reports sustained focus during a 3-hour deep work block earlier this week — first time in years. Mild restlessness at session start, resolved quickly.",
      objective:  "OxyHb L: +0.18 / R: +0.16 from baseline. Avg reward score 68.4. Consistent upward trend maintained throughout. No artefact epochs.",
      assessment: "Strong prefrontal activation. Client approaching discharge threshold. Reward scores now consistently in the high-performance band (65–75).",
      plan:       "Increase reward threshold from 0.05 to 0.06 next session. Discuss maintenance schedule (1x/month) in session 22.",
    },
    {
      sessionId: marcusLast3[1],
      subjective: "Best subjective report to date. Marcus described 'being in flow' during a product design sprint without music or noise cancelling.",
      objective:  "OxyHb L: +0.21 / R: +0.19. Avg reward 71.2. Theta/alpha ratio improved (theta ↓, alpha ↑ post-session). Minimal signal noise.",
      assessment: "Client has achieved primary goal (3 consecutive sessions ≥ 70). Neurophysiological markers support self-reported improvement.",
      plan:       "Final session next week. Complete outcome measure battery (GAD-7, ADHD-RS). Transition to monthly maintenance.",
    },
    {
      sessionId: marcusLast3[2],
      subjective: "Marcus arrived calm and confident. Reports he no longer uses white noise or focus apps at work. Office environment feels manageable.",
      objective:  "OxyHb L: +0.23 / R: +0.21 — highest bilateral oxygenation recorded. Avg reward 74.1. Session quality index: excellent.",
      assessment: "Discharge session. All three primary goals achieved. Subclinical anxiety and ADHD symptoms well-managed through prefrontal regulation.",
      plan:       "Monthly maintenance schedule established. Next appointment in 28 days. Client to continue daily check-ins for 2 more weeks.",
    },
  ]);

  // Elena — last 2 sessions
  const elenaLast2 = elenaSessionIds.slice(-2);
  await db.insert(schema.soapNotes).values([
    {
      sessionId: elenaLast2[0],
      subjective: "Elena reports 5 of 7 nights of uninterrupted sleep this week — goal achieved. Pre-sleep rumination 'much quieter than before'.",
      objective:  "OxyHb L: +0.14 / R: +0.13. Avg reward 65.8. Pre-session anxiety self-report: 5/10 (down from 8/10 at baseline).",
      assessment: "Sleep goal achieved. Anxiety reduction on track. Continued improvement in frontal upregulation across last 4 sessions.",
      plan:       "Add one GAD-7 administration next session. Discuss whether to continue weekly or step down to biweekly.",
    },
    {
      sessionId: elenaLast2[1],
      subjective: "Elena described last week as 'the best in 3 years'. Socialised without dreading the commute home. Tension headaches absent all week.",
      objective:  "OxyHb L: +0.16 / R: +0.15. Avg reward 68.9. Post-session anxiety 3/10. Bilateral signal quality excellent.",
      assessment: "Sustained improvement across all domains — sleep, anxiety, and headache frequency. Excellent candidate for step-down to biweekly.",
      plan:       "Transition to biweekly sessions. Administer GAD-7 at next visit. Recommend maintaining sleep hygiene habits.",
    },
  ]);

  // James — last 3 sessions
  const jamesLast3 = jamesSessionIds.slice(-3);
  await db.insert(schema.soapNotes).values([
    {
      sessionId: jamesLast3[0],
      subjective: "James describes hypervigilance as 'turned down — like a radio I can now adjust'. Reports Dr. Lim observed he seems more grounded in trauma processing sessions.",
      objective:  "OxyHb L: +0.12 / R: +0.11. Avg reward 58.4. Session marked by less baseline startle — client settled within 4 minutes (prev: 10+).",
      assessment: "Moderate but meaningful improvement in hyperarousal markers. Prefrontal regulation beginning to buffer amygdala reactivity. Good progress for PTSD presentation.",
      plan:       "Continue weekly. Coordinate with Dr. Lim re: trauma processing timeline. Consider adding HRV metric tracking.",
    },
    {
      sessionId: jamesLast3[1],
      subjective: "First session James initiated conversation unprompted — spoke about future plans (a road trip). Qualitative shift in affect.",
      objective:  "OxyHb L: +0.14 / R: +0.12. Avg reward 60.1. Beta reduction post-session (0.42 → 0.31) consistent with anxiety reduction.",
      assessment: "Prognostic indicators improving. James engaging with future-oriented thinking — significant shift from avoidance pattern at intake.",
      plan:       "Maintain weekly cadence. Introduce brief mindfulness exercise (2 min) before next session to extend downregulation window.",
    },
    {
      sessionId: jamesLast3[2],
      subjective: "James slept 7 hours straight on Thursday — first time in over two years. Arrived at session visibly more relaxed.",
      objective:  "OxyHb L: +0.17 / R: +0.15. Avg reward 61.8. Sleep goal formally achieved (confirmed by client log).",
      assessment: "Sleep milestone achieved. Combination of neurofeedback + trauma therapy producing cumulative benefit. Trajectory consistent with 6-month recovery arc.",
      plan:       "Continue biweekly. Request formal PTSD symptom update from Dr. Lim. Administer PCL-5 at session 18.",
    },
  ]);

  // Priya — last 2 sessions
  const priyaLast2 = priyaSessionIds.slice(-2);
  await db.insert(schema.soapNotes).values([
    {
      sessionId: priyaLast2[0],
      subjective: "Priya reports maintaining sharp clinical focus through a 14-hour trauma shift. Attending physician commented positively on her assessment speed.",
      objective:  "OxyHb L: +0.20 / R: +0.19. Avg reward 68.3. Most symmetrical bilateral activation recorded — L/R difference < 0.02.",
      assessment: "Excellent prefrontal upregulation. Bilateral symmetry suggests protocol is optimally calibrated for this client. Performance goals achieved ahead of schedule.",
      plan:       "Final session of 12-session block next week. Administer ADHD-RS for baseline comparison. Discuss optional 4-session maintenance block.",
    },
    {
      sessionId: priyaLast2[1],
      subjective: "Priya feels she has 'discovered a gear she didn't know she had'. Describes post-call recovery as faster and less disorienting.",
      objective:  "OxyHb L: +0.22 / R: +0.20. Avg reward 70.1 — highest in the 12-session block. Session quality excellent.",
      assessment: "Discharge from primary block. All performance targets achieved. Client demonstrates consistent high-quality prefrontal activation.",
      plan:       "Optional 4-session quarterly maintenance block offered and accepted. Next session in 3 months. Continue daily check-ins.",
    },
  ]);

  // Daniel — last 2 sessions
  const danielLast2 = danielSessionIds.slice(-2);
  await db.insert(schema.soapNotes).values([
    {
      sessionId: danielLast2[0],
      subjective: "Daniel reported completing all homework before dinner three nights this week. Parent Jennifer confirms and adds he was 'less explosive' when redirected.",
      objective:  "OxyHb L: +0.10 / R: +0.09. Avg reward 55.2. Signal quality good; some motion artefact at t=420s (corrected automatically).",
      assessment: "Positive early trajectory for paediatric ADHD. Prefrontal signals showing appropriate maturation response. Parent-reported behavioural improvement corroborates objective data.",
      plan:       "Continue twice-weekly. Coordinate with school counsellor for classroom observation report. Aim for avg reward ≥ 60 by session 12.",
    },
    {
      sessionId: danielLast2[1],
      subjective: "Daniel asked whether he could 'do a harder level next time' — self-motivated engagement. Reports school felt 'less loud and overwhelming' this week.",
      objective:  "OxyHb L: +0.12 / R: +0.10. Avg reward 57.8. Theta reduction noted (0.52 → 0.38) — consistent with ADHD protocol response.",
      assessment: "Theta reduction is a strong indicator of improving attentional regulation. Client engagement and self-awareness are excellent prognostic factors.",
      plan:       "Increase reward threshold slightly (0.05 → 0.055). Continue twice-weekly cadence. Reassess GAD for any comorbid anxiety at session 12.",
    },
  ]);
  console.log("SOAP notes seeded ✓");

  // ── 10. Outcome Measures ───────────────────────────────────────────────────

  // Marcus — GAD-7 (baseline vs current)
  await db.insert(schema.outcomeMeasures).values([
    {
      clientId:        marcus.id,
      administeredAt:  daysAgo(80),
      measureType:     "gad7",
      answers:         { q1: 3, q2: 3, q3: 2, q4: 3, q5: 2, q6: 2, q7: 2 },
      totalScore:      17,
      interpretation:  "moderate",
      notes:           "Baseline GAD-7 prior to neurofeedback. Score 17 = moderate anxiety.",
    },
    {
      clientId:        marcus.id,
      administeredAt:  daysAgo(5),
      measureType:     "gad7",
      answers:         { q1: 1, q2: 1, q3: 1, q4: 2, q5: 1, q6: 1, q7: 1 },
      totalScore:      8,
      interpretation:  "mild",
      notes:           "Post-treatment GAD-7. Score 8 = mild anxiety. 9-point reduction from baseline.",
    },
  ]);

  // Elena — GAD-7
  await db.insert(schema.outcomeMeasures).values([
    {
      clientId:        elena.id,
      administeredAt:  daysAgo(65),
      measureType:     "gad7",
      answers:         { q1: 3, q2: 3, q3: 3, q4: 2, q5: 3, q6: 2, q7: 3 },
      totalScore:      19,
      interpretation:  "severe",
      notes:           "Baseline. Score 19 = severe anxiety.",
    },
    {
      clientId:        elena.id,
      administeredAt:  daysAgo(3),
      measureType:     "gad7",
      answers:         { q1: 1, q2: 2, q3: 1, q4: 1, q5: 2, q6: 1, q7: 1 },
      totalScore:      9,
      interpretation:  "mild",
      notes:           "Post-treatment. Score 9 = mild. 10-point reduction; sub-threshold achieved.",
    },
  ]);

  // James — PHQ-9
  await db.insert(schema.outcomeMeasures).values([
    {
      clientId:        james.id,
      administeredAt:  daysAgo(55),
      measureType:     "phq9",
      answers:         { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 1, q7: 1, q8: 1, q9: 0 },
      totalScore:      13,
      interpretation:  "moderate",
      notes:           "Baseline PHQ-9. Moderate depression/PTSD overlap presentation.",
    },
    {
      clientId:        james.id,
      administeredAt:  daysAgo(2),
      measureType:     "phq9",
      answers:         { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 0, q7: 0, q8: 0, q9: 0 },
      totalScore:      5,
      interpretation:  "minimal",
      notes:           "Post-treatment PHQ-9. Score 5 = minimal. 8-point reduction.",
    },
  ]);

  // Daniel — ADHD-RS
  await db.insert(schema.outcomeMeasures).values([
    {
      clientId:        daniel.id,
      administeredAt:  daysAgo(30),
      measureType:     "adhd-rs",
      answers:         { q1: 3, q2: 3, q3: 2, q4: 3, q5: 3, q6: 2, q7: 2, q8: 3, q9: 2, q10: 2, q11: 1, q12: 1, q13: 1, q14: 1, q15: 1, q16: 1, q17: 1, q18: 1 },
      totalScore:      33,
      interpretation:  "moderate",
      notes:           "Baseline ADHD-RS (parent-rated). Score 33 — inattentive subscale elevated.",
    },
  ]);
  console.log("Outcome measures seeded ✓");

  // ── 11. Messages ───────────────────────────────────────────────────────────

  await db.insert(schema.messages).values([
    // Marcus thread
    {
      clientId:   marcus.id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "Hi Marcus — incredible session today. Your bilateral oxygenation hit a new high across both channels. How are you feeling post-session?",
    },
    {
      clientId:   marcus.id,
      clinicianId: clinician.id,
      senderRole: "client",
      body: "Honestly? Crystal clear. I finished the design sprint in one sitting. Haven't been able to do that in years. Whatever is happening in my brain — keep it up.",
    },
    {
      clientId:   marcus.id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "That's exactly what we're seeing in the data. You've officially hit your primary goal. Let's talk maintenance schedule at our next session. See you Tuesday!",
    },
    // Elena thread
    {
      clientId:   elena.id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "Elena, your check-in data this week is the best I've seen since you started. Five nights of solid sleep — how are the headaches?",
    },
    {
      clientId:   elena.id,
      clinicianId: clinician.id,
      senderRole: "client",
      body: "No headache since Tuesday. I keep waiting for them to come back, but they haven't. The evenings feel quiet now. I didn't know they could feel like that.",
    },
    // Daniel thread
    {
      clientId:   daniel.id,
      clinicianId: clinician.id,
      senderRole: "clinician",
      body: "Hi Jennifer — just wanted to share that Daniel's session today was his best yet. His theta activity dropped noticeably, which is a great sign for attentional regulation.",
    },
    {
      clientId:   daniel.id,
      clinicianId: clinician.id,
      senderRole: "client",
      body: "Thank you so much. He actually asked ME if he could do his session today. I almost fell over. We'll see you Thursday!",
    },
  ]);
  console.log("Messages seeded ✓");

  // ── Done ───────────────────────────────────────────────────────────────────

  const sessionTotals = {
    marcus: 22,
    elena:  18,
    james:  15,
    priya:  12,
    daniel: 8,
    rachel: 6,
    tyler:  4,
    amara:  2,
    sarahM: 1,
    noah:   0,
  };
  const totalSessions = Object.values(sessionTotals).reduce((a, b) => a + b, 0);
  const totalDataPoints = totalSessions * 1200;

  console.log("\n── Pacific Neurofeedback demo seeded successfully ─────────────────────\n");
  console.log(`  Clinic:       Pacific Neurofeedback`);
  console.log(`  Clinician:    Dr. Sarah Chen  (demo@eegbase.io / demo2026)`);
  console.log(`  Protocol:     fNIRS Prefrontal Upregulation (Mendi, 20 min)`);
  console.log(`  Clients:      10`);
  console.log(`  Sessions:     ${totalSessions} total (all Mendi fNIRS)`);
  console.log(`    Marcus Webb      22 sessions  (strong improvement)`);
  console.log(`    Elena Vasquez    18 sessions  (steady improvement)`);
  console.log(`    James O'Brien    15 sessions  (moderate improvement)`);
  console.log(`    Priya Sharma     12 sessions  (performance peak)`);
  console.log(`    Daniel Kim        8 sessions  (early progress)`);
  console.log(`    Rachel Thompson   6 sessions  (early)`);
  console.log(`    Tyler Rodriguez   4 sessions  (just started)`);
  console.log(`    Amara Okafor      2 sessions  (onboarding)`);
  console.log(`    Sarah Mitchell    1 session   (cognitive baseline)`);
  console.log(`    Noah Petersen     0 sessions  (enrolled)`);
  console.log(`  Data points:  ~${totalDataPoints.toLocaleString()} fNIRS/EEG samples`);
  console.log(`  Goals:        10 (mix of active and achieved)`);
  console.log(`  Check-ins:    14+10+8+7+6+5+5+4 = 59 entries`);
  console.log(`  SOAP notes:   3+2+3+2+2 = 12 (top 5 clients)`);
  console.log(`  Outcomes:     2 GAD-7 pairs + 2 PHQ-9 + 1 ADHD-RS`);
  console.log(`  Messages:     7 across 3 client threads`);
  console.log("\n  Login: demo@eegbase.io  /  demo2026\n");

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
