"use client";

import { useEffect, useState, useRef } from "react";
import { RewardGauge } from "@/components/RewardGauge";

const COLORS = {
  oxyL: "#10B981",
  oxyR: "#0EA5E9",
  deoxyL: "#6366F1",
  theta: "#F59E0B",
  alpha: "#EF4444",
};

function randWalk(v: number, min: number, max: number, step: number) {
  const next = v + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

function MiniWave({ data, color, label }: { data: number[]; color: string; label: string }) {
  if (data.length < 2) return null;
  const W = 120, H = 36, pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.01;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <div>
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.9}
        />
      </svg>
    </div>
  );
}

const MAX_PTS = 30;

export function LandingLivePreview() {
  const [reward, setReward] = useState(62);
  const [elapsed, setElapsed] = useState(0);
  const [oxyL, setOxyL] = useState<number[]>([0.05]);
  const [oxyR, setOxyR] = useState<number[]>([0.04]);
  const [deoxyL, setDeoxyL] = useState<number[]>([-0.02]);
  const [theta, setTheta] = useState<number[]>([0.38]);
  const [alpha, setAlpha] = useState<number[]>([0.52]);

  const refs = useRef({ reward: 62, oxyL: 0.05, oxyR: 0.04, deoxyL: -0.02, theta: 0.38, alpha: 0.52 });

  useEffect(() => {
    const id = setInterval(() => {
      const r = refs.current;
      r.reward = randWalk(r.reward, 42, 92, 4);
      r.oxyL = randWalk(r.oxyL, -0.05, 0.18, 0.012);
      r.oxyR = randWalk(r.oxyR, -0.04, 0.16, 0.010);
      r.deoxyL = randWalk(r.deoxyL, -0.12, 0.04, 0.008);
      r.theta = randWalk(r.theta, 0.20, 0.65, 0.04);
      r.alpha = randWalk(r.alpha, 0.25, 0.75, 0.04);

      setReward(r.reward);
      setElapsed((e) => e + 1);
      setOxyL((d) => { const n = [...d, r.oxyL]; return n.length > MAX_PTS ? n.slice(1) : n; });
      setOxyR((d) => { const n = [...d, r.oxyR]; return n.length > MAX_PTS ? n.slice(1) : n; });
      setDeoxyL((d) => { const n = [...d, r.deoxyL]; return n.length > MAX_PTS ? n.slice(1) : n; });
      setTheta((d) => { const n = [...d, r.theta]; return n.length > MAX_PTS ? n.slice(1) : n; });
      setAlpha((d) => { const n = [...d, r.alpha]; return n.length > MAX_PTS ? n.slice(1) : n; });
    }, 800);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
        <div className="w-3 h-3 rounded-full bg-amber-400 opacity-70" />
        <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
        <div className="flex-1 mx-4 bg-gray-700 rounded px-3 py-1 text-xs text-gray-400">
          app.eegbase.io/sessions/live
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · {fmt(elapsed)}
        </div>
      </div>

      <div className="p-6 flex gap-6">
        {/* Gauge */}
        <div className="shrink-0">
          <RewardGauge score={reward} />
        </div>

        {/* Signals */}
        <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
          <MiniWave data={oxyL} color={COLORS.oxyL} label="OxyHb Left (μM)" />
          <MiniWave data={oxyR} color={COLORS.oxyR} label="OxyHb Right (μM)" />
          <MiniWave data={deoxyL} color={COLORS.deoxyL} label="DeoxyHb Left (μM)" />
          <MiniWave data={theta} color={COLORS.theta} label="Theta power" />

          {/* Quick metrics */}
          <div className="col-span-2 flex gap-3">
            {[
              { label: "OxyHb L", val: oxyL[oxyL.length - 1], color: COLORS.oxyL, unit: "μM" },
              { label: "Alpha", val: alpha[alpha.length - 1], color: COLORS.alpha, unit: "" },
              { label: "Theta", val: theta[theta.length - 1], color: COLORS.theta, unit: "" },
            ].map(({ label, val, color, unit }) => (
              <div key={label} className="flex-1 bg-gray-700/40 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color }}>
                  {val >= 0 ? "+" : ""}{val.toFixed(3)}{unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
