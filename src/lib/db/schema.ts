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
  referralSource: text("referral_source"),       // how client found the clinic
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
  heartRate: real("heart_rate"),   // BPM (HRV source)
  hrvRmssd: real("hrv_rmssd"),     // RMSSD ms — HRV coherence metric
  // ── Mendi auxiliary fields (decoded from V4 Frame protobuf) ──────────────
  // All optional so legacy rows and non-Mendi devices stay null.
  temperatureC: real("temperature_c"),       // scalp temperature °C
  accelMag: real("accel_mag"),               // |a| in g (1.0 at rest)
  accelX: real("accel_x"),                   // accelerometer X axis, g
  accelY: real("accel_y"),                   // accelerometer Y axis, g
  accelZ: real("accel_z"),                   // accelerometer Z axis, g
  stillness: real("stillness"),              // 0-100 derived
  pulsePpg: real("pulse_ppg"),               // AC-coupled forehead PPG
  pulseHrBpm: real("pulse_hr_bpm"),          // BPM from pulse optode
  pulseHrvRmssd: real("pulse_hrv_rmssd"),    // RMSSD ms from pulse-optode IBIs
  signalQualityL: real("signal_quality_l"),  // 0-100 left optode SNR
  signalQualityR: real("signal_quality_r"),  // 0-100 right optode SNR
  signalQualityP: real("signal_quality_p"),  // 0-100 pulse optode SNR
  ambientLevel: real("ambient_level"),       // 0-100 ambient light interference
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

// ── CPT (Continuous Performance Test) Results ─────────────────────────────────
export const cptResults = pgTable("cpt_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  administeredAt: timestamp("administered_at").defaultNow().notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  totalStimuli: integer("total_stimuli").notNull(),
  targetCount: integer("target_count").notNull(),
  hits: integer("hits").notNull(),
  misses: integer("misses").notNull(),
  falseAlarms: integer("false_alarms").notNull(),
  avgReactionTimeMs: integer("avg_reaction_time_ms"),
  accuracy: real("accuracy").notNull(),
  notes: text("notes"),
});

// ── Appointments / Scheduling ─────────────────────────────────────────────────
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  clinicianId: uuid("clinician_id")
    .references(() => clinicians.id)
    .notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  title: text("title").notNull().default("Neurofeedback Session"),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // scheduled | completed | cancelled | no_show
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── ERP / P300 Results ────────────────────────────────────────────────────────
export const erpResults = pgTable("erp_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  administeredAt: timestamp("administered_at").defaultNow().notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  totalTrials: integer("total_trials").notNull(),
  targetCount: integer("target_count").notNull(),    // rare stimuli count
  hits: integer("hits").notNull(),                   // correct detections
  misses: integer("misses").notNull(),               // missed targets
  falseAlarms: integer("false_alarms").notNull(),    // responses to non-targets
  avgReactionTimeMs: integer("avg_reaction_time_ms"),
  accuracy: real("accuracy").notNull(),              // hits / targetCount * 100
  notes: text("notes"),
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

// ── SOAP Session Notes ────────────────────────────────────────────────────────
export const soapNotes = pgTable("soap_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => sessions.id)
    .notNull()
    .unique(),
  subjective: text("subjective"),    // client self-report
  objective: text("objective"),      // clinician observations (EEG/fNIRS data)
  assessment: text("assessment"),    // clinical interpretation
  plan: text("plan"),                // next session plan / protocol adjustments
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Outcome Measures (standardised questionnaires) ────────────────────────────
export const outcomeMeasures = pgTable("outcome_measures", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  administeredAt: timestamp("administered_at").defaultNow().notNull(),
  measureType: text("measure_type").notNull(), // adhd-rs | gad7 | phq9 | conners
  answers: jsonb("answers").notNull(),          // { q1: 3, q2: 2, ... }
  totalScore: integer("total_score").notNull(),
  interpretation: text("interpretation"),       // minimal/mild/moderate/severe
  notes: text("notes"),
});

// ── Session Annotations (live event stamps) ───────────────────────────────────
export const sessionAnnotations = pgTable("session_annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => sessions.id)
    .notNull(),
  timestampMs: integer("timestamp_ms").notNull(),  // ms from session start
  label: text("label").notNull(),
  category: text("category").notNull().default("note"), // observation | protocol | artefact | note
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Invoices / Billing ────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  sessionId: uuid("session_id")
    .references(() => sessions.id),  // nullable
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  amountCents: integer("amount_cents").notNull(),  // stored in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("draft"), // draft | sent | paid | waived
  description: text("description").notNull().default("Neurofeedback Session"),
  cptCode: text("cpt_code"),            // e.g. "97532" (neurofeedback CPT)
  icd10Code: text("icd10_code"),        // diagnosis code for superbill
  renderingProvider: text("rendering_provider"), // provider name for superbill
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Treatment Plans ───────────────────────────────────────────────────────────
export const treatmentPlans = pgTable("treatment_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  protocolId: uuid("protocol_id").references(() => protocols.id),
  presentingConcerns: text("presenting_concerns"),
  targetSessionCount: integer("target_session_count"),  // planned number of sessions
  sessionFrequency: text("session_frequency"),          // e.g. "2x/week"
  outcomeMeasures: text("outcome_measures").array(),    // e.g. ["adhd-rs", "gad7"]
  decisionRules: text("decision_rules"),                // when to adjust protocol
  goals: text("goals"),
  status: text("status").notNull().default("active"),   // active | completed | paused
  startDate: timestamp("start_date").defaultNow().notNull(),
  reviewDate: timestamp("review_date"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Consumables Inventory ─────────────────────────────────────────────────────
export const consumables = pgTable("consumables", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id)
    .notNull(),
  name: text("name").notNull(),             // e.g. "Electrode Gel"
  unit: text("unit").notNull().default("units"), // e.g. "ml", "pack", "units"
  currentStock: integer("current_stock").notNull().default(0),
  parLevel: integer("par_level").notNull().default(10), // alert threshold
  usagePerSession: real("usage_per_session"),           // decrement per session
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Audit Logs (HIPAA PHI access tracking) ───────────────────────────────────
// NOTE: clinic_id / clinician_id are intentionally NOT FK-constrained.
// The original schema had `.references(() => clinics.id)` but clinics.id is
// uuid while these columns are text, so Postgres refused the FK. We rely
// on the auth-scoped insert path (logAuditEvent) for referential integrity.
// Audit logs are append-only; a dangling reference is preferable to losing
// an audit event because a clinician row was deleted.
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clinicId: text("clinic_id").notNull(),
  clinicianId: text("clinician_id"),
  clinicianName: text("clinician_name"), // stored at time of event for history
  action: text("action").notNull(), // e.g. "client.viewed", "session.exported", "client.created"
  resourceType: text("resource_type"), // "client", "session", "protocol", "invoice"
  resourceId: text("resource_id"),
  resourceLabel: text("resource_label"), // e.g. client name at time of access
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
