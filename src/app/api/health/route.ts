// ── Health check endpoint ───────────────────────────────────────────────────
// For uptime monitors (Vercel cron, UptimeRobot, Datadog, etc.).
//
// /api/health           — fast liveness check (200 if the process is up)
// /api/health?deep=1    — deeper readiness check (also pings the DB)
//
// Always returns JSON. Deep check returns 503 if any downstream is
// unhealthy so monitors can alert correctly.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface HealthBody {
  status: "ok" | "degraded";
  uptime: number;            // seconds since process start
  timestamp: string;
  checks?: Record<string, { ok: boolean; latencyMs?: number; error?: string }>;
}

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "1";

  const body: HealthBody = {
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  if (!deep) {
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  }

  body.checks = {};
  // DB ping — a trivial SELECT 1 confirms the connection pool can reach
  // Neon. The query is bounded by the pool's statement timeout.
  const dbStart = Date.now();
  try {
    await db.execute(sql`select 1`);
    body.checks.db = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (e) {
    body.checks.db = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: e instanceof Error ? e.message : String(e),
    };
    body.status = "degraded";
  }

  return NextResponse.json(body, {
    status: body.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
