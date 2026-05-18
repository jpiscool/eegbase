/**
 * Auth guard tests — focus on the error classes so callers can pattern-
 * match (e.g. show a friendlier message for NoClinicError vs Unauthorized).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UnauthorizedError, NoClinicError } from "./require";

describe("auth guards · error classes", () => {
  it("UnauthorizedError carries the expected name + default message", () => {
    const e = new UnauthorizedError();
    assert.equal(e.name, "UnauthorizedError");
    assert.match(e.message, /Unauthorized/);
    assert.ok(e instanceof Error);
  });

  it("UnauthorizedError accepts a custom message", () => {
    const e = new UnauthorizedError("Custom auth failure");
    assert.equal(e.message, "Custom auth failure");
  });

  it("NoClinicError is distinct from UnauthorizedError", () => {
    const e = new NoClinicError();
    assert.equal(e.name, "NoClinicError");
    assert.ok(!(e instanceof UnauthorizedError));
    assert.match(e.message, /clinic/i);
  });
});
