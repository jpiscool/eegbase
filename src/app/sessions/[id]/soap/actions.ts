"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { soapNotes, sessions, clients, protocols } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";

export async function saveSoapNote(
  sessionId: string,
  data: { subjective: string; objective: string; assessment: string; plan: string }
) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [row] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error("Unauthorized");

  await db
    .insert(soapNotes)
    .values({ sessionId, ...data })
    .onConflictDoUpdate({
      target: soapNotes.sessionId,
      set: { ...data, updatedAt: new Date() },
    });

  revalidatePath(`/sessions/${sessionId}/soap`);
}

export async function draftSoapSection(
  sessionId: string,
  section: "assessment" | "plan",
  context: { subjective: string; objective: string }
): Promise<string> {
  const authSession = await auth();
  const clinicId = (authSession?.user as { clinicId?: string })?.clinicId ?? "";

  const [row] = await db
    .select({
      s: sessions,
      clientName: clients.name,
      clientGoals: clients.goals,
      protocolName: protocols.name,
    })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error("Unauthorized");

  const s = row.s;
  const durationMin = s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : null;

  const sessionSummary = [
    `Client: ${row.clientName}`,
    row.clientGoals ? `Client goals: ${row.clientGoals}` : null,
    row.protocolName ? `Protocol: ${row.protocolName}` : null,
    durationMin != null ? `Duration: ${durationMin} minutes` : null,
    s.avgRewardScore != null ? `Average reward score: ${s.avgRewardScore.toFixed(1)}%` : null,
    s.preFocus != null && s.postFocus != null ? `Focus: ${s.preFocus} → ${s.postFocus}/10` : null,
    s.preMood != null && s.postMood != null ? `Mood: ${s.preMood} → ${s.postMood}/10` : null,
    s.preAnxiety != null && s.postAnxiety != null ? `Anxiety: ${s.preAnxiety} → ${s.postAnxiety}/10` : null,
    s.preEnergy != null && s.postEnergy != null ? `Energy: ${s.preEnergy} → ${s.postEnergy}/10` : null,
    context.subjective ? `Subjective (clinician notes): ${context.subjective}` : null,
    context.objective ? `Objective data: ${context.objective}` : null,
  ].filter(Boolean).join("\n");

  const prompts: Record<"assessment" | "plan", string> = {
    assessment: `Write a concise clinical Assessment section for a SOAP note for a neurofeedback session.
Interpret the session data below and provide: (1) brief clinical interpretation of the reward score and any pre/post rating changes, (2) observations about protocol fit and client response, (3) progress toward goals if mentioned.
Be clinical but concise — 3–5 sentences. Do not use bullet points. Write in third person (e.g. "Client demonstrated...").`,
    plan: `Write a concise clinical Plan section for a SOAP note for a neurofeedback session.
Based on the session data below, provide: (1) protocol continuation or adjustment recommendation, (2) suggested frequency or next session focus, (3) any homework or lifestyle recommendations relevant to neurofeedback outcomes.
Be clinical but concise — 3–5 sentences. Do not use bullet points. Write in third person (e.g. "Client will continue...").`,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback template if no API key configured
    if (section === "assessment") {
      const score = s.avgRewardScore;
      const level = score == null ? "unavailable" : score >= 70 ? "strong" : score >= 40 ? "moderate" : "below target";
      return `Client demonstrated ${level} engagement during today's session${row.protocolName ? ` using the ${row.protocolName} protocol` : ""}. ${durationMin != null ? `Session duration of ${durationMin} minutes was completed as planned. ` : ""}${s.preFocus != null && s.postFocus != null ? `Focus ratings shifted from ${s.preFocus} to ${s.postFocus}/10, indicating ${s.postFocus > s.preFocus ? "a positive post-session effect" : "no significant change in self-reported focus"}. ` : ""}Overall response to the protocol appears consistent with expected outcomes at this stage of training.`;
    } else {
      return `Client will continue the current protocol at the established training parameters. Next session is recommended within the standard interval to maintain training momentum. Client is encouraged to maintain consistent sleep and stress management practices to optimize neurofeedback outcomes. Clinician will reassess protocol parameters after the next session based on ongoing reward score trends.`;
    }
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: "You are a licensed neurofeedback clinician writing precise, professional clinical SOAP notes. Use clinical language appropriate for a health record. Be concise.",
    messages: [
      {
        role: "user",
        content: `${prompts[section]}\n\nSession data:\n${sessionSummary}`,
      },
    ],
  });

  const text = message.content[0];
  return text.type === "text" ? text.text.trim() : "";
}
