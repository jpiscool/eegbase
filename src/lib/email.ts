// ── Email helper ────────────────────────────────────────────────────────────
// Single sendEmail() interface that routes to whichever provider is wired
// in env. Falls back to console.log in dev so a fresh checkout doesn't
// need credentials to test flow end-to-end.
//
// Providers (priority order):
//   RESEND_API_KEY  — uses the Resend HTTP API (no extra dep needed —
//                     plain fetch keeps the bundle small).
//   EMAIL_WEBHOOK_URL — POSTs the payload to any URL (Zapier / n8n /
//                     custom endpoint). Useful for staging.
//   (none)          — logs the email to stdout. Returns "dispatched"
//                     so callers don't need to special-case dev.

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text: string;
  from?: string;
}

export interface SendResult {
  ok: boolean;
  provider: "resend" | "webhook" | "console";
  id?: string;
  error?: string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "EEGBase <hello@eegbase.com>";

export async function sendEmail(p: EmailPayload): Promise<SendResult> {
  const from = p.from ?? DEFAULT_FROM;

  // 1. Resend HTTP API
  if (process.env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: p.to,
          subject: p.subject,
          html: p.html,
          text: p.text,
        }),
      });
      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        return { ok: false, provider: "resend", error: `${r.status}: ${errText.slice(0, 200)}` };
      }
      const body = (await r.json().catch(() => null)) as { id?: string } | null;
      return { ok: true, provider: "resend", id: body?.id };
    } catch (e) {
      return { ok: false, provider: "resend", error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 2. Generic webhook (POST the entire payload).
  if (process.env.EMAIL_WEBHOOK_URL) {
    try {
      const r = await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, ...p }),
      });
      return { ok: r.ok, provider: "webhook", error: r.ok ? undefined : `${r.status}` };
    } catch (e) {
      return { ok: false, provider: "webhook", error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 3. Dev fallback — log so flow can be tested without credentials.
  console.log("[email:console]", { from, to: p.to, subject: p.subject });
  console.log("[email:console] text:", p.text);
  return { ok: true, provider: "console" };
}

// ── Common templates ────────────────────────────────────────────────────────

export function welcomeEmail(clinicName: string, adminName: string): { subject: string; text: string; html: string } {
  const subject = `Welcome to EEGBase, ${adminName} 👋`;
  const text = [
    `Hi ${adminName},`,
    "",
    `Your clinic "${clinicName}" is ready on EEGBase. You can sign in at:`,
    "",
    "  https://eegbase.com/login",
    "",
    "We've pre-seeded 6 starter protocols (3 Mendi + 2 EEG + 1 simulator) so the library isn't empty. You can tune any of them in /protocols.",
    "",
    "Next steps:",
    "  1. Add your first client → /clients",
    "  2. Pick a protocol and record → /sessions/live",
    "  3. Review the printable session report → /sessions/[id]/report",
    "",
    "Questions or feedback? Reply to this email — it lands in our inbox.",
    "",
    "— The EEGBase team",
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
      <p>Hi ${adminName},</p>
      <p>Your clinic <strong>${clinicName}</strong> is ready on EEGBase. <a href="https://eegbase.com/login" style="color:#2563EB">Sign in here</a>.</p>
      <p>We've pre-seeded 6 starter protocols so the library isn't empty. Tune any of them in <a href="https://eegbase.com/protocols">/protocols</a>.</p>
      <p><strong>Next steps</strong></p>
      <ol>
        <li>Add your first client → <a href="https://eegbase.com/clients">/clients</a></li>
        <li>Pick a protocol and record → <a href="https://eegbase.com/sessions/live">/sessions/live</a></li>
        <li>Review the printable session report</li>
      </ol>
      <p>Questions or feedback? Reply to this email.</p>
      <p>— The EEGBase team</p>
    </div>`;
  return { subject, text, html };
}

export function passwordResetEmail(name: string, resetUrl: string): { subject: string; text: string; html: string } {
  const subject = "Reset your EEGBase password";
  const text = [
    `Hi ${name || "there"},`,
    "",
    "We received a request to reset your EEGBase password. If you made this request, click the link below within 60 minutes to set a new password:",
    "",
    `  ${resetUrl}`,
    "",
    "If you didn't request a reset, you can safely ignore this email — your password won't change.",
    "",
    "— The EEGBase team",
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
      <p>Hi ${name || "there"},</p>
      <p>We received a request to reset your EEGBase password. Click below within 60 minutes to set a new one:</p>
      <p style="text-align:center;margin:24px 0"><a href="${resetUrl}" style="background:#2563EB;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
      <p style="font-size:12px;color:#6b7280">If you didn't request a reset, ignore this email — your password won't change.</p>
      <p>— The EEGBase team</p>
    </div>`;
  return { subject, text, html };
}
