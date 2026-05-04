"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getLatestSessionData } from "./actions";

type DataPoint = {
  id: string;
  timestampMs: number;
  rewardScore: number | null;
  oxyHbLeft: number | null;
  oxyHbRight: number | null;
  theta: number | null;
  alpha: number | null;
  heartRate: number | null;
};

type Annotation = {
  id: string;
  label: string;
  timestamp: Date;
};

const STAMP_LABELS = [
  "Good focus",
  "Artifact detected",
  "Protocol adjustment",
  "Client distracted",
];

function RewardChart({ points }: { points: DataPoint[] }) {
  const w = 500;
  const h = 160;
  const pad = { top: 16, right: 12, bottom: 24, left: 36 };

  const rewardPoints = points.filter((p) => p.rewardScore != null);
  if (rewardPoints.length < 2) {
    return (
      <div
        style={{
          width: "100%",
          height: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94A3B8",
          fontSize: 13,
        }}
      >
        Waiting for data...
      </div>
    );
  }

  const minT = rewardPoints[0].timestampMs;
  const maxT = rewardPoints[rewardPoints.length - 1].timestampMs;
  const tRange = Math.max(maxT - minT, 1);
  const scores = rewardPoints.map((p) => p.rewardScore as number);
  const minScore = Math.max(0, Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);
  const scoreRange = Math.max(maxScore - minScore, 1);

  const toX = (t: number) =>
    pad.left + ((t - minT) / tRange) * (w - pad.left - pad.right);
  const toY = (s: number) =>
    pad.top + (1 - (s - minScore) / scoreRange) * (h - pad.top - pad.bottom);

  const pathD = rewardPoints
    .map((p, i) => {
      const x = toX(p.timestampMs);
      const y = toY(p.rewardScore as number);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Fill area under curve
  const firstX = toX(rewardPoints[0].timestampMs).toFixed(1);
  const lastX = toX(rewardPoints[rewardPoints.length - 1].timestampMs).toFixed(1);
  const baseline = (h - pad.bottom).toFixed(1);
  const fillD = `${pathD} L${lastX},${baseline} L${firstX},${baseline} Z`;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100].filter((v) => v >= minScore && v <= maxScore);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Grid lines */}
      {yLabels.map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line
              x1={pad.left}
              y1={y}
              x2={w - pad.right}
              y2={y}
              stroke="#F1F5F9"
              strokeWidth={1}
            />
            <text
              x={pad.left - 4}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="#94A3B8"
            >
              {v}
            </text>
          </g>
        );
      })}
      {/* Fill */}
      <path d={fillD} fill="rgba(37,99,235,0.06)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#2563EB" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* Latest dot */}
      {(() => {
        const last = rewardPoints[rewardPoints.length - 1];
        const cx = toX(last.timestampMs);
        const cy = toY(last.rewardScore as number);
        return (
          <circle cx={cx} cy={cy} r={4} fill="#2563EB" />
        );
      })()}
    </svg>
  );
}

function MetricChip({
  label,
  value,
  unit = "",
  color = "#2563EB",
}: {
  label: string;
  value: number | null;
  unit?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "12px 14px",
        minWidth: 0,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: value != null ? color : "#CBD5E1" }}>
        {value != null ? `${value.toFixed(2)}${unit}` : "—"}
      </div>
    </div>
  );
}

