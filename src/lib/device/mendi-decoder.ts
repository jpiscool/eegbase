/**
 * Pure Mendi packet decoder — no I/O, no BLE, just bytes → DeviceSample.
 *
 * Reverse-engineered from a real Mendi V4 (firmware 1.0.2) on 2026-05-13
 * and cross-validated against the public `eugenehp/mendi` Rust crate's
 * `device_v4.proto` schema. See AUDIT-2026-MENDI-BLE-PROTOCOL.md for full
 * capture + schema-lock details.
 *
 * Mendi sends fNIRS data over the Frame characteristic
 * `fc3eabb1-c6c4-49e6-922a-6e551c455af5` at ~31.2 Hz, encoded as
 * Google Protocol Buffers wire-format messages of ~105 bytes.
 *
 * The protobuf is the `mendi.Frame` message — 16 optional fields carrying:
 *   - 3-axis accelerometer (fields 1-3, int16 LSB at ±2g)
 *   - 3-axis gyroscope     (fields 4-6, int16 LSB at ±125 dps)
 *   - scalp temperature    (field 7,  float32 °C)
 *   - 3 raw photodiode triplets — left / right / pulse optodes (fields
 *     8-16) for IR (940 nm), RED (660 nm), and AMBIENT (LED off) channels
 *
 * Mendi sends ONLY raw photodiode counts. There is no pre-computed ΔHb in
 * the wire format — Beer-Lambert (or in our case, a simplified ratio
 * proxy) runs client-side. Output ΔHbO/ΔHHb values are unitless relative
 * changes scaled by an empirical SCALE constant; they are monotonic with
 * true μM but NOT actually in μM. True μM calibration would need molar
 * extinction coefficients, DPF, optode geometry, and the Calibration
 * characteristic (0xABB6) — none yet wired.
 */

import type { DeviceSample } from "./adapter";

// ── Field mapping ──────────────────────────────────────────────────────────
// Per the Mendi V4 .proto schema (eugenehp/mendi/proto/device_v4.proto):
//   1: acc_x  (int32)   accelerometer
//   2: acc_y
//   3: acc_z
//   4: ang_x  (int32)   gyroscope
//   5: ang_y
//   6: ang_z
//   7: temp   (float)   skin/scalp temperature in °C
//   8: ir_l   (int32)   left IR (≈940 nm) raw photodiode count
//   9: red_l  (int32)   left RED (≈660 nm) raw photodiode count
//  10: amb_l  (int32)   left AMBIENT (LED off) photodiode count — for noise correction
//  11: ir_r              right site
//  12: red_r
//  13: amb_r
//  14: ir_p              pulse channel (forehead vs ear, depending on optode)
//  15: red_p
//  16: amb_p
//
// HbO/HHb derivation (modified Beer-Lambert):
//   HbO ↑ → red light (660 nm) absorbed more → red_l count drops
//   HHb ↑ → IR light  (940 nm) absorbed more → ir_l  count drops
// Subtracting amb_l corrects for ambient drift.

export const MENDI_FIELDS = {
  ACC_X: 1, ACC_Y: 2, ACC_Z: 3,
  ANG_X: 4, ANG_Y: 5, ANG_Z: 6,
  TEMPERATURE: 7,
  IR_L: 8,  RED_L: 9,  AMB_L: 10,
  IR_R: 11, RED_R: 12, AMB_R: 13,
  IR_P: 14, RED_P: 15, AMB_P: 16,
} as const;

// ── Decoder ────────────────────────────────────────────────────────────────

export class MendiPacketDecoder {
  /** Last seen sequence number (for packet-loss detection). */
  lastSeq: number | null = null;

  /** Number of dropped packets observed since construction. */
  droppedPackets = 0;

