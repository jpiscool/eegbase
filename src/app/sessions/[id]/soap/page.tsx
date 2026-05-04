import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, soapNotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { SoapNoteEditor } from "@/components/SoapNoteEditor";

export default async function SoapNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [[row], [note]] = await Promise.all([
    db
      .select({
        session: sessions,
        clientName: clients.name,
        clientId: clients.id,
        protocolName: protocols.name,
      })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(eq(sessions.id, id))
      .limit(1),
    db
      .select()
      .from(soapNotes)
      .where(eq(soapNotes.sessionId, id))
      .limit(1),
  ]);

  if (!row) notFound();

  const s = row.session;
  const dateStr = new Date(s.startedAt).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const durationMin = s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : null;

  // Auto-generate objective field from session metrics
  const objectiveParts: string[] = [];
  objectiveParts.push(`Device: ${s.deviceType.charAt(0).toUpperCase() + s.deviceType.slice(1)}`);
  if (row.protocolName) objectiveParts.push(`Protocol: ${row.protocolName}`);
  if (durationMin != null) objectiveParts.push(`Duration: ${durationMin} min`);
  if (s.avgRewardScore != null) objectiveParts.push(`Avg reward score: ${s.avgRewardScore.toFixed(1)}%`);
  const metricParts: string[] = [];
  if (s.preFocus != null && s.postFocus != null)
    metricParts.push(`Focus ${s.preFocus}→${s.postFocus}`);
  if (s.preMood != null && s.postMood != null)
    metricParts.push(`Mood ${s.preMood}→${s.postMood}`);
  if (s.preAnxiety != null && s.postAnxiety != null)
    metricParts.push(`Anxiety ${s.preAnxiety}→${s.postAnxiety}`);
  if (s.preEnergy != null && s.postEnergy != null)
    metricParts.push(`Energy ${s.preEnergy}→${s.postEnergy}`);
  if (metricParts.length > 0)
    objectiveParts.push(`Pre→Post ratings: ${metricParts.join(", ")}`);
  const autoObjective = objectiveParts.join(". ") + ".";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/sessions/${id}`}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} style={{ color: "var(--brand)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>SOAP Note</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <Link href={`/clients/${row.clientId}`} className="hover:underline" style={{ color: "var(--brand)" }}>
              {row.clientName}
            </Link>
            {" · "}{dateStr}
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <SoapNoteEditor
          sessionId={id}
          existing={note ? {
            subjective: note.subjective ?? "",
            objective: note.objective ?? "",
            assessment: note.assessment ?? "",
            plan: note.plan ?? "",
          } : null}
          autoObjective={autoObjective}
        />
      </div>

      <div className="mt-4 px-1">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          SOAP notes are saved to the client record and can be included in progress reports.
          {note && (
            <> Last updated: {new Date(note.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.</>
          )}
        </p>
      </div>
    </div>
  );
}
