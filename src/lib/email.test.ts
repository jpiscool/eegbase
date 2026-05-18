/**
 * Email template + dev-fallback tests. Network paths (Resend, webhook)
 * aren't exercised here — those run on stubbed envs in CI.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { welcomeEmail, passwordResetEmail, sendEmail } from "./email";

describe("email · welcomeEmail template", () => {
  it("includes the clinic + admin names in subject and body", () => {
    const t = welcomeEmail("Sunrise Neuro", "Dr Jane");
    assert.match(t.subject, /Dr Jane/);
    assert.match(t.text, /Sunrise Neuro/);
    assert.match(t.text, /Dr Jane/);
    assert.match(t.html, /Sunrise Neuro/);
    assert.match(t.html, /Dr Jane/);
  });

  it("ships both text and html variants", () => {
    const t = welcomeEmail("X", "Y");
    assert.ok(t.text.length > 50, "text body is suspiciously short");
    assert.ok(t.html.length > 50, "html body is suspiciously short");
  });
});

describe("email · passwordResetEmail template", () => {
  it("embeds the reset URL in both text and html", () => {
    const url = "https://eegbase.com/reset-password?token=abc.def";
    const t = passwordResetEmail("Jane", url);
    assert.match(t.text, /reset-password\?token=abc\.def/);
    assert.match(t.html, /reset-password\?token=abc\.def/);
  });

  it("falls back to a generic salutation when name is blank", () => {
    const t = passwordResetEmail("", "https://x");
    assert.match(t.text, /there/i);
  });
});

describe("email · sendEmail dev fallback", () => {
  it("returns ok=true and provider='console' when no provider env is set", async () => {
    // Defensive — only meaningful in a CI/dev shell where RESEND_API_KEY
    // and EMAIL_WEBHOOK_URL are both unset.
    if (process.env.RESEND_API_KEY || process.env.EMAIL_WEBHOOK_URL) {
      // Skip when a real provider is configured.
      return;
    }
    const r = await sendEmail({ to: "t@example.com", subject: "Hi", text: "hi" });
    assert.equal(r.ok, true);
    assert.equal(r.provider, "console");
  });
});