export function SupervisionView({
  sessionId,
  clientName,
  startedAt,
  deviceType,
  initialDataPoints,
}: {
  sessionId: string;
  clientName: string;
  startedAt: string;
  deviceType: string;
  initialDataPoints: DataPoint[];
}) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(initialDataPoints);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [clinicianNotes, setClinicianNotes] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer
  useEffect(() => {
    const startMs = new Date(startedAt).getTime();
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [startedAt]);

  const poll = useCallback(async () => {
    const fresh = await getLatestSessionData(sessionId);
    if (fresh && fresh.length > 0) {
      setDataPoints(fresh as DataPoint[]);
      setLastUpdated(new Date());
    }
  }, [sessionId]);

  // Polling
  useEffect(() => {
    if (!isLive) return;
    pollRef.current = setInterval(poll, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLive, poll]);

  function handleEndSupervision() {
    setIsLive(false);
    setEnded(true);
    if (pollRef.current) clearInterval(pollRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
  }

  function handleStamp(label: string) {
    setAnnotations((prev) => [
      { id: crypto.randomUUID(), label, timestamp: new Date() },
      ...prev,
    ]);
  }

  // Derive latest metrics from last data point
  const latest = dataPoints[dataPoints.length - 1] ?? null;
  const currentReward = latest?.rewardScore ?? null;

  // Summary stats
  const rewardValues = dataPoints.map((p) => p.rewardScore).filter((v): v is number => v != null);
  const avgReward = rewardValues.length > 0 ? rewardValues.reduce((a, b) => a + b, 0) / rewardValues.length : null;
  const peakReward = rewardValues.length > 0 ? Math.max(...rewardValues) : null;

  function formatElapsed(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header bar */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Live badge */}
        {isLive && !ended ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#16A34A",
                animation: "livePulse 1.5s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", letterSpacing: "0.05em" }}>
              LIVE
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em" }}>
            ENDED
          </div>
        )}

        <div style={{ height: 20, width: 1, background: "#E2E8F0" }} />

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Live Supervision</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            {clientName} · <span style={{ textTransform: "capitalize" }}>{deviceType}</span>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
            {formatElapsed(elapsed)}
          </div>
          {!ended && (
            <button
              onClick={handleEndSupervision}
              style={{
                padding: "8px 16px",
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              End Supervision
            </button>
          )}
          <Link
            href="/sessions"
            style={{
              padding: "8px 14px",
              background: "#F1F5F9",
              color: "#475569",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Sessions
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>

      {/* Ended summary */}
      {ended && (
        <div
          style={{
            background: "#F0FDF4",
            borderBottom: "1px solid #BBF7D0",
            padding: "12px 24px",
            display: "flex",
            gap: 32,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Session ended</span>
          {avgReward != null && (
            <span style={{ fontSize: 13, color: "#166534" }}>
              Avg Reward: <strong>{avgReward.toFixed(1)}%</strong>
            </span>
          )}
          {peakReward != null && (
            <span style={{ fontSize: 13, color: "#166534" }}>
              Peak: <strong>{peakReward.toFixed(1)}%</strong>
            </span>
          )}
          <span style={{ fontSize: 13, color: "#166534" }}>
            Duration: <strong>{formatElapsed(elapsed)}</strong>
          </span>
          <span style={{ fontSize: 13, color: "#166534" }}>
            Annotations: <strong>{annotations.length}</strong>
          </span>
        </div>
      )}

      {/* Main 2-column layout */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 20px",
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* LEFT: Chart */}
        <div>
          {/* Reward score card */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "20px 20px 16px",
              border: "1px solid #E2E8F0",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Reward Score
                </div>
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color:
                      currentReward == null
                        ? "#CBD5E1"
                        : currentReward >= 70
                        ? "#16A34A"
                        : currentReward >= 40
                        ? "#D97706"
                        : "#DC2626",
                  }}
                >
                  {currentReward != null ? `${currentReward.toFixed(0)}` : "—"}
                  {currentReward != null && (
                    <span style={{ fontSize: 20, fontWeight: 500, color: "#94A3B8", marginLeft: 2 }}>%</span>
                  )}
                </div>
              </div>
              {avgReward != null && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Session avg</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#475569" }}>
                    {avgReward.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
            <RewardChart points={dataPoints} />
          </div>

          {/* Last updated */}
          {!ended && (
            <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "right" }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* RIGHT: Metrics + controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Metric chips */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "16px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Live Metrics
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <MetricChip label="OxyHb L" value={latest?.oxyHbLeft ?? null} />
              <MetricChip label="OxyHb R" value={latest?.oxyHbRight ?? null} color="#7C3AED" />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <MetricChip label="Theta" value={latest?.theta ?? null} color="#D97706" />
              <MetricChip label="Alpha" value={latest?.alpha ?? null} color="#059669" />
            </div>
            {latest?.heartRate != null && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Heart Rate
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#DC2626" }}>
                    {latest.heartRate.toFixed(0)}
                  </span>
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>BPM</span>
                </div>
              </div>
            )}
          </div>

          {/* Clinician notes */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "16px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Session Notes
            </div>
            <textarea
              value={clinicianNotes}
              onChange={(e) => setClinicianNotes(e.target.value)}
              placeholder="Type session notes here..."
              rows={4}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                color: "#0F172A",
                resize: "vertical" as const,
                boxSizing: "border-box" as const,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Quick stamps */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "16px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Quick Stamps
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {STAMP_LABELS.map((label) => (
                <button
                  key={label}
                  onClick={() => handleStamp(label)}
                  style={{
                    padding: "8px 10px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "background 0.1s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Annotation list */}
            {annotations.length > 0 && (
              <div style={{ marginTop: 12, borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 8 }}>
                  Recent Annotations
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {annotations.slice(0, 8).map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: "#334155", fontWeight: 500 }}>{a.label}</span>
                      <span style={{ color: "#94A3B8" }}>
                        {a.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
