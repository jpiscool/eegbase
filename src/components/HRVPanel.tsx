"use client";

interface Props {
  heartRate: number | null;
  rmssd: number | null;
}

function coherenceInfo(rmssd: number | null): {
  label: string;
  textStyle: React.CSSProperties;
  bgStyle: React.CSSProperties;
} {
  if (rmssd == null)
    return {
      label: "No signal",
      textStyle: { color: "var(--text-tertiary)" },
      bgStyle: { background: "var(--surface-sunken)" },
    };
  if (rmssd >= 60)
    return {
      label: "High Coherence",
      textStyle: { color: "var(--success)" },
      bgStyle: { background: "var(--success-subtle)" },
    };
  if (rmssd >= 35)
    return {
      label: "Moderate Coherence",
      textStyle: { color: "var(--warning)" },
      bgStyle: { background: "var(--warning-subtle)" },
    };
  return {
    label: "Low Coherence",
    textStyle: { color: "var(--danger)" },
    bgStyle: { background: "var(--danger-subtle)" },
  };
}

export function HRVPanel({ heartRate, rmssd }: Props) {
  if (heartRate == null && rmssd == null) return null;

  const { label, textStyle, bgStyle } = coherenceInfo(rmssd);

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-8">
        {/* Heart Rate */}
        <div className="text-center">
          <p
            className="text-3xl font-bold tabular-nums"
            style={{ color: "#EF4444" }}
          >
            {heartRate != null ? Math.round(heartRate) : "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Heart Rate
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            BPM
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-12" style={{ background: "var(--border-subtle)" }} />

        {/* HRV RMSSD */}
        <div className="text-center">
          <p
            className="text-3xl font-bold tabular-nums"
            style={{ color: "#8B5CF6" }}
          >
            {rmssd != null ? Math.round(rmssd) : "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            HRV RMSSD
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            ms
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-12" style={{ background: "var(--border-subtle)" }} />

        {/* Coherence badge */}
        <div
          className="flex-1 rounded-lg px-4 py-3"
          style={bgStyle}
        >
          <p className="text-sm font-semibold" style={textStyle}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
