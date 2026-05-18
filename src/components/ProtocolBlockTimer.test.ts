/**
 * ProtocolBlockTimer pure-logic unit tests.
 *
 * Covers currentBlockState() (the block-index/seconds-into-block math
 * that drives the live timer pill) and parseProtocolBlocks() (the
 * defensive jsonb parser that loads blocks from a protocol's
 * parameters column).
 *
 * Run with: `npm test`
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { currentBlockState, parseProtocolBlocks, type ProtocolBlock } from "./ProtocolBlockTimer";

const SAMPLE_BLOCKS: ProtocolBlock[] = [
  { kind: "baseline", label: "Baseline",     durationSeconds: 60 },
  { kind: "focus",    label: "Focus 1",      durationSeconds: 300 },
  { kind: "rest",     label: "Rest",         durationSeconds: 120 },
  { kind: "focus",    label: "Focus 2",      durationSeconds: 300 },
];

describe("ProtocolBlockTimer · currentBlockState", () => {
  it("starts in block 0 at second 0", () => {
    const s = currentBlockState(SAMPLE_BLOCKS, 0);
    assert.equal(s.index, 0);
    assert.equal(s.secondsIntoBlock, 0);
    assert.equal(s.totalSeconds, 780);
  });

  it("advances secondsIntoBlock within the first block", () => {
    const s = currentBlockState(SAMPLE_BLOCKS, 30);
    assert.equal(s.index, 0);
    assert.equal(s.secondsIntoBlock, 30);
  });

  it("rolls over to block 1 exactly at block boundary", () => {
    const s = currentBlockState(SAMPLE_BLOCKS, 60);
    assert.equal(s.index, 1);
    assert.equal(s.secondsIntoBlock, 0);
  });

  it("computes correct (index, offset) midway through block 2", () => {
    // baseline (60) + focus1 (300) = 360 → block 2 starts here.
    const s = currentBlockState(SAMPLE_BLOCKS, 360 + 45);
    assert.equal(s.index, 2);
    assert.equal(s.secondsIntoBlock, 45);
  });

  it("rolls into block 3 at the right boundary", () => {
    // baseline + focus1 + rest = 60 + 300 + 120 = 480
    const s = currentBlockState(SAMPLE_BLOCKS, 480);
    assert.equal(s.index, 3);
    assert.equal(s.secondsIntoBlock, 0);
  });

  it("signals completion when elapsed >= total", () => {
    const s = currentBlockState(SAMPLE_BLOCKS, 780);
    assert.equal(s.index, -1);
    assert.equal(s.totalSeconds, 780);
  });

  it("signals completion beyond total", () => {
    const s = currentBlockState(SAMPLE_BLOCKS, 9999);
    assert.equal(s.index, -1);
  });

  it("handles single-block protocols", () => {
    const single: ProtocolBlock[] = [{ kind: "focus", label: "Only", durationSeconds: 60 }];
    assert.equal(currentBlockState(single, 0).index, 0);
    assert.equal(currentBlockState(single, 30).index, 0);
    assert.equal(currentBlockState(single, 60).index, -1);
  });

  it("returns finished state on empty block list", () => {
    const s = currentBlockState([], 0);
    assert.equal(s.index, -1);
    assert.equal(s.totalSeconds, 0);
  });
});

describe("ProtocolBlockTimer · parseProtocolBlocks", () => {
  it("returns [] when parameters is null/undefined/non-object", () => {
    assert.deepEqual(parseProtocolBlocks(null), []);
    assert.deepEqual(parseProtocolBlocks(undefined), []);
    assert.deepEqual(parseProtocolBlocks("blocks"), []);
    assert.deepEqual(parseProtocolBlocks(42), []);
  });

  it("returns [] when blocks key is missing or not an array", () => {
    assert.deepEqual(parseProtocolBlocks({}), []);
    assert.deepEqual(parseProtocolBlocks({ blocks: "x" }), []);
    assert.deepEqual(parseProtocolBlocks({ blocks: { a: 1 } }), []);
  });

  it("parses a valid blocks array", () => {
    const out = parseProtocolBlocks({
      rewardThreshold: 0.05,
      blocks: [
        { kind: "focus", label: "Train", durationSeconds: 120 },
        { kind: "rest", label: "Rest",  durationSeconds: 60 },
      ],
    });
    assert.equal(out.length, 2);
    assert.equal(out[0].kind, "focus");
    assert.equal(out[1].durationSeconds, 60);
  });

  it("skips malformed entries silently", () => {
    const out = parseProtocolBlocks({
      blocks: [
        { kind: "focus", label: "ok", durationSeconds: 60 },
        { kind: "bogus", label: "bad-kind", durationSeconds: 60 },         // rejected
        { kind: "focus", durationSeconds: 60 },                             // missing label
        { kind: "focus", label: "no-duration" },                            // missing duration
        { kind: "focus", label: "zero-duration", durationSeconds: 0 },      // non-positive
        { kind: "focus", label: "neg-duration", durationSeconds: -10 },     // negative
        null,                                                                // garbage
        "string",                                                           // garbage
      ],
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].label, "ok");
  });

  it("preserves block order", () => {
    const out = parseProtocolBlocks({
      blocks: [
        { kind: "baseline", label: "A", durationSeconds: 10 },
        { kind: "focus",    label: "B", durationSeconds: 20 },
        { kind: "rest",     label: "C", durationSeconds: 30 },
      ],
    });
    assert.deepEqual(out.map((b) => b.label), ["A", "B", "C"]);
  });
});
