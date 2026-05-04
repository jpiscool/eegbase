import { db } from "@/lib/db"
import { auditLogs } from "@/lib/db/schema"
import { headers } from "next/headers"

interface AuditEvent {
  clinicId: string
  clinicianId?: string
  clinicianName?: string
  action: string
  resourceType?: string
  resourceId?: string
  resourceLabel?: string
}

export async function logAuditEvent(event: AuditEvent) {
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? headersList.get("x-real-ip") ?? "unknown"
    const ua = headersList.get("user-agent") ?? undefined

    await db.insert(auditLogs).values({
      ...event,
      ipAddress: ip,
      userAgent: ua,
    })
  } catch {
    // Audit log failures should never break the main request
  }
}
