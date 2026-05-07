"use server";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Demo-only Claude Haiku call for the AI Insights tab.
 *
 * Takes the fixed demo seed data and asks Claude for a 2-3 sentence
 * clinical interpretation of the cross-session correlations. Proves
 * the AI tier is real (not mocked) during a live pitch.
 *
 * No auth — this is a public demo. The prompt is fully server-side
 * and the canned context constrains the response, so abuse surface
 * is minimal. Caps max_tokens at 250.
 */

// Fixed demo context — matches the values shown in the AI Insights tab
const DEMO_CONTEXT = `Client: Sarah, anxiety + low mood, 8 sessions of Mendi prefrontal fNIRS training.

Top correlations (Spearman, n=8):
- Sleep efficiency (Oura): r = +0.74 with ΔHbO. Sessions following ≥85% sleep efficiency saw +18% mean ΔHbO vs <85% nights.
- Pre-session mood (1-10 check-in): r = +0.62 with reward score. Mood ≥7 produced mean reward 78 vs 61 on lower-mood days.
- Caffeine within 2h pre-session: r = -0.58. Elevated theta and lower OxyHb gain after late caffeine.

Multi-modal correlations:
- ΔHbO L (Mendi) ↔ Reward = 0.81
- ΔHbO L ↔ Sleep = 0.74
- Reward ↔ Sleep = 0.68
- ΔHbO L ↔ HRV RMSSD = 0.41`;

export type DemoInsightResult =
  | { ok: true; text: string; model: string; latencyMs: number }
  | { ok: false; error: string };

export async function generateDemoInsight(): Promise<DemoInsightResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error:
        "ANTHROPIC_API_KEY is not configured. Set it in Vercel project settings to enable live AI.",
    };
  }

  const prompt = `You are a senior neurofeedback clinician. Read the cross-session pattern data below and write a 2-3 sentence clinical interpretation in plain prose (no markdown, no bullets, no headings). State the strongest driver, the strongest negative factor, and one concrete protocol or scheduling recommendation.

${DEMO_CONTEXT}`;

  const start = Date.now();
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = "claude-haiku-4-5-20251001";
    const message = await client.messages.create({
      model,
      max_tokens: 250,
      messages: [{ role: "user", content: prompt }],
    });
    const latencyMs = Date.now() - start;
    const text =
      message.content[0]?.type === "text"
        ? message.content[0].text.trim()
        : "";
    if (!text) {
      return { ok: false, error: "Empty response from Claude." };
    }
    return { ok: true, text, model, latencyMs };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message ?? "Claude call failed.",
    };
  }
}
