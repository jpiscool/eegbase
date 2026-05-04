/**
 * EEGBase REST API v1 — Webhook Registration
 *
 * GET    /api/v1/webhooks       — list webhook config for the clinic
 * POST   /api/v1/webhooks       — register (or replace) the webhook URL
 * DELETE /api/v1/webhooks       — remove the webhook config
 *
 * Storage
 * ───────
 * Webhook configuration is stored as a JSON string in clinics.webhookUrl.
 * The field is text, so we serialise { url, events, createdAt } into it.
 *
 * Authentication
 * ──────────────
 * All requests require:
 *   Authorization: Bearer <API_KEY>
 *
 * POST body (application/json)
 * ─────────────────────────────
 *   url     string    required — HTTPS endpoint to POST events to
 *   events  string[]  required — subset of VALID_EVENTS
 *
 * Named export
 * ─────────────
 * `triggerWebhook(clinicId, event, data)` — fire-and-forget helper used by
 * other API routes to dispatch events after data-mutating operations.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ── Constants ──────────────────────────────────────────────────────────────────

export const VALID_EVENTS = [
  "session.completed",
  "client.created",
  "appointment.scheduled",
] as const;

export type WebhookEvent = (typeof VALID_EVENTS)[number];

/** Shape stored as JSON in clinics.webhookUrl */
interface WebhookConfig {
  url: string;
  events: WebhookEvent[];
  createdAt: string; // ISO 8601
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function resolveClinicId(req: NextRequest): string | null {
  const apiKey   = process.env.API_KEY;
  const clinicId = process.env.API_CLINIC_ID;
  if (!apiKey || !clinicId) return null;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || token !== apiKey) return null;
  return clinicId;
}

// ── Shared DB helpers ─────────────────────────────────────────────────────────

async function getWebhookConfig(clinicId: string): Promise<WebhookConfig | null> {
  const [row] = await db
    .select({ webhookUrl: clinics.webhookUrl })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  if (!row || !row.webhookUrl) return null;

  try {
    return JSON.parse(row.webhookUrl) as WebhookConfig;
  } catch {
    return null;
  }
}

async function setWebhookConfig(clinicId: string, config: WebhookConfig | null): Promise<void> {
  await db
    .update(clinics)
    .set({ webhookUrl: config ? JSON.stringify(config) : null })
    .where(eq(clinics.id, clinicId));
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const clinicId = resolveClinicId(req);
  if (!clinicId) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const config = await getWebhookConfig(clinicId);
  if (!config) {
    return NextResponse.json({ webhooks: [] });
  }

  return NextResponse.json({
    webhooks: [
      {
        id:        "webhook_1",
        url:       config.url,
        events:    config.events,
        createdAt: config.createdAt,
      },
    ],
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

function isValidHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    // Allow http in dev/test; enforce https in production
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return false;
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const clinicId = resolveClinicId(req);
  if (!clinicId) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const b = rawBody as Record<string, unknown>;

  // Validate URL
  if (typeof b.url !== "string" || !isValidHttpsUrl(b.url)) {
    return NextResponse.json(
      { error: "'url' must be a valid HTTP/HTTPS URL" },
      { status: 400 },
    );
  }

  // Validate events array
  if (!Array.isArray(b.events) || b.events.length === 0) {
    return NextResponse.json(
      { error: `'events' must be a non-empty array. Valid values: ${VALID_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const invalidEvents = (b.events as unknown[]).filter(
    (e) => !VALID_EVENTS.includes(e as WebhookEvent),
  );
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      { error: `Invalid event(s): ${invalidEvents.join(", ")}. Valid values: ${VALID_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const config: WebhookConfig = {
    url:       b.url,
    events:    b.events as WebhookEvent[],
    createdAt: new Date().toISOString(),
  };

  await setWebhookConfig(clinicId, config);

  return NextResponse.json(
    {
      id:        "webhook_1",
      url:       config.url,
      events:    config.events,
      createdAt: config.createdAt,
    },
    { status: 201 },
  );
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const clinicId = resolveClinicId(req);
  if (!clinicId) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const existing = await getWebhookConfig(clinicId);
  if (!existing) {
    return NextResponse.json({ error: "No webhook configured" }, { status: 404 });
  }

  await setWebhookConfig(clinicId, null);

  return new NextResponse(null, { status: 204 });
}

// ── triggerWebhook — named export for use by other route handlers ──────────────

/**
 * Fire-and-forget webhook dispatcher.
 *
 * Loads the clinic's webhook config, checks whether the given event is
 * subscribed, then POSTs the payload.  Failures are silently swallowed so
 * webhook delivery never blocks a primary API response.
 *
 * The request includes an X-EEGBase-Signature header (HMAC-SHA256 of the
 * serialised body using NEXTAUTH_SECRET) so the receiving endpoint can verify
 * authenticity.
 *
 * @param clinicId  UUID of the clinic that owns the webhook config
 * @param event     One of the VALID_EVENTS strings
 * @param data      Arbitrary JSON-serialisable payload
 */
export function triggerWebhook(
  clinicId: string,
  event: WebhookEvent,
  data: unknown,
): void {
  // Fire without awaiting — intentionally non-blocking
  void (async () => {
    try {
      const config = await getWebhookConfig(clinicId);
      if (!config) return;
      if (!config.events.includes(event)) return;

      const body = JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      });

      // HMAC-SHA256 signature using NEXTAUTH_SECRET
      const secret = process.env.NEXTAUTH_SECRET ?? "";
      const signature = createHmac("sha256", secret).update(body).digest("hex");

      await fetch(config.url, {
        method:  "POST",
        headers: {
          "Content-Type":          "application/json",
          "X-EEGBase-Signature":   `sha256=${signature}`,
          "X-EEGBase-Event":       event,
        },
        body,
        // Abort if the endpoint does not respond within 10 seconds
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // Webhook delivery failures must never propagate — log silently
    }
  })();
}