  /**
   * Decode a single GATT notification payload.
   * Returns null on malformed input (caller should NOT throw).
   */
  decode(view: DataView): DeviceSample | null {
    if (view.byteLength < 4) return null;

    const fields = this._decodeProtobuf(view);
    if (fields === null) return null;

    // Pull the six per-site raw photodiode counts.
    const irL = numericField(fields, MENDI_FIELDS.IR_L);
    const redL = numericField(fields, MENDI_FIELDS.RED_L);
    const ambL = numericField(fields, MENDI_FIELDS.AMB_L);
    const irR = numericField(fields, MENDI_FIELDS.IR_R);
    const redR = numericField(fields, MENDI_FIELDS.RED_R);
    const ambR = numericField(fields, MENDI_FIELDS.AMB_R);

    // Ambient-corrected light counts (subtract ambient noise).
    const irLcor = irL != null && ambL != null ? irL - ambL : undefined;
    const redLcor = redL != null && ambL != null ? redL - ambL : undefined;
    const irRcor = irR != null && ambR != null ? irR - ambR : undefined;
    const redRcor = redR != null && ambR != null ? redR - ambR : undefined;

    // Establish baselines on first packet of the session.
    if (irLcor != null && this._baselineIrL == null) this._baselineIrL = irLcor;
    if (redLcor != null && this._baselineRedL == null) this._baselineRedL = redLcor;
    if (irRcor != null && this._baselineIrR == null) this._baselineIrR = irRcor;
    if (redRcor != null && this._baselineRedR == null) this._baselineRedR = redRcor;

    // Compute ΔHb proxies from intensity ratios. When tissue absorbs more
    // of a wavelength, the photodiode count drops, so we negate.
    //   HbO ↑  ⇒  red intensity drops  ⇒  oxyHb proxy =  -(red - baseline)/baseline
    //   HHb ↑  ⇒  IR intensity drops   ⇒  deoxyHb proxy = -(ir  - baseline)/baseline
    //
    // IMPORTANT: this is a unitless relative-change ratio, NOT modified
    // Beer-Lambert. Real μM calibration would need per-wavelength molar
    // extinction coefficients, differential pathlength factor (DPF), and
    // source-detector separation — none of which are wired yet. The output
    // is monotonic with true ΔHbO/ΔHHb so direction is meaningful, but the
    // magnitude is on an empirical scale, not μM. See AUDIT-2026-MENDI-BLE-
    // PROTOCOL.md and scripts/mendi-capture/validation-runbook.md (Note on
    // units) for the full caveats.
    const SCALE = 10;
    const oxyHbLeft =
      redLcor != null && this._baselineRedL && this._baselineRedL !== 0
        ? -((redLcor - this._baselineRedL) / this._baselineRedL) * SCALE
        : undefined;
    const oxyHbRight =
      redRcor != null && this._baselineRedR && this._baselineRedR !== 0
        ? -((redRcor - this._baselineRedR) / this._baselineRedR) * SCALE
        : undefined;
    const deoxyHbLeft =
      irLcor != null && this._baselineIrL && this._baselineIrL !== 0
        ? -((irLcor - this._baselineIrL) / this._baselineIrL) * SCALE
        : undefined;
    const deoxyHbRight =
      irRcor != null && this._baselineIrR && this._baselineIrR !== 0
        ? -((irRcor - this._baselineIrR) / this._baselineIrR) * SCALE
        : undefined;

    // Reward score: track DEVIATION of current HbO from a slow rolling
    // baseline, not absolute HbO. This adapts to whatever steady-state
    // the user is at — Beer-Lambert baseline drift (e.g. headband not
    // initially worn flush on skin) produces HbO values in the +5..+10
    // range at rest, which would peg any absolute-magnitude reward at 100.
    //
    // EMA with α=0.005 ≈ 200-sample (≈ 6 s at 31 Hz) baseline window.
    // Reward rises ~10 pts per 1-unit HbO above baseline; falls below.
    // Clamped 0–100 and floored at 50 when no baseline yet so the gauge
    // starts neutral.
    const meanOxy = [oxyHbLeft, oxyHbRight].filter((v) => v != null) as number[];
    let rewardScore: number | undefined;
    if (meanOxy.length > 0) {
      const currentHbo = meanOxy.reduce((a, b) => a + b, 0) / meanOxy.length;
      if (this._rewardHboEma == null) {
        this._rewardHboEma = currentHbo;
        rewardScore = 50;
      } else {
        const dev = currentHbo - this._rewardHboEma;
        this._rewardHboEma = this._rewardHboEma * 0.995 + currentHbo * 0.005;
        rewardScore = Math.min(100, Math.max(0, 50 + dev * 15));
      }
    }

    // ── Mendi auxiliary derivations ──────────────────────────────────────
    // Everything below uses raw protobuf fields that the original decoder
    // discarded. None of it affects oxyHb*/deoxyHb*/rewardScore above.

    // Scalp temperature — float32 °C, straight passthrough.
    const tempRaw = numericField(fields, MENDI_FIELDS.TEMPERATURE);
    const temperatureC =
      tempRaw != null && tempRaw > 0 && tempRaw < 60 ? tempRaw : undefined;

    // Accelerometer magnitude in g. Mendi V4 IMU is int16 LSB at ±2g
    // (16384 LSB = 1g). At rest the headband sits on a head with gravity
    // primarily on one axis, so |a| ≈ 1.0.
    const ax = numericField(fields, MENDI_FIELDS.ACC_X);
    const ay = numericField(fields, MENDI_FIELDS.ACC_Y);
    const az = numericField(fields, MENDI_FIELDS.ACC_Z);
    let accelMag: number | undefined;
    let accelX: number | undefined;
    let accelY: number | undefined;
    let accelZ: number | undefined;
    if (ax != null && ay != null && az != null) {
      accelMag = Math.sqrt(ax * ax + ay * ay + az * az) / 16384;
      accelX = ax / 16384;
      accelY = ay / 16384;
      accelZ = az / 16384;
    }

    // Stillness 0–100. We track the deviation of |a| from the per-session
    // resting magnitude over a rolling window of ~3 s (≈100 samples at 31 Hz)
    // and map small deviations to high stillness scores. A motion spike
    // drops the score; sustained calm rises it back.
    let stillness: number | undefined;
    if (accelMag != null) {
      this._accelHistory.push(accelMag);
      if (this._accelHistory.length > 100) this._accelHistory.shift();
      if (this._accelRest == null) this._accelRest = accelMag;
      // Exponentially track resting magnitude (slow). Motion deviates from it.
      this._accelRest = this._accelRest * 0.98 + accelMag * 0.02;
      const dev = Math.abs(accelMag - this._accelRest);
      // 0.02 g (~typical micro-tremor) → 100, 0.30 g (head shake) → 0.
      stillness = Math.max(0, Math.min(100, 100 - (dev / 0.30) * 100));
    }

    // Pulse photoplethysmogram (PPG): the forehead pulse optode picks up
    // cardiac-driven blood-volume oscillation. ir_p minus amb_p removes
    // ambient DC. We then high-pass via subtraction of a sliding-window
    // mean (~3 s) so the output is centred near 0 with only the AC
    // (heartbeat) component surviving.
    //
    // The previous slow-EMA approach didn't track DC drift fast enough
    // on real hardware — pulsePpg ended up offset by several thousand
    // counts, preventing the zero-crossing HR detector from firing.
    // A short window (~90 samples = 3 s @ 31 Hz) covers > 1 cardiac
    // cycle but is fast enough to track baseline shifts.
    const irP = numericField(fields, MENDI_FIELDS.IR_P);
    const ambP = numericField(fields, MENDI_FIELDS.AMB_P);
    let pulsePpg: number | undefined;
    if (irP != null && ambP != null) {
      const corrected = irP - ambP;
      this._pulseWindow.push(corrected);
      if (this._pulseWindow.length > 90) this._pulseWindow.shift();
      const mean =
        this._pulseWindow.reduce((a, b) => a + b, 0) / this._pulseWindow.length;
      pulsePpg = corrected - mean;
    }

    // Heart rate from PPG: zero-crossing peak detector on the AC signal.
    // We track time between successive upward crossings; the rolling
    // average of inter-beat intervals → BPM. Bounded to 35–180 BPM
    // physiological range. Stays undefined until ≥ 3 beats have arrived.
    //
    // Refractory period: ignore zero-crossings within 333 ms of the last
    // beat — at 180 BPM the IBI is 333 ms, so anything shorter is noise
    // (double-detection on a rising edge). Previously we kept the short
    // IBI in the history, which polluted RMSSD.
    let pulseHrBpm: number | undefined;
    if (pulsePpg != null) {
      const nowMs = Date.now();
      const prev = this._pulsePrev;
      this._pulsePrev = pulsePpg;
      if (prev != null && prev <= 0 && pulsePpg > 0) {
        const last = this._lastBeatMs;
        if (last == null) {
          this._lastBeatMs = nowMs;
        } else {
          const ibi = nowMs - last;
          // Hard physiological gate: only accept IBIs in [333, 1714] ms.
          // Anything outside that window is rejected as noise — and we
          // do NOT advance _lastBeatMs in that case, so the next valid
          // beat measures from the previous good beat.
          if (ibi >= 333 && ibi <= 1714) {
            this._ibiHistory.push(ibi);
            if (this._ibiHistory.length > 8) this._ibiHistory.shift();
            this._lastBeatMs = nowMs;
          }
        }
      }
      if (this._ibiHistory.length >= 3) {
        const meanIbi =
          this._ibiHistory.reduce((a, b) => a + b, 0) / this._ibiHistory.length;
        pulseHrBpm = Math.round(60000 / meanIbi);
      }
    }

    // HRV — RMSSD of successive inter-beat-interval differences. Standard
    // short-term HRV metric used in autonomic-state monitoring. Higher
    // RMSSD = more parasympathetic activity = calmer state. Needs at
    // least 4 IBIs to compute 3 successive differences.
    //
    // Outlier rejection: a single false beat detection can produce an
    // IBI half the median; the (this_ibi - prev_ibi)² term then blows up
    // RMSSD to physiologically impossible values (>400 ms). We filter
    // the IBI history to entries within ±30% of the median before
    // computing differences. Physiological HRV variability is typically
    // a few percent of IBI, so a 30% threshold is generous but still
    // catches gross outliers.
    let pulseHrvRmssd: number | undefined;
    if (this._ibiHistory.length >= 4) {
      const sorted = [...this._ibiHistory].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const lo = median * 0.7;
      const hi = median * 1.3;
      const filtered = this._ibiHistory.filter((ibi) => ibi >= lo && ibi <= hi);
      if (filtered.length >= 4) {
        let sumSq = 0;
        for (let i = 1; i < filtered.length; i++) {
          const d = filtered[i] - filtered[i - 1];
          sumSq += d * d;
        }
        pulseHrvRmssd = Math.round(
          Math.sqrt(sumSq / (filtered.length - 1))
        );
      }
    }

    // Per-optode signal quality: magnitude of (red − amb) relative to the
    // ambient noise floor, scaled 0–100. A well-coupled optode produces a
    // large |red − amb| compared to |amb|. A loose optode → ratio collapses.
    //
    // Previous version used max(0, red - amb) which silently zeroed out any
    // sample where amb > red (extremely common on real hardware — the
    // photodetector picks up more ambient than reflected LED on a typical
    // forehead). Switched to |red − amb| so direction doesn't matter; what
    // matters is whether the LED modulation is detectable above ambient.
    const computeQuality = (red?: number, amb?: number): number | undefined => {
      if (red == null || amb == null) return undefined;
      const signal = Math.abs(red - amb);
      const noise = Math.abs(amb) + 50; // floor avoids div-by-zero
      const ratio = signal / noise;
      // Empirical: ratio > 5 maps to ~100, ratio < 0.05 maps to ~0.
      return Math.max(0, Math.min(100, Math.log(1 + ratio) * 40));
    };
    const signalQualityL = computeQuality(redL, ambL);
    const signalQualityR = computeQuality(redR, ambR);
    const signalQualityP = computeQuality(
      numericField(fields, MENDI_FIELDS.RED_P),
      ambP
    );

    // Ambient light interference 0–100. We compare the absolute amb
    // readings across the three optodes — bright rooms drive amb upward.
    // Empirical calibration from a Mendi V4 (firmware 1.0.2) on 2026-05-15:
    // worn indoors under normal lighting, |amb| settles around 60k–80k.
    // The previous 8k threshold saturated at 100 under any real lighting;
    // we now map 0..200000 → 0..100 so worn-indoors reads ≈30–50 and
    // direct sunlight pushes >80.
    let ambientLevel: number | undefined;
    const ambVals = [ambL, numericField(fields, MENDI_FIELDS.AMB_R), ambP]
      .filter((v): v is number => v != null)
      .map(Math.abs);
    if (ambVals.length > 0) {
      const meanAbs = ambVals.reduce((a, b) => a + b, 0) / ambVals.length;
      ambientLevel = Math.max(0, Math.min(100, (meanAbs / 200000) * 100));
    }

    return {
      timestampMs: Date.now(),
      oxyHbLeft,
      oxyHbRight,
      deoxyHbLeft,
      deoxyHbRight,
      rewardScore,
      temperatureC,
      accelMag,
      accelX,
      accelY,
      accelZ,
      stillness,
      pulsePpg,
      pulseHrBpm,
      pulseHrvRmssd,
      signalQualityL,
      signalQualityR,
      signalQualityP,
      ambientLevel,
    };
  }

