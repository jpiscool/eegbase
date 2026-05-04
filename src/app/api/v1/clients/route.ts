/**
 * EEGBase REST API v1 — Clients
 *
 * GET  /api/v1/clients        — paginated client list
 * POST /api/v1/clients        — create a new client
 *
 * Authentication
 * ──────────────
 * All requests require:
 *   Authorization: Bearer <API_KEY>
 *
 * The API_KEY is compared against the API_KEY environment variable.
 * The associated clinic is identified by the API_CLINIC_ID environment
 * variable so the route can operate without a browser session.
 *
 * GET query parameters
 * ─────────────────────
 *   page   — page number, 1-based (default: 1)
 *   limit  — results per page, max 100 (default: 20)
 *   active — "true" | "false" — filter by active status (optional)
 *
 * POST body (application/json)
 * ─────────────────────────────
 *   name         string   required
 *   email        string   optional
 *   dateOfBirth  string   optional — ISO 8601 date, e.g. "1990-06-15"
 *   notes        string   optional
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, clinics, clinicians } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

// ── Auth helper ───────────────────────────────────────────────────────────────

/**
 * Validates the Bearer token and returns the clinicId from environment config.
 * Returns null when auth fails (caller must return 401).
 */
function resolveClinicId(req: NextRequest): string | null {
  const apiKey    = process.env.API_KEY;
  const clinicId  = process.env.API_CLINIC_ID;

  if (!apiKey || !clinicId) {
    // API key feature not configured — refuse all requests
    return null;
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token || token !== apiKey) return null;
  return clinicId;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const clinicId = resolveClinicId(req);
  if (!clinicId) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;

  // Pagination
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const offset = (page - 1) * limit;

  // Active filter
  const activeParam = searchParams.get("active");
  const activeFilter =
    activeParam === "true"  ? true  :
    activeParam === "false" ? false :
    undefined;

  // Build WHERE conditions
  const conditions = [eq(clients.clinicId, clinicId)];
  if (activeFilter !== undefined) {
    conditions.push(eq(clients.active, activeFilter));
  }
  const where = and(...conditions);

  // Run count + data queries in parallel
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(clients).where(where),
    db
      .select({
        id:          clients.id,
        name:        clients.name,
        email:       clients.email,
        dateOfBirth: clients.dateOfBirth,
        active:      clients.active,
        createdAt:   clients.createdAt,
      })
      .from(clients)
      .where(where)
      .orderBy(clients.createdAt)
      .limit(limit)
      .offset(offset),
  ]);

  return NextResponse.json({
    clients: rows,
    total,
    page,
    limit,
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

interface CreateClientBody {
  name: string;
  email?: string;
  dateOfBirth?: string;
  notes?: string;
}

function validateCreateBody(
  body: unknown,
): { valid: true; data: CreateClientBody } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim().length === 0) {
    return { valid: false, error: "'name' is required (non-empty string)" };
  }
  if (b.email !== undefined && typeof b.email !== "string") {
    return { valid: false, error: "'email' must be a string" };
  }
  if (b.dateOfBirth !== undefined) {
    if (typeof b.dateOfBirth !== "string" || isNaN(Date.parse(b.dateOfBirth))) {
      return { valid: false, error: "'dateOfBirth' must be a valid ISO 8601 date string" };
    }
  }
  if (b.notes !== undefined && typeof b.notes !== "string") {
    return { valid: false, error: "'notes' must be a string" };
  }

  return { valid: true, data: b as unknown as CreateClientBody };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const clinicId = resolveClinicId(req);
  if (!clinicId) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  // ── Verify the clinic exists ──────────────────────────────────────────────
  const [clinic] = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found for API_CLINIC_ID" }, { status: 500 });
  }

  // ── Parse & validate body ─────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const validation = validateCreateBody(rawBody);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const body = validation.data;

  // ── Resolve a clinician to associate the client with ──────────────────────
  // The v1 API operates without a user session, so we use the first clinician
  // in the clinic as the owning clinician.  A dedicated "api" clinician record
  // could be substituted here in future without changing the API contract.
  const [clinician] = await db
    .select({ id: clinicians.id })
    .from(clinicians)
    .where(eq(clinicians.clinicId, clinicId))
    .limit(1);

  if (!clinician) {
    return NextResponse.json(
      { error: "No clinician found for this clinic — create one first" },
      { status: 422 },
    );
  }

  // ── Insert ────────────────────────────────────────────────────────────────
  const [created] = await db
    .insert(clients)
    .values({
      clinicId,
      clinicianId: clinician.id,
      name:        body.name.trim(),
      email:       body.email?.trim() ?? undefined,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      notes:       body.notes?.trim() ?? undefined,
    })
    .returning({
      id:          clients.id,
      name:        clients.name,
      email:       clients.email,
      dateOfBirth: clients.dateOfBirth,
      active:      clients.active,
      createdAt:   clients.createdAt,
    });

  return NextResponse.json(created, { status: 201 });
}
