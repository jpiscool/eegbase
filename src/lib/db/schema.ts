import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  real,
  jsonb,
  boolean,
  smallint,
} from "drizzle-orm/pg-core";

// ── Clinics ──────────────────────────────────────────────────────────────────
export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  webhookUrl: text("webhook_url"),  // POSTed after each session is saved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Clinicians ────────────────────────────────────────────────────────────────
export const clinicians = pgTable("clinicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id)
    .notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("clinician"), // clinician | admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Clients ───────────────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id)
    .notNull(),
  clinicianId: uuid("clinician_id")
    .references(() => clinicians.id)
    .notNull(),
  name: text("name").notNull(),
  email: text("email"),
  dateOfBirth: timestamp("date_of_birth"),
  notes: text("notes"),
  goals: text("goals"),                          // client's training goals
  active: boolean("active").notNull().default(true),
  reportToken: text("report_token").unique(),    // public share link token
  checkInToken: text("check_in_token").unique(), // public client check-in link token
  aiSummary: text("ai_summary"),                 // AI-generated longitudinal progress summary
  aiSummaryUpdatedAt: timestamp("ai_summary_updated_at"), // when the summary was last generated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Protocols ─────────────────────────────────────────────────────────────────
export const protocols = pgTable("protocols", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  deviceType: text("device_type").notNull().default("mendi"), // mendi | muse | simulator
  durationSeconds: integer("duration_seconds").notNull().default(1200),
  parameters: jsonb("parameters"), // device-specific config
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Client Protocol Assignments ───────────────────────────────────────────────
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  protocolId: uuid("protocol_id")
    .references(() => protocols.id)
    .notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  active: boolean("active").notNull().default(true),
});

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  protocolId: uuid("protocol_id").references(() => protocols.id),
  deviceType: text("device_type").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  avgRewardScore: real("avg_reward_score"),
  notes: text("notes"),
  // Pre-session questionnaire (1–10 scales)
  preFocus: smallint("pre_focus"),
  preMood: smallint("pre_mood"),
  preAnxiety: smallint("pre_anxiety"),
  preEnergy: smallint("pre_energy"),
  // Post-session questionnaire
  postFocus: smallint("post_focus"),
  postMood: smallint("post_mood"),
  postAnxiety: smallint("post_anxiety"),
  postEnergy: smallint("post_energy"),
  postNotes: text("post_notes"),
  aiSummary: text("ai_summary"),
  tags: text("tags").array(),  // clinician-assigned labels, e.g. ["baseline","week-4"]
});

// ── Session Data Points ───────────────────────────────────────────────────────
export const sessionDataPoints = pgTable("session_data_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => sessions.id)
    .notNull(),
  timestampMs: integer("timestamp_ms").notNull(),
  oxyHbLeft: real("oxy_hb_left"),
  oxyHbRight: real("oxy_hb_right"),
  deoxyHbLeft: real("deoxy_hb_left"),
  deoxyHbRight: real("deoxy_hb_right"),
  delta: real("delta"),
  theta: real("theta"),
  alpha: real("alpha"),
  beta: real("beta"),
  gamma: real("gamma"),
  rewardScore: real("reward_score"),
  raw: jsonb("raw"),
});

// ── Client Goals / Milestones ─────────────────────────────────────────────────
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("active"), // active | achieved | paused | cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Client Messages ───────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  clinicianId: uuid("clinician_id")
    .references(() => clinicians.id)
    .notNull(),
  senderRole: text("sender_role").notNull(), // clinician | client
  body: text("body").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Symptom Check-ins (daily lifestyle tracking) ──────────────────────────────
export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  date: timestamp("date").defaultNow().notNull(),
  sleepHours: real("sleep_hours"),
  sleepQuality: smallint("sleep_quality"),   // 1–10
  mood: smallint("mood"),                    // 1–10
  anxiety: smallint("anxiety"),              // 1–10
  focus: smallint("focus"),                  // 1–10
  energy: smallint("energy"),                // 1–10
  notes: text("notes"),
});
