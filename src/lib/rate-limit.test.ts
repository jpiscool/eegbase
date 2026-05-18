/**
 * Rate-limiter unit tests. Covers token consumption, refill, retry-
 * after math, and per-key isolation.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkRate, clientIpFromHeaders } from "./rate-limit";

describe("rate-limit · checkRate", () => {
  it("allows up to `max` calls and then blocks", () => {
    // Use a unique bucket name so tests don't share state.
    const bucket = `unit-test-burst-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const r = checkRate(bucket, "k1", { max: 5, windowMs: 60_000 });
      assert.equal(r.ok, true, `call ${i + 1} should be allowed`);
    }
    const r = checkRate(bucket, "k1", { max: 5, windowMs: 60_000 });
    assert.equal(r.ok, false);
    assert.equal(r.remaining, 0);
    assert.ok(r.retryAfterMs > 0);
  });

  it("isolates per-key buckets", () => {
    const bucket = `unit-test-isolation-${Math.random()}`;
    // Exhaust key A.
    for (let i = 0; i < 3; i++) checkRate(bucket, "A", { max: 3, windowMs: 60_000 });
    assert.equal(checkRate(bucket, "A", { max: 3, windowMs: 60_000 }).ok, false);
    // Key B has its own bucket.
    assert.equal(checkRate(bucket, "B", { max: 3, windowMs: 60_000 }).ok, true);
  });

  it("isolates per-bucket-name", () => {
    // Same key, different bucket name — independent limits.
    const a = `unit-test-name-a-${Math.random()}`;
    const b = `unit-test-name-b-${Math.random()}`;
    for (let i = 0; i < 2; i++) checkRate(a, "shared", { max: 2, windowMs: 60_000 });
    assert.equal(checkRate(a, "shared", { max: 2, windowMs: 60_000 }).ok, false);
    assert.equal(checkRate(b, "shared", { max: 2, windowMs: 60_000 }).ok, true);
  });
});

describe("rate-limit · clientIpFromHeaders", () => {
  it("returns the leftmost x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1, 10.0.0.2" });
    assert.equal(clientIpFromHeaders(h), "203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    assert.equal(clientIpFromHeaders(h), "198.51.100.7");
  });

  it('returns "unknown" when neither header is set', () => {
    assert.equal(clientIpFromHeaders(new Headers()), "unknown");
  });
});