  /** Reset baselines (call when a new session starts). */
  resetBaseline(): void {
    this._baselineIrL = null;
    this._baselineRedL = null;
    this._baselineIrR = null;
    this._baselineRedR = null;
    this._accelHistory = [];
    this._accelRest = null;
    this._pulseWindow = [];
    this._pulsePrev = null;
    this._lastBeatMs = null;
    this._ibiHistory = [];
    this._rewardHboEma = null;
    this.lastSeq = null;
    this.droppedPackets = 0;
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private _baselineIrL: number | null = null;
  private _baselineRedL: number | null = null;
  private _baselineIrR: number | null = null;
  private _baselineRedR: number | null = null;

  // Auxiliary state for derived fields (accel/stillness, pulse PPG, HR).
  private _accelHistory: number[] = [];
  private _accelRest: number | null = null;
  // Sliding-window DC tracker for the pulse PPG signal (≈3 s).
  private _pulseWindow: number[] = [];
  private _pulsePrev: number | null = null;
  // Rolling baseline of mean HbO — used so rewardScore tracks CHANGES
  // from recent resting state, not absolute Beer-Lambert magnitude
  // (which can be arbitrarily large after a baseline drift).
  private _rewardHboEma: number | null = null;
  private _lastBeatMs: number | null = null;
  private _ibiHistory: number[] = [];

  /**
   * Decode protobuf wire-format into a {fieldNumber: value} map.
   * Returns null on malformed input.
   *
   * Note: We intentionally use Number rather than BigInt for varints.
   * Protobuf permits 64-bit varints, but every observed Mendi field fits
   * easily in JavaScript's 53-bit safe integer range. For signed values
   * we detect the high-bit-set "negative" pattern and subtract 2^64 via
   * a precomputed constant.
   */
  private _decodeProtobuf(view: DataView): Record<number, number> | null {
    const out: Record<number, number> = {};
    let i = 0;
    const len = view.byteLength;

    try {
      while (i < len) {
        // Read tag varint
        const tagResult = readVarintAsHi32Lo32(view, i);
        if (tagResult == null) break;
        const [tagHi, tagLo, afterTag] = tagResult;
        i = afterTag;

        const tag = tagHi * 0x100000000 + tagLo;
        const fieldNum = Math.floor(tag / 8);
        const wireType = tag & 0x7;

        if (wireType === 0) {
          const v = readVarintAsHi32Lo32(view, i);
          if (v == null) return null;
          const [hi, lo, j] = v;
          // Reassemble as signed twos-complement number
          // (clip to safe range; fields beyond 2^53 lose precision but Mendi never sends those)
          const signed = combineHiLoSigned(hi, lo);
          out[fieldNum] = signed;
          i = j;
        } else if (wireType === 5) {
          if (i + 4 > len) return null;
          out[fieldNum] = view.getFloat32(i, true);
          i += 4;
        } else if (wireType === 1) {
          if (i + 8 > len) return null;
          out[fieldNum] = view.getFloat64(i, true);
          i += 8;
        } else if (wireType === 2) {
          const v = readVarintAsHi32Lo32(view, i);
          if (v == null) return null;
          const [, lo, j] = v;
          i = j + lo;
        } else {
          return null;
        }
      }
    } catch {
      return null;
    }

    return out;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read a base128 varint at offset `i` and return it as [high32, low32, newOffset].
 * Returns null on truncation.
 *
 * Splitting hi/lo lets us handle full 64-bit varints without BigInt while staying
 * in TS targets that pre-date ES2020.
 */
function readVarintAsHi32Lo32(
  view: DataView,
  i: number
): [number, number, number] | null {
  let lo = 0;
  let hi = 0;
  let shift = 0;
  let cur = i;
  const len = view.byteLength;
  while (cur < len) {
    const b = view.getUint8(cur);
    cur += 1;
    if (shift < 28) {
      lo |= (b & 0x7f) << shift;
    } else if (shift === 28) {
      lo |= (b & 0x0f) << 28;
      hi |= (b & 0x70) >>> 4;
    } else {
      hi |= (b & 0x7f) << (shift - 32);
    }
    if ((b & 0x80) === 0) {
      return [hi >>> 0, lo >>> 0, cur];
    }
    shift += 7;
    if (shift >= 70) return null;
  }
  return null;
}

/** Combine a 64-bit varint (hi32 + lo32) into a signed JS number. */
function combineHiLoSigned(hi: number, lo: number): number {
  // If high bit of hi32 is set, value is negative (twos-complement).
  if (hi & 0x80000000) {
    // Compute -(2^64 - value) via bitwise NOT + 1 on each half
    const negLo = ((~lo) + 1) >>> 0;
    const carry = negLo === 0 ? 1 : 0;
    const negHi = ((~hi) + carry) >>> 0;
    return -(negHi * 0x100000000 + negLo);
  }
  return hi * 0x100000000 + lo;
}

function numericField(fields: Record<number, number>, key: number): number | undefined {
  const v = fields[key];
  return typeof v === "number" && isFinite(v) ? v : undefined;
}
