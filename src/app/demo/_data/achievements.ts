// Achievements / milestones for the home-user side. Five progressive
// goalposts grounded in real clinical heuristics — no XP system, no levels,
// no badges-for-nothing. Each unlocks at a meaningful threshold.

export type Achievement = {
  id: string;
  label: string;
  hint: string;
  emoji: string;
  unlockedAt?: string; // ISO date when unlocked, undefined if locked
  progress?: number;   // 0–100 for in-flight ones
};

// Sarah's progress as of "today" — drives the grid in PatientsView (home).
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-session",
    label: "First session",
    hint: "You showed up. That\u2019s the hardest part.",
    emoji: "\u{1F331}", // 🌱
    unlockedAt: "2026-01-06",
  },
  {
    id: "five-sessions",
    label: "5 sessions",
    hint: "Most people start to feel a difference here.",
    emoji: "\u{1F4AB}", // 💫
    unlockedAt: "2026-02-03",
  },
  {
    id: "twenty-sessions",
    label: "20 sessions",
    hint: "The protocol kicks in around now.",
    emoji: "\u{1F389}", // 🎉
    unlockedAt: "2026-05-19",
  },
  {
    id: "week-streak",
    label: "7-day streak",
    hint: "Every day for a week. Hard to do.",
    emoji: "\u{1F525}", // 🔥
    progress: 71, // 5 of 7 days, locked
  },
  {
    id: "thirty-sessions",
    label: "30 sessions",
    hint: "The change usually sticks here.",
    emoji: "\u{1F3C6}", // 🏆
    progress: 67, // 20 of 30, locked
  },
];
