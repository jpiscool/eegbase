"use client";

import { useState } from "react";

interface Props {
  oxyHbLeft: number | null;
  oxyHbRight: number | null;
  deoxyHbLeft?: number | null;
  deoxyHbRight?: number | null;
  alpha: number | null;
  theta: number | null;
  beta: number | null;
  title?: string;
}

// Heat-map color: cool blue (low) → cyan (mid-low) → green (target) → amber (mid-high) → red (high)
function heatColor(t: number): string {
  // t in [0, 1]
  const x = Math.max(0, Math.min(1, t));
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [37, 99, 235]],     // blue
    [0.3, [6, 182, 212]],     // cyan
    [0.55, [16, 185, 129]],   // green
    [0.75, [245, 158, 11]],   // amber
    [1.0, [239, 68, 68]],     // red
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (x >= t0 && x <= t1) {
      const k = (x - t0) / (t1 - t0);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * k);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * k);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * k);
      return `rgb(${r},${g},${b})`;
    }
  }
  return "rgb(100,100,100)";
}

// Map a raw value to [0,1] heat range
function normalizeOxy(v: number | null): number {
  if (v == null) return -1;
  // values typically -0.5 to +0.5; remap to 0–1
  return (v + 0.5);
}

function normalizeBand(v: number | null): number {
  if (v == null) return -1;
  // 0–1 range for normalized band power
  return v;
}

function fmtOxy(v: number | null) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(3);
}

function fmtBand(v: number | null) {
  if (v == null) return "—";
  return v.toFixed(2);
}

interface Region {
  id: string;
  cx: number;
  cy: number;
  r: number;
  label: string;
  electrode: string;
  metric: "oxyL" | "oxyR" | "alpha" | "theta" | "beta";
  rawValue: number | null;
  normValue: number;
  band: string;
  signal: "fnirs" | "eeg"; // physical modality — fnirs comes from Mendi, eeg from Muse / multi-channel
  hhb?: number | null;     // For fNIRS: paired DeoxyHb value (Mendi captures both HbO + HHb)
}

