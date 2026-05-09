"use server";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Phase 31 — Polish a raw voice-transcribed session note into a clean SOAP-
 * style draft. Demo-only: same pattern as ask-week-action.ts, with a graceful
 * fallback when ANTHROPIC_API_KEY isn't set.
 */

const SYSTEM_PROMPT = `You are a clinical scribe converting a clinician's spoken-aloud session note into a clean, formal SOAP-style note.

Rules:
- Keep the clinical content the clinician spoke; don't add observations they didn't say.
- Fix dictation artifacts ("um", "uh", repeated words, mid-sentence corrections).
- Format as 3-4 short paragraphs OR Subjective / Objective / Assessment / Plan headers if the content fits.
- Plain English; no markdown formatting characters in the output.
- 200 words max. If the input is shorter, keep the output proportional.
- If the transcript is unintelligible or empty, return exactly: "No usable transcript captured."`;

export type PolishResult =
  | { ok: true; text: string; model: string; latencyMs: number }
  | { ok: false; error: string };

// Deterministic fallback when no API key. Mirrors the structure Claude would
// produce so the demo always shows the "after" state cleanly.
function cannedPolish(transcript: string): string {
  const trimmed = transcript.trim();
  if (!trimmed) return "No usable transcript captured.";
  // The canned version preserves the user's words but cleans common dictation
  // artifacts and adds light SOAP scaffolding so the demo shows the value.
  const cleaned = trimmed
    .replace(/\b(um|uh|er|ah|like)\b\s*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
  // Split into sentences for light Subjective/Objective parsing.
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) {
    return `Subjective: ${cleaned}\n\nObjective: Session completed. Reward score and engagement consistent with prior visits.\n\nAssessment: Continue current protocol; no clinical concerns noted.\n\nPlan: Next session as scheduled.`;
  }
  const half = Math.ceil(sentences.length / 2);
  const subjective = sentences.slice(0, half).join(" ");
  const objective = sentences.slice(half).join(" ");
  return `Subjective: ${subjective}\n\nObjective: ${objective}\n\nAssessment: Engagement appropriate for current protocol; no clinical concerns noted.\n\nPlan: Continue current protocol; reassess next visit.`;
}

export async function polishNote(transcript: string): Promise<PolishResult> {
  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    return { ok: false, error: "Empty transcript." };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: true,
      text: cannedPolish(transcript),
      model: "demo-mode",
      latencyMs: 0,
    };
  }
  const start = Date.now();
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = "claude-haiku-4-5-20251001";
    const message = await client.messages.create({
      model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: transcript }],
    });
    const latencyMs = Date.now() - start;
    const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    if (!text) return { ok: false, error: "Empty response from Claude." };
    return { ok: true, text, model, latencyMs };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "Claude call failed." };
  }
}
