/**
 * EDF+ Export — GET /api/sessions/[id]/export/edf
 *
 * Returns the session data formatted as an EDF+ (European Data Format Plus)
 * binary file, which is the standard interchange format for biosignal data and
 * is accepted by EEG analysis suites such as EEGLAB, BrainVision Analyzer, and
 * MNE-Python.
 *
 * EDF+ structure
 * ──────────────
 * 1. Global header    — 256 bytes (fixed)
 * 2. Signal headers   — 256 bytes × n_signals (one block per signal)
 * 3. Data records     — n_data_records × (n_signals × n_samples_per_record × 2 bytes)
 *
 * Each sample is stored as a signed 16-bit integer (little-endian).  The
 * physical value is recovered by the reader using the linear formula:
 *
 *   physValue = digValue × (physMax - physMin) / (digMax - digMin)
 *             + (physMin × digMax - physMax × digMin) / (digMax - digMin)
 *
 * We invert this at write time:
 *
 *   digValue = (physValue - physMin) / (physMax - physMin) × 65535 - 32768
 *
 * Authentication
 * ──────────────
 * Requires a valid NextAuth session.  Ownership is verified by joining sessions
 * → clients on clinicId so cross-clinic access is impossible.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

// ── Signal descriptor ─────────────────────────────────────────────────────────

interface SignalDef {
  /** EDF signal label (max 16 chars) */
  label: string;
  /** Physical dimension string, e.g. "uM" or "uV" (max 8 chars) */
  dimension: string;
  /** Extract the raw value from a data point row */
  extract: (dp: DataPointRow) => number | null | undefined;
}

// Row type mirrors the columns we select from sessionDataPoints
interface DataPointRow {
  timestampMs: number;
  oxyHbLeft:   number | null;
  oxyHbRight:  number | null;
  deoxyHbLeft: number | null;
  deoxyHbRight:number | null;
  delta:       number | null;
  theta:       number | null;
  alpha:       number | null;
  beta:        number | null;
  gamma:       number | null;
  rewardScore: number | null;
  heartRate:   number | null;
  hrvRmssd:    number | null;
}

/** All candidate signals in export order. */
const SIGNAL_DEFS: SignalDef[] = [
  { label: "OxyHb Left",    dimension: "uM",    extract: (dp) => dp.oxyHbLeft    },
  { label: "OxyHb Right",   dimension: "uM",    extract: (dp) => dp.oxyHbRight   },
  { label: "DeoxyHb Left",  dimension: "uM",    extract: (dp) => dp.deoxyHbLeft  },
  { label: "DeoxyHb Right", dimension: "uM",    extract: (dp) => dp.deoxyHbRight },
  { label: "Delta",         dimension: "ratio", extract: (dp) => dp.delta        },
  { label: "Theta",         dimension: "ratio", extract: (dp) => dp.theta        },
  { label: "Alpha",         dimension: "ratio", extract: (dp) => dp.alpha        },
  { label: "Beta",          dimension: "ratio", extract: (dp) => dp.beta         },
  { label: "Gamma",         dimension: "ratio", extract: (dp) => dp.gamma        },
  { label: "RewardScore",   dimension: "score", extract: (dp) => dp.rewardScore  },
  { label: "HeartRate",     dimension: "BPM",   extract: (dp) => dp.heartRate    },
  { label: "HRV RMSSD",     dimension: "ms",    extract: (dp) => dp.hrvRmssd     },
];

// ── EDF header helpers ────────────────────────────────────────────────────────

/**
 * Write a fixed-width ASCII string into `buf` at `offset`, padding with spaces
 * and truncating to `len` bytes.  EDF headers use space-padded ASCII fields.
 */
function writeAscii(buf: Buffer, offset: number, value: string, len: number): void {
  const str = value.slice(0, len).padEnd(len, " ");
  buf.write(str, offset, len, "ascii");
}

/**
 * Clamp a value to the int16 range and write it as a little-endian signed
 * 16-bit integer at the given offset.
 */
function writeInt16LE(buf: Buffer, offset: number, value: number): void {
  const clamped = Math.max(-32768, Math.min(32767, Math.round(value)));
  buf.writeInt16LE(clamped, offset);
}

// ── EDF buffer builder ────────────────────────────────────────────────────────

interface ActiveSignal {
  def: SignalDef;
  physMin: number;
  physMax: number;
  /** Values per data record (= sample rate when record duration = 1 s) */
  samplesPerRecord: number;
  /** Pre-extracted value series, one entry per data point */
  series: number[];
}

