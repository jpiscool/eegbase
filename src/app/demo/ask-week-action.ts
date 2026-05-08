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

export async function askAboutWeek(history: AskMessage[]): Promise<AskWeekResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY is not configured. Set it in Vercel project settings to enable live AI.",
    };
  }
  if (!Array.isArray(history) || history.length === 0) {
    return { ok: false, error: "No messages provided." };
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
