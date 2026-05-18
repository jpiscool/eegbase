/**
 * Password-reset token tests. Tampering with the payload, signature,
 * or simulating expiry should all return null from verifyResetToken.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

before(() => {
  // The token signer reads AUTH_SECRET — ensure something deterministic
  // is set so tests don't depend on the test runner's environment.
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = "test-secret-deterministic-do-not-deploy";
  }
});

// Lazy-import so the env mutation in `before` takes effect.
async function getModule() {
  return await import("./reset-token");
}

describe("reset-token · sign + verify roundtrip", () => {
  it("verifies a freshly signed token", async () => {
    const { signResetToken, verifyResetToken } = await getModule();
    const token = signResetToken("clinician-uuid-1", "test@example.com");
    const claims = verifyResetToken(token);
    assert.ok(claims);
    assert.equal(claims!.sub, "clinician-uuid-1");
    assert.equal(claims!.email, "test@example.com");
    assert.ok(claims!.exp > claims!.iat);
  });

  it("rejects a tampered payload", async () => {
    const { signResetToken, verifyResetToken } = await getModule();
    const token = signResetToken("sub-a", "a@example.com");
    const [payload, sig] = token.split(".");
    // Replace the payload with another valid base64 of a different sub.
    const tampered = Buffer.from(JSON.stringify({ sub: "sub-b", email: "a@example.com", iat: 1, exp: 9999999999 }))
      .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const reassembled = `${tampered}.${sig}`;
    assert.equal(verifyResetToken(reassembled), null);
    // Sanity — the original still verifies.
    assert.ok(verifyResetToken(token));
    assert.ok(payload); // appease the unused-var lint
  });

  it("rejects a tampered signature", async () => {
    const { signResetToken, verifyResetToken } = await getModule();
    const token = signResetToken("sub", "x@example.com");
    const [payload] = token.split(".");
    assert.equal(verifyResetToken(`${payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`), null);
  });

  it("rejects malformed input", async () => {
    const { verifyResetToken } = await getModule();
    assert.equal(verifyResetToken(""), null);
    assert.equal(verifyResetToken("not-a-token"), null);
    assert.equal(verifyResetToken("only.one.part.too.many"), null);
  });

  it("rejects an expired token", async () => {
    const { signResetToken, verifyResetToken } = await getModule();
    // Sign with a negative TTL — exp is in the past.
    const expired = signResetToken("sub", "x@example.com", -10);
    assert.equal(verifyResetToken(expired), null);
  });
});
