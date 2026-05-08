// AI-detected pattern insights. Each one is a single observation pulled from
// the cross-session data, with the supporting evidence inlined so the user
// can see *why* the AI thinks it. The "premium feel" rule from the research:
// explainable AI surfaces with citations.
//
// Real app generates these from a server action over the actual sessions +
// outcome measures + check-ins + wearable sync. The demo ships fixed
// illustrative observations.

export type Insight = {
  id: string;
  headline: string;       // one-line plain-English finding
  detail: string;         // 1–2 sentences of supporting evidence
  source: string;         // what data backs it up — shown as a tiny chip
  confidence: "high" | "medium" | "low";
  // For both clinician and home-user views — copy reads naturally either way.
};

export const SARAH_INSIGHTS: Insight[] = [
  {
    id: "sleep-focus",
    headline: "Focus is highest after 7+ hours of sleep.",
    detail: "Sessions following nights with at least 7 hours of sleep average a focus score of 78 (vs 64 on shorter nights).",
    source: "Last 12 sessions \u00b7 Oura Ring sync",
    confidence: "high",
  },
  {
    id: "morning-better",
    headline: "Morning sessions outperform afternoons by ~12 points.",
    detail: "Sessions started before noon average 81 focus; sessions after 3 PM average 69.",
    source: "Last 20 sessions \u00b7 session timestamps",
    confidence: "high",
  },
  {
    id: "mood-corr",
    headline: "Self-reported mood tracks the focus trend with a one-day lag.",
    detail: "When mood drops, the next day's focus score also drops about 6 points on average. Useful early signal for protocol review.",
    source: "Last 30 days \u00b7 daily check-ins + sessions",
    confidence: "medium",
  },
  {
    id: "hrv-anxiety",
    headline: "Higher resting HRV correlates with lower self-reported anxiety.",
    detail: "Days with HRV above 50 ms show a 3-point drop in next-day GAD-style anxiety score.",
    source: "Last 30 days \u00b7 Polar HRV + check-ins",
    confidence: "medium",
  },
];