function buildEdfBuffer(
  patientField: string,
  recordingField: string,
  startDate: Date,
  signals: ActiveSignal[],
  durationSeconds: number,
): Buffer {
  const nSignals = signals.length;
  // One data record per second
  const nDataRecords = Math.max(1, Math.ceil(durationSeconds));

  // ── Header sizes ────────────────────────────────────────────────────────
  const globalHeaderBytes = 256;
  const signalHeaderBytes = 256 * nSignals;
  const totalHeaderBytes  = globalHeaderBytes + signalHeaderBytes;

  // Total data size in bytes
  let dataBytes = 0;
  for (const sig of signals) {
    dataBytes += nDataRecords * sig.samplesPerRecord * 2;
  }

  const buf = Buffer.alloc(totalHeaderBytes + dataBytes, 0x20); // 0x20 = space

  // ── Global header (256 bytes) ────────────────────────────────────────────
  let offset = 0;

  // Version field: "0" for standard EDF, or "0       " (8 chars)
  writeAscii(buf, offset, "0", 8);       offset += 8;

  // Local patient identification (80 chars)
  writeAscii(buf, offset, patientField.slice(0, 80), 80); offset += 80;

  // Local recording identification (80 chars)
  writeAscii(buf, offset, recordingField.slice(0, 80), 80); offset += 80;

  // Start date of recording: dd.mm.yy (8 chars)
  const dd   = String(startDate.getUTCDate()).padStart(2, "0");
  const mm   = String(startDate.getUTCMonth() + 1).padStart(2, "0");
  const yy   = String(startDate.getUTCFullYear()).slice(-2);
  writeAscii(buf, offset, `${dd}.${mm}.${yy}`, 8); offset += 8;

  // Start time of recording: hh.mm.ss (8 chars)
  const hh   = String(startDate.getUTCHours()).padStart(2, "0");
  const min  = String(startDate.getUTCMinutes()).padStart(2, "0");
  const ss   = String(startDate.getUTCSeconds()).padStart(2, "0");
  writeAscii(buf, offset, `${hh}.${min}.${ss}`, 8); offset += 8;

  // Number of bytes in header record (8 chars)
  writeAscii(buf, offset, String(totalHeaderBytes), 8); offset += 8;

  // Reserved (44 chars) — "EDF+C" for EDF+Continuous
  writeAscii(buf, offset, "EDF+C", 44); offset += 44;

  // Number of data records (8 chars; -1 = unknown, but we know it)
  writeAscii(buf, offset, String(nDataRecords), 8); offset += 8;

  // Duration of each data record in seconds (8 chars)
  writeAscii(buf, offset, "1", 8); offset += 8;

  // Number of signals (4 chars)
  writeAscii(buf, offset, String(nSignals), 4); offset += 4;

  // Sanity check: we should be at byte 256
  if (offset !== 256) throw new Error(`Global header offset mismatch: ${offset}`);

  // ── Per-signal header fields (ns × 256 bytes total) ──────────────────────
  // Each field is written as a contiguous block of (field_width × ns) bytes.

  // Field widths per signal (sum = 256):
  // label=16, transducer=80, physDim=8, physMin=8, physMax=8,
  // digMin=8, digMax=8, prefilter=80, nSamples=8, reserved=32
  // Total = 16+80+8+8+8+8+8+80+8+32 = 256 ✓

  const sigBase = 256; // signal headers start at byte 256

  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + i * 16, signals[i].def.label, 16);
  }
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * 16 + i * 80, "Active electrode", 80);
  }
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * (16 + 80) + i * 8, signals[i].def.dimension, 8);
  }
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * (16 + 80 + 8) + i * 8, String(signals[i].physMin.toFixed(3)), 8);
  }
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * (16 + 80 + 8 + 8) + i * 8, String(signals[i].physMax.toFixed(3)), 8);
  }
  // digMin = -32768
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * (16 + 80 + 8 + 8 + 8) + i * 8, "-32768", 8);
  }
  // digMax = 32767
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * (16 + 80 + 8 + 8 + 8 + 8) + i * 8, "32767", 8);
  }
  // Prefilter (80 chars each) — leave as spaces (already filled)
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * (16 + 80 + 8 + 8 + 8 + 8 + 8) + i * 80, "None", 80);
  }
  // Samples per data record
  for (let i = 0; i < nSignals; i++) {
    writeAscii(buf, sigBase + nSignals * (16 + 80 + 8 + 8 + 8 + 8 + 8 + 80) + i * 8, String(signals[i].samplesPerRecord), 8);
  }
  // Reserved (32 chars each) — leave as spaces

  // ── Data records ─────────────────────────────────────────────────────────
  // EDF interleaves signals within each data record:
  //   [record 0: sig0 samples … sig1 samples … sigN samples …]
  //   [record 1: sig0 samples … …]

  let dataOffset = totalHeaderBytes;

  const DIG_MIN =  -32768;
  const DIG_MAX =   32767;

  for (let rec = 0; rec < nDataRecords; rec++) {
    for (const sig of signals) {
      const { samplesPerRecord, physMin, physMax, series } = sig;
      const physRange = physMax - physMin;

      for (let s = 0; s < samplesPerRecord; s++) {
        // Map the sample index to the overall series index
        const seriesIdx = rec * samplesPerRecord + s;
        const physVal   = seriesIdx < series.length ? series[seriesIdx] : physMin;

        let digVal: number;
        if (physRange === 0) {
          digVal = 0;
        } else {
          // Linear scaling: physMin → DIG_MIN, physMax → DIG_MAX
          digVal = ((physVal - physMin) / physRange) * (DIG_MAX - DIG_MIN) + DIG_MIN;
        }

        writeInt16LE(buf, dataOffset, digVal);
        dataOffset += 2;
      }
    }
  }

  return buf;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clinicId = (session.user as { clinicId?: string }).clinicId ?? "";

  // ── Load session row (verifying ownership via clients.clinicId) ───────────
  const [row] = await db
    .select({
      id:              sessions.id,
      startedAt:       sessions.startedAt,
      durationSeconds: sessions.durationSeconds,
      clientName:      clients.name,
    })
    .from(sessions)
    .innerJoin(
      clients,
      and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)),
    )
    .where(eq(sessions.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ── Load data points ──────────────────────────────────────────────────────
  const dataPoints = await db
    .select({
      timestampMs:  sessionDataPoints.timestampMs,
      oxyHbLeft:    sessionDataPoints.oxyHbLeft,
      oxyHbRight:   sessionDataPoints.oxyHbRight,
      deoxyHbLeft:  sessionDataPoints.deoxyHbLeft,
      deoxyHbRight: sessionDataPoints.deoxyHbRight,
      delta:        sessionDataPoints.delta,
      theta:        sessionDataPoints.theta,
      alpha:        sessionDataPoints.alpha,
      beta:         sessionDataPoints.beta,
      gamma:        sessionDataPoints.gamma,
      rewardScore:  sessionDataPoints.rewardScore,
      heartRate:    sessionDataPoints.heartRate,
      hrvRmssd:     sessionDataPoints.hrvRmssd,
    })
    .from(sessionDataPoints)
    .where(eq(sessionDataPoints.sessionId, id))
    .orderBy(asc(sessionDataPoints.timestampMs));

  if (dataPoints.length === 0) {
    return NextResponse.json(
      { error: "No data points found for this session" },
      { status: 422 },
    );
  }

  // ── Determine session duration ────────────────────────────────────────────
  const firstMs   = dataPoints[0].timestampMs;
  const lastMs    = dataPoints[dataPoints.length - 1].timestampMs;
  const spanMs    = lastMs - firstMs;
  const durationSeconds = row.durationSeconds ?? Math.max(1, Math.ceil(spanMs / 1000));

  // ── Compute effective sample rate (capped at 256 Hz, minimum 1 Hz) ────────
  const rawRate = durationSeconds > 0 ? dataPoints.length / durationSeconds : 1;
  const sampleRate = Math.max(1, Math.min(256, Math.round(rawRate)));

  // ── Build active signal list (only signals with at least one non-null value) ─
  const activeSignals: ActiveSignal[] = [];

  for (const def of SIGNAL_DEFS) {
    const values: number[] = [];
    for (const dp of dataPoints) {
      const v = def.extract(dp as DataPointRow);
      if (v != null) values.push(v);
    }
    if (values.length === 0) continue; // skip signals with no data

    // Compute physical range from actual data; guard against flat signals
    let physMin = Math.min(...values);
    let physMax = Math.max(...values);
    if (physMin === physMax) {
      physMin -= 1;
      physMax += 1;
    }

    // Build the full series, substituting physMin for missing samples
    const series: number[] = dataPoints.map((dp) => {
      const v = def.extract(dp as DataPointRow);
      return v != null ? v : physMin;
    });

    activeSignals.push({
      def,
      physMin,
      physMax,
      samplesPerRecord: sampleRate,
      series,
    });
  }

  if (activeSignals.length === 0) {
    return NextResponse.json(
      { error: "Session contains no exportable signal data" },
      { status: 422 },
    );
  }

  // ── Compose EDF header fields ─────────────────────────────────────────────
  // Patient field: use initials only for privacy (EDF+ recommendation)
  const initials = row.clientName
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 10);

  // EDF+ patient field format: "code name sex birthdate"
  const patientField  = `${initials} X X X`;
  const recordingField = `Startdate ${row.startedAt.toISOString().slice(0, 10)} EEGBase ${id.slice(0, 8)}`;

  // ── Build binary buffer ───────────────────────────────────────────────────
  const edfBuf = buildEdfBuffer(
    patientField,
    recordingField,
    row.startedAt,
    activeSignals,
    durationSeconds,
  );

  // ── Return file ───────────────────────────────────────────────────────────
  // Convert Buffer to Uint8Array so NextResponse accepts it as BodyInit
  return new NextResponse(new Uint8Array(edfBuf), {
    headers: {
      "Content-Type":        "application/octet-stream",
      "Content-Disposition": `attachment; filename="session-${id.slice(0, 8)}.edf"`,
      "Content-Length":      String(edfBuf.byteLength),
    },
  });
}
