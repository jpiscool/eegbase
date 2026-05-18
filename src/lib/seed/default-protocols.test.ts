/**
 * default-protocols seed tests — guarantees every starter protocol is
 * well-formed before it lands on a fresh clinic's dashboard.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROTOCOL_SEEDS } from "./default-protocols";
import { parseProtocolBlocks } from "@/components/ProtocolBlockTimer";

describe("default-protocols seed", () => {
  it("ships at least one starter protocol", () => {
    assert.ok(DEFAULT_PROTOCOL_SEEDS.length > 0, "no defaults defined");
  });

  it("every protocol has unique name + valid metadata", () => {
    const names = new Set<string>();
    for (const p of DEFAULT_PROTOCOL_SEEDS) {
      assert.ok(p.name && p.name.length > 0, `protocol missing name`);
      assert.ok(!names.has(p.name), `duplicate protocol name: ${p.name}`);
      names.add(p.name);
      assert.ok(p.description && p.description.length > 10, `${p.name}: thin description`);
      assert.ok(["mendi", "muse", "simulator"].includes(p.deviceType), `${p.name}: bad device`);
      assert.ok(p.durationSeconds >= 60, `${p.name}: duration too short`);
      assert.ok(p.durationSeconds <= 60 * 60, `${p.name}: duration over 1h`);
    }
  });

  it("every protocol's blocks parse and sum to durationSeconds", () => {
    for (const p of DEFAULT_PROTOCOL_SEEDS) {
      const blocks = parseProtocolBlocks(p.parameters);
      assert.ok(blocks.length > 0, `${p.name}: no parseable blocks`);
      const totalBlockSec = blocks.reduce((a, b) => a + b.durationSeconds, 0);
      assert.equal(
        totalBlockSec,
        p.durationSeconds,
        `${p.name}: blocks total ${totalBlockSec}s but durationSeconds is ${p.durationSeconds}s`,
      );
    }
  });

  it("each block kind matches the timer's allowed enum", () => {
    const allowed = new Set(["baseline", "focus", "rest", "calm", "task"]);
    for (const p of DEFAULT_PROTOCOL_SEEDS) {
      const blocks = parseProtocolBlocks(p.parameters);
      for (const b of blocks) {
        assert.ok(allowed.has(b.kind), `${p.name}: unexpected block kind ${b.kind}`);
        assert.ok(b.label.length > 0, `${p.name}: block missing label`);
        assert.ok(b.durationSeconds >= 5, `${p.name}: block too short (${b.durationSeconds}s)`);
      }
    }
  });

  it("Mendi-device protocols include a baseline block first", () => {
    // Forehead-mounted fNIRS recordings should always lead with a
    // resting baseline so the reward EMA has a meaningful reference.
    for (const p of DEFAULT_PROTOCOL_SEEDS) {
      if (p.deviceType !== "mendi") continue;
      const blocks = parseProtocolBlocks(p.parameters);
      assert.equal(blocks[0].kind, "baseline", `${p.name}: should lead with baseline`);
    }
  });
});
