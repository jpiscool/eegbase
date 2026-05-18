// ── Client error reporter ───────────────────────────────────────────────────
// Receives a JSON-encoded error payload from the browser's ErrorBoundary
// and (a) forwards to Sentry / a webhook if configured, (b) writes a
// structured log line that Vercel preserves in its function logs.
//
// Endpoint is intentionally permissive: no auth — error reports come from
// crashed page renders where the user may not have a session — but is
// rate-limited to defeat trivial log-spam.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { checkRate, clientIpFromHeaders } from "@/lib/rate-limit";

interface IncomingReport {
  message?: string;
  stack?: string;
  digest?: string;
  url?: string;
  userAgent?: string;
  // Free-form per-route context the caller can attach.
  context?: Record<string, unknown>;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  const h = await headers();
  const ip = clientIpFromHeaders(h);

  // Throttle to 30 reports per IP per minute. A user with a flaky
  // browser tab could legitimately fire several per page-view if
  // multiple error boundaries trip; 30/min comfortably covers that
  // without letting a malicious page exhaust our log quota.
  const rate = checkRate("error-report", ip, { max: 30, windowMs: 60_000 });
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: IncomingReport;
  try {
    body = (await req.json()) as IncomingReport;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  // Truncate fields to bound log size. A pathological stack trace
  // could otherwise overwhelm the log line.
  const sanitised = {
    message: String(body.message ?? "").slice(0, 500),
    stack: String(body.stack ?? "").slice(0, 4000),
    digest: String(body.digest ?? "").slice(0, 120),
    url: String(body.url ?? "").slice(0, 500),
    userAgent: String(body.userAgent ?? "").slice(0, 300),
    context: body.context && typeof body.context === "object" ? body.context : undefined,
    ip,
    receivedAt: new Date().toISOString(),
  };

  // Structured log line — Vercel parses JSON in function logs into
  // searchable fields. Prefix tag makes grepping in raw logs easy.
  console.error("[error-report]", JSON.stringify(sanitised));

  // Optional fan-out to Sentry / webhook. Wrapped in fire-and-forget
  // so a transport failure here never breaks the page render that
  // triggered the report.
  if (process.env.SENTRY_DSN) {
    // Sentry minimal envelope. Full SDK is a 30kb client-bundle hit;
    // a hand-rolled HTTP POST keeps it lean. See docs:
    // https://develop.sentry.dev/sdk/envelopes/
    const dsnMatch = process.env.SENTRY_DSN.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
    if (dsnMatch) {
      const [, key, host, project] = dsnMatch;
      const eventId = crypto.randomUUID().replace(/-/g, "");
      const headerLine = JSON.stringify({
        event_id: eventId,
        sent_at: new Date().toISOString(),
        sdk: { name: "eegbase-minimal", version: "1.0.0" },
        dsn: process.env.SENTRY_DSN,
      });
      const itemHeader = JSON.stringify({ type: "event" });
      const event = JSON.stringify({
        event_id: eventId,
        timestamp: Math.floor(Date.now() / 1000),
        platform: "javascript",
        level: "error",
        message: { formatted: sanitised.message },
        exception: { values: [{ type: "Error", value: sanitised.message, stacktrace: { frames: [] } }] },
        request: { url: sanitised.url, headers: { "User-Agent": sanitised.userAgent } },
        tags: { digest: sanitised.digest },
        extra: sanitised.context,
      });
      const envelope = `${headerLine}\n${itemHeader}\n${event}\n`;
      const url = `https://${host}/api/${project}/envelope/?sentry_key=${key}&sentry_version=7`;
      void fetch(url, { method: "POST", body: envelope, headers: { "Content-Type": "application/x-sentry-envelope" } }).catch(() => {});
    }
  }
  if (process.env.ERROR_WEBHOOK_URL) {
    void fetch(process.env.ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitised),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
