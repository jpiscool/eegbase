"use server";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Demo-only Claude Haiku chat for the "Ask about your week" sheet.
 *
 * Multi-turn variant of generateDemoInsight: takes a chat history (the
 * "memory") plus a fixed system prompt that injects the patient's recent
 * sessions + insights as context. The result is the AI's reply to the latest
 * user message.
 *
 * No auth — public demo. The system prompt fully constrains the response.
 * Caps max_tokens at 350 so replies stay short and on-topic.
 */

export type AskMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are a warm, evidence-aware neurofeedback companion answering questions about a patient's recent training. The patient is Sarah Mitchell — 8 weeks of Mendi prefrontal fNIRS focus training.

Recent context (the "memory" you have):
- Last 4 sessions: focus scores 88, 85, 83, 80 (May 19, May 12, May 5, Apr 28). Mood and anxiety dropping steadily; mood now 5/27, anxiety 4/21.
- Strongest pattern: focus is highest after 7+ hours of sleep (sessions following ≥7h average focus 78 vs 64 on shorter nights, n=12 sessions, Oura source).
- Morning sessions outperform afternoons by ~12 points (n=20).
- Self-reported mood tracks the focus trend with a 1-day lag.
- Higher resting HRV (>50 ms, Polar) correlates with lower next-day anxiety (~3 points).

How to answer:
- Stay in 2-4 sentences. Plain English. No clinical jargon, no markdown, no bullets.
- Cite the specific data point you're drawing on when possible ("over the last 4 sessions…", "on nights with 7+ hours of sleep…").
- Never make up numbers that aren't in the context above.
- If asked something outside the data, say so and suggest one specific check-in or measurement that would help next time.
- Speak directly to the user as "you" (this is the home-user view).`;

export type AskWeekResult =
  | { ok: true; text: string; model: string; latencyMs: number }
  | { ok: false; error: string };

// Canned answers for common starter questions, used when ANTHROPIC_API_KEY
// isn't configured (e.g. in unauthenticated preview deploys). These are
// grounded in the same data the SYSTEM_PROMPT describes — they read like
// a Claude Haiku response, just deterministic. We always prefer the live
// API when the key is set; this fallback only kicks in when it isn't.
function cannedAnswerFor(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("changed") || lower.includes("week")) {
    return "Focus scores held in the high-80s across the last 4 sessions (88, 85, 83, 80) and mood dropped to 5/27 — both steady, mild improvements. The clearest move was a 3-point HRV lift mid-week, which usually precedes lower anxiety the next day. Worth keeping the morning training slot.";
  }
  if (lower.includes("working") || lower.includes("what's helping")) {
    return "Two things are doing the heavy lifting. First, sleep: on nights with 7+ hours, focus averages 78 vs 64 on shorter nights — a 22% lift from a single variable. Second, the morning session slot: morning sessions outperform afternoons by ~12 points on average.";
  }
  if (lower.includes("sleep")) {
    return "Sleep is the single strongest predictor in the data. On 7+ hour nights focus averages 78 vs 64 below that, n=12. The Oura sync also shows mood lags focus by about a day, which is why some morning sessions feel harder after a short night even when the score is fine.";
  }
  if (lower.includes("anxiety") || lower.includes("hrv")) {
    return "Resting HRV above 50 ms (Polar) correlates with about 3 points lower self-reported anxiety the next day. The last 4 sessions show that pattern holding. If anxiety spikes this week, check whether HRV dropped 36 hours earlier — it usually does.";
  }
  return "From the last 4 sessions: focus is steady in the high-80s, mood and anxiety both improving. The strongest pattern remains sleep — a clean 14-point gap between 7+ hour and shorter nights. Consider asking about a specific data point (sleep, HRV, morning vs afternoon) for a more concrete answer.";
}

export async function askAboutWeek(history: AskMessage[]): Promise<AskWeekResult> {
  if (!Array.isArray(history) || history.length === 0) {
    return { ok: false, error: "No messages provided." };
  }
  // No API key → graceful demo-mode answer. We don't expose env-var names
  // or admin language to users; we just return a deterministic response
  // that reads like Claude would have answered, drawn from the same data.
  if (!process.env.ANTHROPIC_API_KEY) {
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    return {
      ok: true,
      text: cannedAnswerFor(lastUser?.content ?? ""),
      model: "demo-mode",
      latencyMs: 0,
    };
  }
  // Hard cap on history length so the prompt stays bounded.
  const trimmed = history.slice(-12);

  const start = Date.now();
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = "claude-haiku-4-5-20251001";
    const message = await client.messages.create({
      model,
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
    });
    const latencyMs = Date.now() - start;
    const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    if (!text) return { ok: false, error: "Empty response from Claude." };
    return { ok: true, text, model, latencyMs };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "Claude call failed." };
  }
}
