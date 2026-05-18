// ── Auth guard helpers ──────────────────────────────────────────────────────
// The `clinicId ?? ""` pattern that crashed /sessions/live (Postgres uuid
// cast rejected "") still appears in ~58 files. Middleware blocks the
// HTTP path so users can't trigger it via the browser, but server actions
// (POSTed directly) bypass middleware. This module gives a single
// throw-on-missing guard so action code reads cleanly:
//
//   const { clinicId, clinicianId, clinicianName } = await requireClinic();
//
// Replace `auth() + nullish-coalesce` with a single call. The thrown
// Error makes Next.js render the route-level error.tsx, which now logs
// to console with the error.digest so we get traceability.

import { auth } from "@/lib/auth/config";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NoClinicError extends Error {
  constructor() {
    super("Account has no clinic association — contact your administrator.");
    this.name = "NoClinicError";
  }
}

export interface ClinicContext {
  clinicId: string;
  clinicianId: string;
  clinicianName: string | undefined;
  clinicianEmail: string | undefined;
  role: string | undefined;
}

/**
 * Returns the authenticated clinician's clinic-scoped context, or throws
 * UnauthorizedError / NoClinicError. NEVER returns a placeholder empty
 * string — callers can safely use the returned clinicId directly in
 * uuid-typed Postgres parameters.
 */
export async function requireClinic(): Promise<ClinicContext> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  const u = session.user as {
    id?: string;
    name?: string;
    email?: string;
    clinicId?: string;
    role?: string;
  };
  if (!u.id) throw new UnauthorizedError("Session missing clinician id");
  if (!u.clinicId) throw new NoClinicError();
  return {
    clinicId: u.clinicId,
    clinicianId: u.id,
    clinicianName: u.name,
    clinicianEmail: u.email,
    role: u.role,
  };
}
