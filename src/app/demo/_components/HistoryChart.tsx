"use client";

import { LiveChart } from "@/components/LiveChart";

interface HistoryChartProps {
  // Raw scores 0–100, oldest → newest. We'll normalize to 0–1 for LiveChart.
  scores: number[];
  title: string;
  unit?: string; // e.g. "focus score"
}

// Static history view — wraps the canvas LiveChart with a one-line summary
// underneath. Default unit is "focus score." For home users we render as
// "Your progress."
export function HistoryChart({ scores, title, unit = "focus score" }: HistoryChartProps) {
  if (scores.length < 2) return null;

  const normalized = scores.map((s) => Math.max(0, Math.min(1, s / 100)));
  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;
  const arrow = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const accent = delta > 0 ? "#10B981" : delta < 0 ? "#EF4444" : "#94A3B8";

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="rounded-xl overflow-hidden">
        <LiveChart data={normalized} color={accent} label={title} height={120} />
      </div>
      <p className="text-sm text-gray-700 mt-3 leading-relaxed">
        <span className="font-semibold tabular-nums" style={{ color: accent }}>
          {arrow === "up" && "↑ "}
          {arrow === "down" && "↓ "}
          {Math.abs(delta).toFixed(0)}
        </span>{" "}
        {arrow === "up" && `point ${unit} improvement over ${scores.length} sessions.`}
        {arrow === "down" && `point ${unit} drop over ${scores.length} sessions.`}
        {arrow === "flat" && `${unit} steady across ${scores.length} sessions.`}
      </p>
    </section>
  );
}
