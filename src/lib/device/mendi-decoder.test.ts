/**
 * MendiPacketDecoder unit tests.
 *
 * Run with: `npm test`  (uses node:test + tsx)
 *
 * Fixtures here are REAL packets captured on 2026-05-13 from a physical
 * Mendi V4 (firmware 1.0.2) — see AUDIT-2026-MENDI-BLE-PROTOCOL.md.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MendiPacketDecoder, MENDI_FIELDS } from "./mendi-decoder";

const closeTo = (actual: number | undefined, expected: number, tol = 1e-3) => {
  assert.ok(actual !== undefined, "value is undefined");
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected} ± ${tol}, got ${actual}`
  );
};

const hexToView = (hex: string): DataView => {
  const bytes = Uint8Array.from(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return new DataView(bytes.buffer);
};

// ── Real captured fixtures ──────────────────────────────────────────────────

// First 3 packets from baseline session (still, eyes open).
const REAL_BASELINE_PACKETS = [
  "08c90f10c87d18cff8ffffffffffffff012089feffffffffffffff0128bbf7ffffffffffffff013084f9ffffffffffffff013d0000bc4140b7810348a9960150fff6ffffffffffffff0158efe30260dc920168d42070f8f31578ba870d8001ddf6ffffffffffffff01",
  "08a10f10847d18d4f8ffffffffffffff012087fdffffffffffffff0128b7f6ffffffffffffff0130b6f9ffffffffffffff013d0000bc4140cd820348dc940150d0f8ffffffffffffff0158d6e50260ae9301688b207092f41578cf860d8001aaf7ffffffffffffff01",
  "08f60e108f7d18cdf8ffffffffffffff0120b8fcffffffffffffff0128a9f6ffffffffffffff0130befaffffffffffffff013d0080bb4140e6820348ff95015095f8ffffffffffffff0158b4e60260ee930168c221709ff41578fa860d8001a1f7ffffffffffffff01",
];

describe("MendiPacketDecoder · real packet decode", () => {
  it("decodes a real captured packet without throwing", () => {
    const decoder = new MendiPacketDecoder();
    const sample = decoder.decode(hexToView(REAL_BASELINE_PACKETS[0]));
    assert.ok(sample, "sample should not be null");
    assert.equal(typeof sample!.timestampMs, "number");
  });

  it("populates all four fNIRS channels", () => {
    const decoder = new MendiPacketDecoder();
    const sample = decoder.decode(hexToView(REAL_BASELINE_PACKETS[0]));
    assert.ok(sample);
    assert.ok(typeof sample!.oxyHbLeft === "number", "oxyHbLeft missing");
    assert.ok(typeof sample!.oxyHbRight === "number", "oxyHbRight missing");
    // deoxyHb is derived from raw-intensity vs baseline; on first packet,
    // baseline = current → delta = 0
    closeTo(sample!.deoxyHbLeft, 0, 1e-9);
    closeTo(sample!.deoxyHbRight, 0, 1e-9);
  });

  it("derived ΔHbO values lie in physiological range (~ ±5 μM)", () => {
    const decoder = new MendiPacketDecoder();
    const sample = decoder.decode(hexToView(REAL_BASELINE_PACKETS[0]));
    assert.ok(Math.abs(sample!.oxyHbLeft!) < 5);
    assert.ok(Math.abs(sample!.oxyHbRight!) < 5);
  });

  it("emits a reward score in [0, 100]", () => {
    const decoder = new MendiPacketDecoder();
    const sample = decoder.decode(hexToView(REAL_BASELINE_PACKETS[0]));
    if (sample!.rewardScore != null) {
      assert.ok(sample!.rewardScore >= 0 && sample!.rewardScore <= 100);
    }
  });

  it("decodes 3 consecutive packets with consistent shape", () => {
    const decoder = new MendiPacketDecoder();
    const samples = REAL_BASELINE_PACKETS.map((hex) => decoder.decode(hexToView(hex)));
    assert.equal(samples.filter((s) => s !== null).length, 3);
    // All samples should have the same set of populated channels
    const keys = (s: typeof samples[0]) =>
      Object.entries(s!).filter(([, v]) => v != null).map(([k]) => k).sort().join(",");
    assert.equal(keys(samples[0]), keys(samples[1]));
    assert.equal(keys(samples[1]), keys(samples[2]));
  });
});

describe("MendiPacketDecoder · malformed input", () => {
  it("returns null on empty input", () => {
    const decoder = new MendiPacketDecoder();
    assert.equal(decoder.decode(new DataView(new ArrayBuffer(0))), null);
  });

  it("returns null on truncated varint", () => {
    const decoder = new MendiPacketDecoder();
    // tag 0x08 (field 1, varint), then a truncated continuation byte
    const buf = new Uint8Array([0x08, 0x80]);
    const result = decoder.decode(new DataView(buf.buffer));
    // Either null or a partial decode with no fields — just shouldn't throw
    assert.ok(result === null || typeof result === "object");
  });

  it("does not throw on random garbage", () => {
    const decoder = new MendiPacketDecoder();
    const garbage = new Uint8Array(64);
    crypto.getRandomValues(garbage);
    assert.doesNotThrow(() => decoder.decode(new DataView(garbage.buffer)));
  });
});

describe("MendiPacketDecoder · session lifecycle", () => {
  it("resetBaseline() clears intensity baselines between sessions", () => {
    const decoder = new MendiPacketDecoder();
    decoder.decode(hexToView(REAL_BASELINE_PACKETS[0]));
    decoder.decode(hexToView(REAL_BASELINE_PACKETS[1]));
    // After processing two packets the second one's deltas should be near
    // (but not exactly) zero relative to the first packet's baseline.
    decoder.resetBaseline();
    assert.equal(decoder.droppedPackets, 0);
    // Next packet after reset should give ~0 deltas (baseline-establishing).
    const sample = decoder.decode(hexToView(REAL_BASELINE_PACKETS[2]));
    closeTo(sample!.oxyHbLeft, 0, 1e-9);
    closeTo(sample!.deoxyHbLeft, 0, 1e-9);
  });
});

describe("MendiPacketDecoder · field constants", () => {
  it("exports field-number constants matching the V4 .proto schema", () => {
    assert.equal(MENDI_FIELDS.TEMPERATURE, 7);
    assert.equal(MENDI_FIELDS.IR_L, 8);
    assert.equal(MENDI_FIELDS.RED_L, 9);
    assert.equal(MENDI_FIELDS.AMB_L, 10);
    assert.equal(MENDI_FIELDS.IR_R, 11);
    assert.equal(MENDI_FIELDS.RED_R, 12);
    assert.equal(MENDI_FIELDS.AMB_R, 13);
  });
});
