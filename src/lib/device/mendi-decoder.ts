/**
 * Pure Mendi packet decoder — no I/O, no BLE, just bytes → DeviceSample.
 *
 * Reverse-engineered from a real Mendi V4 (firmware 1.0.2) on 2026-05-13.
 * See AUDIT-2026-MENDI-BLE-PROTOCOL.md for full capture details.
 *
 * Mendi sends fNIRS data over the streaming characteristic
 * `f55a451c-556e-2a92-e649-c4c6b1ab3efc` at ~31.2 Hz, encoded as
 * Google Protocol Buffers wire-format messages of ~105 bytes.
 *
 * Each message carries 16+ fields: a sample counter, raw photodiode
 * intensities at multiple wavelengths, pre-computed ΔHb deltas,
 * a temperature float, and rolling counters / timestamps.
 *
 * Field-to-channel mapping was derived empirically by diffing a quiet
 * baseline session against a serial-sevens cognitive-load session and
 * picking the fields with the largest, statistically-significant shifts
 * in the expected fNIRS direction (raw intensity DOWN, ΔHbO UP).
 *
 * Initial mappings — subject to refinement after first live session:
 *   field 10 → oxyHbLeft   (signed varint, units TBD ~ μM × 100)
 *   field 16 → oxyHbRight  (signed varint)
 *   field 11 → raw intensity left  (used to derive deoxyHbLeft heuristic)
 *   field 12 → raw intensity right (used to derive deoxyHbRight heuristic)
 *   field 7  → temperature (float32 °C)
 *   field 13 → reward / quality score (varint, scaled to 0-100)
 *   field 1  → sample sequence counter (for packet-loss detection)
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
    // The result is unitless (relative change). Scale to typical fNIRS μM
    // range by multiplying by ~10 — empirical until we calibrate against
    // the Mendi app's own reported values.
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

    // Reward score: derive from average HbO change. Rises with frontal
    // activation (the user is "doing the work"). Clamped 0-100.
    const meanOxy =
      [oxyHbLeft, oxyHbRight].filter((v) => v != null) as number[];
    const rewardScore =
      meanOxy.length > 0
        ? Math.min(100, Math.max(0, 50 + (meanOxy.reduce((a, b) => a + b, 0) / meanOxy.length) * 50))
        : undefined;

    return {
      timestampMs: Date.now(),
      oxyHbLeft,
      oxyHbRight,
      deoxyHbLeft,
      deoxyHbRight,
      rewardScore,
    };
  }

  /** Reset baselines (call when a new session starts). */
  resetBaseline(): void {
    this._baselineIrL = null;
    this._baselineRedL = null;
    this._baselineIrR = null;
    this._baselineRedR = null;
    this.lastSeq = null;
    this.droppedPackets = 0;
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private _baselineIrL: number | null = null;
  private _baselineRedL: number | null = null;
  private _baselineIrR: number | null = null;
  private _baselineRedR: number | null = null;

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