export function BrainMapPanel({
  oxyHbLeft,
  oxyHbRight,
  deoxyHbLeft,
  deoxyHbRight,
  alpha,
  theta,
  beta,
  title = "Mendi · Live Prefrontal fNIRS",
}: Props) {
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);

  // Build the regions array — top-down brain view.
  // Mendi specs (verified against Boere/Krigolson 2023 validation study,
  // Int J Psychophysiology): 2-channel fNIRS over bilateral Brodmann
  // area 10 (dorsolateral PFC, roughly Fp1 + Fp2 in the 10-20 system),
  // dual LED at 660 nm (red) + 805 nm (NIR), ~31 Hz sampling rate
  // (downsampled from 2.5 kHz hardware), with one short channel for
  // superficial-noise removal. Each long channel captures both
  // oxygenated (HbO) and deoxygenated (HHb) hemoglobin via modified
  // Beer-Lambert. We render the HbO heat for the dot color, and
  // attach the paired HHb value for hover detail so both halves of
  // Mendi's signal are visible.
  //
  // EEG band-power channels below require a multi-channel headset (e.g.
  // Muse) and are NOT part of Mendi's signal. Kept for the optional
  // multi-vendor mode but visually distinct.
  const regions: Region[] = [
    // Mendi's actual hardware: 2 long channels (one per hemisphere) over
    // bilateral Brodmann area 10. We do NOT render the third short channel
    // here because it samples superficial blood flow at the same head
    // position — it's a noise reference, not a separate brain location.
    // Showing it as a third dot would imply a third measurement site.
    { id: "fp1", cx: 78,  cy: 60, r: 16, label: "Prefrontal L (BA10)", electrode: "Fp1", metric: "oxyL", rawValue: oxyHbLeft,  normValue: normalizeOxy(oxyHbLeft),  band: "HbO", signal: "fnirs", hhb: deoxyHbLeft  ?? null },
    { id: "fp2", cx: 142, cy: 60, r: 16, label: "Prefrontal R (BA10)", electrode: "Fp2", metric: "oxyR", rawValue: oxyHbRight, normValue: normalizeOxy(oxyHbRight), band: "HbO", signal: "fnirs", hhb: deoxyHbRight ?? null },
  ];

  return (
    <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 18, padding: 20, position: "relative", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px -16px rgba(0,0,0,0.6)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            2 long channels + 1 short · ~31 Hz · 660 + 805 nm · HbO + HHb
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#64748B", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
          <span style={{ fontWeight: 600 }}>RECORDING</span>
        </div>
      </div>

      <svg
        viewBox="0 0 220 300"
        width="100%"
        style={{ display: "block", maxWidth: 320, margin: "0 auto" }}
        aria-label="Brain activity map · top-down view"
      >
        <defs>
          {/* Brain background with subtle radial */}
          <radialGradient id="brainBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>
          {/* Heat halo gradient */}
          <radialGradient id="haloFade">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          {/* Glow filter */}
          <filter id="electrodeGlow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="electrodeSoft"><feGaussianBlur stdDeviation="1" /></filter>
        </defs>

        {/* Brain silhouette — stylized top-down */}
        <g>
          <path
            d="M 110 12
               C 60 12, 22 50, 22 110
               C 22 165, 35 220, 65 260
               C 80 280, 95 290, 110 290
               C 125 290, 140 280, 155 260
               C 185 220, 198 165, 198 110
               C 198 50, 160 12, 110 12 Z"
            fill="url(#brainBg)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Central sulcus suggestion */}
          <line x1="110" y1="14" x2="110" y2="288" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
          {/* Lobe boundary curves (subtle) */}
          <path d="M 30 110 Q 110 100 190 110" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.5" />
          <path d="M 35 175 Q 110 165 185 175" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.5" />
        </g>

        {/* Nose direction indicator (top) */}
        <path d="M 105 8 L 110 0 L 115 8 Z" fill="#475569" />
        <text x="110" y="-2" textAnchor="middle" fontSize="7" fontWeight="700" fill="#64748B" letterSpacing="0.1em">NASION</text>

        {/* Ear indicators */}
        <ellipse cx="18" cy="135" rx="3" ry="8" fill="#334155" />
        <ellipse cx="202" cy="135" rx="3" ry="8" fill="#334155" />
        <text x="10" y="138" fontSize="6" fontWeight="700" fill="#64748B">L</text>
        <text x="208" y="138" fontSize="6" fontWeight="700" fill="#64748B">R</text>

        {/* Electrode regions */}
        {regions.map((region) => {
          const hasValue = region.normValue >= 0;
          const color = hasValue ? heatColor(region.normValue) : "#475569";
          const isHovered = hoveredRegion?.id === region.id;
          return (
            <g
              key={region.id}
              onMouseEnter={() => setHoveredRegion(region)}
              onMouseLeave={() => setHoveredRegion(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Outer glow halo */}
              {hasValue && (
                <circle
                  cx={region.cx}
                  cy={region.cy}
                  r={region.r * 1.6}
                  fill={color}
                  opacity={0.18 + region.normValue * 0.25}
                  filter="url(#electrodeGlow)"
                />
              )}
              {/* Electrode circle — fNIRS gets a thicker double-ring border to mark it as a different physical modality */}
              <circle
                cx={region.cx}
                cy={region.cy}
                r={region.r}
                fill={color}
                opacity={hasValue ? 0.85 : 0.4}
                stroke={isHovered ? "white" : region.signal === "fnirs" ? "rgba(165,243,252,0.85)" : "rgba(255,255,255,0.25)"}
                strokeWidth={isHovered ? 2 : region.signal === "fnirs" ? 2 : 1}
                filter="url(#electrodeSoft)"
              />
              {/* fNIRS outer ring — visual cue this is hemoglobin (Mendi) not EEG band */}
              {region.signal === "fnirs" && (
                <circle
                  cx={region.cx}
                  cy={region.cy}
                  r={region.r + 3}
                  fill="none"
                  stroke="rgba(165,243,252,0.45)"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
              )}
              {/* Inner highlight */}
              {hasValue && (
                <circle
                  cx={region.cx - region.r * 0.3}
                  cy={region.cy - region.r * 0.3}
                  r={region.r * 0.4}
                  fill="white"
                  opacity="0.28"
                />
              )}
              {/* Electrode label */}
              <text
                x={region.cx}
                y={region.cy + 1}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="white"
                style={{ pointerEvents: "none", letterSpacing: "0.04em" }}
              >
                {region.electrode}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover detail panel */}
      <div style={{ minHeight: 60, marginTop: 14, padding: "10px 14px", background: "#1E293B", border: "1px solid #334155", borderRadius: 10, transition: "border-color 0.15s" }}>
        {hoveredRegion ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{hoveredRegion.electrode} · {hoveredRegion.label}</span>
                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: hoveredRegion.signal === "fnirs" ? "rgba(165,243,252,0.18)" : "rgba(148,163,184,0.18)", color: hoveredRegion.signal === "fnirs" ? "#A5F3FC" : "#94A3B8", letterSpacing: "0.04em" }}>
                  {hoveredRegion.signal === "fnirs" ? "fNIRS · Mendi" : "EEG band · Muse"}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>
                {hoveredRegion.signal === "fnirs" ? (
                  <>
                    HbO: <span style={{ color: "#A5F3FC" }}>{fmtOxy(hoveredRegion.rawValue)}</span>
                    {hoveredRegion.hhb != null && (
                      <span style={{ marginLeft: 10, fontWeight: 600 }}>
                        HHb: <span style={{ color: "#94A3B8" }}>{fmtOxy(hoveredRegion.hhb)}</span>
                      </span>
                    )}
                  </>
                ) : (
                  <>{hoveredRegion.band}: {fmtBand(hoveredRegion.rawValue)}</>
                )}
              </div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: heatColor(Math.max(0, hoveredRegion.normValue)), boxShadow: "0 2px 12px " + heatColor(Math.max(0, hoveredRegion.normValue)) + "55" }} />
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#64748B", textAlign: "center", padding: "4px 0" }}>
            Hover any electrode to see its live value
          </div>
        )}
      </div>

      {/* Signal modality legend — Mendi only. EEG bands intentionally omitted
          because Mendi is pure fNIRS — adding them would misrepresent what
          this device actually captures. */}
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 14, fontSize: 10, color: "#94A3B8" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 99, border: "2px solid rgba(165,243,252,0.85)", boxSizing: "border-box" }} />
          <strong style={{ color: "#A5F3FC", fontWeight: 700 }}>Mendi fNIRS</strong>
          <span>2 long channels · HbO + HHb · the short noise-reference channel sits at the same forehead site</span>
        </span>
      </div>

      {/* Mendi technical spec footer — accurate to public hardware specs.
          Sourced from Boere/Krigolson 2023 validation study (Int J
          Psychophysiology) — peer-reviewed against laboratory-grade fNIRS. */}
      <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(165,243,252,0.06)", border: "1px solid rgba(165,243,252,0.18)", borderRadius: 8, fontSize: 9.5, color: "#94A3B8", lineHeight: 1.6 }}>
        <strong style={{ color: "#A5F3FC", fontWeight: 700 }}>Mendi spec:</strong>{" "}
        2 long channels + 1 short channel (noise reference) over bilateral{" "}
        <strong style={{ color: "#CBD5E1" }}>Brodmann area 10</strong> ·
        dual LED at <strong style={{ color: "#CBD5E1" }}>660 nm + 805 nm</strong> ·
        ~31 Hz sampling · HbO &amp; HHb computed via modified Beer-Lambert.
      </div>

      {/* Heat scale legend */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "linear-gradient(90deg, rgb(37,99,235) 0%, rgb(6,182,212) 30%, rgb(16,185,129) 55%, rgb(245,158,11) 75%, rgb(239,68,68) 100%)" }} />
        <div style={{ display: "flex", flexDirection: "column", fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, gap: 2 }}>
          <span>LOW → HIGH</span>
        </div>
      </div>
      <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569" }}>
        <span>quiet</span>
        <span>normal</span>
        <span>elevated</span>
      </div>
    </div>
  );
}
