"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SimulatorAdapter } from "@/lib/device/simulator";
import type { DeviceSample } from "@/lib/device/adapter";
import { LiveChart } from "@/components/LiveChart";
import Link from "next/link";

const MAX_POINTS = 60;

function useSlidingWindow(size: number) {
  const [data, setData] = useState<number[]>([]);
  const push = useCallback(
    (v: number) =>
      setData((prev) => {
        const next = [...prev, v];
        return next.length > size ? next.slice(next.length - size) : next;
      }),
    [size]
  );
  const reset = useCallback(() => setData([]), []);
  return { data, push, reset };
}

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export default function DemoPage() {
  const adapterRef = useRef<SimulatorAdapter | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sample, setSample] = useState<DeviceSample | null>(null);
  const [sampleCount, setSampleCount] = useState(0);

  const reward = useSlidingWindow(MAX_POINTS);
  const oxyL = useSlidingWindow(MAX_POINTS);
  const oxyR = useSlidingWindow(MAX_POINTS);
  const deoxyL = useSlidingWindow(MAX_POINTS);
  const deoxyR = useSlidingWindow(MAX_POINTS);
  const thetaW = useSlidingWindow(MAX_POINTS);
  const alphaW = useSlidingWindow(MAX_POINTS);
  const betaW = useSlidingWindow(MAX_POINTS);

  const stop = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await adapterRef.current?.disconnect();
    adapterRef.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(async () => {
    reward.reset(); oxyL.reset(); oxyR.reset(); deoxyL.reset(); deoxyR.reset();
    thetaW.reset(); alphaW.reset(); betaW.reset();
    setElapsed(0); setSample(null); setSampleCount(0);

    const adapter = new SimulatorAdapter();
    adapterRef.current = adapter;

    adapter.onSample((s) => {
      setSample(s);
      setSampleCount((n) => n + 1);
      if (s.rewardScore != null) reward.push(s.rewardScore / 100);
      if (s.oxyHbLeft != null) oxyL.push(s.oxyHbLeft);
      if (s.oxyHbRight != null) oxyR.push(s.oxyHbRight);
      if (s.deoxyHbLeft != null) deoxyL.push(s.deoxyHbLeft);
      if (s.deoxyHbRight != null) deoxyR.push(s.deoxyHbRight);
      if (s.theta != null) thetaW.push(s.theta);
      if (s.alpha != null) alphaW.push(s.alpha);
      if (s.beta != null) betaW.push(s.beta);
    });

    await adapter.connect();
    setRunning(true);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  const rewardVal = sample?.rewardScore;
  const rewardColor =
    rewardVal == null ? "#CBD5E1"
    : rewardVal >= 70 ? "#10B981"
    : rewardVal >= 40 ? "#F59E0B"
    : "#EF4444";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* Top bar */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" }}>
            EEG<span style={{ color: "#2563EB" }}>Base</span>
          </span>
          <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: "1px solid #BFDBFE", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Demo Mode
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {running && (
            <span style={{ fontSize: "0.85rem", color: "#10B981", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 1.5s infinite" }} />
              LIVE · {fmt(elapsed)} · {sampleCount} samples
            </span>
          )}
          <button
            onClick={running ? stop : start}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: running ? "1.5px solid #FECACA" : "none",
              background: running ? "#FEF2F2" : "#2563EB",
              color: running ? "#DC2626" : "white",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {running ? "⏹ Stop" : "▶ Start Demo"}
          </button>
          <Link href="/" style={{ fontSize: "0.85rem", color: "#64748B", textDecoration: "none" }}>
            eegbase.com →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px" }}>

        {/* Intro (only before start) */}
        {!running && elapsed === 0 && (
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 16, padding: "40px 48px", marginBottom: 28, display: "flex", gap: 48, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                EEGBase × Mendi Integration Demo
              </div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.2, marginBottom: 14, letterSpacing: "-0.03em" }}>
                Real-time Prefrontal<br />Neurofeedback Platform
              </h1>
              <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: 24 }}>
                EEGBase is an open-source, self-hosted platform for clinicians to remotely supervise
                neurofeedback training sessions. This demo shows simulated Mendi fNIRS data — the same
                channels your device streams — flowing into the clinician dashboard in real time.
              </p>
              <button
                onClick={start}
                style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "#2563EB", color: "white", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}
              >
                ▶ Start Demo
              </button>
              <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                {[
                  "fNIRS OxyHb/DeoxyHb visualization",
                  "EEG band power (θ α β δ γ)",
                  "Real-time reward score gauge",
                  "AI session & progress summaries",
                  "Pre/post session questionnaires",
                  "Client roster & progress tracking",
                  "Reward score trajectory sparklines",
                  "Session tagging + search",
                  "Treatment goals tracking",
                  "Outbound webhooks (session events)",
                  "Public client share reports",
                  "Session comparison (A vs B overlay)",
                  "Clinical notes with autosave",
                  "JSON + CSV data export",
                  "Cmd+K global search",
                  "Protocol template library",
                ].map((f) => (
                  <div key={f} style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#10B981", fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 280, flexShrink: 0 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                Architecture
              </div>
              {[
                { label: "Mendi Device", desc: "fNIRS · BLE / API", color: "#8B5CF6", icon: "◉" },
                { label: "DeviceAdapter", desc: "Abstract interface", color: "#2563EB", icon: "⇅" },
                { label: "Session Engine", desc: "Reward signal + storage", color: "#0EA5E9", icon: "⚙" },
                { label: "Clinician Dashboard", desc: "Live view + history", color: "#10B981", icon: "◻" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", marginBottom: 8 }}>
                  <span style={{ color: item.color, fontSize: "1.1rem", width: 20, textAlign: "center" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0F172A" }}>{item.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: 8, padding: "0 4px" }}>
                Mendi plugs in at the <strong>DeviceAdapter</strong> layer — no other changes needed.
              </div>
            </div>
          </div>
        )}

        {/* Live data */}
        {(running || elapsed > 0) && (
          <>
            {/* Session context bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Client", value: "Sarah Mitchell" },
                { label: "Protocol", value: "Prefrontal Upregulation" },
                { label: "Device", value: "Mendi (simulated)" },
                { label: "Elapsed", value: fmt(elapsed) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0F172A" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Reward score + chart */}
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 16, padding: "28px 32px", marginBottom: 20, display: "flex", alignItems: "center", gap: 40 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Reward Score
                </div>
                <div style={{ fontSize: "5rem", fontWeight: 800, lineHeight: 1, color: rewardColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em" }}>
                  {rewardVal != null ? rewardVal.toFixed(1) : "—"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>/ 100</div>
              </div>
              <div style={{ flex: 1 }}>
                <LiveChart data={reward.data} color="#2563EB" label="Reward score · last 60s" height={80} />
              </div>
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "OxyHb L", val: sample?.oxyHbLeft, color: "#10B981" },
                  { label: "OxyHb R", val: sample?.oxyHbRight, color: "#0EA5E9" },
                  { label: "DeoxyHb L", val: sample?.deoxyHbLeft, color: "#6366F1" },
                  { label: "DeoxyHb R", val: sample?.deoxyHbRight, color: "#EC4899" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.75rem", color: "#64748B", width: 64 }}>{label}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums", width: 52, textAlign: "right" }}>
                      {val != null ? val.toFixed(3) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { data: oxyL.data, color: "#10B981", label: "OxyHb · Left prefrontal (fNIRS)" },
                { data: oxyR.data, color: "#0EA5E9", label: "OxyHb · Right prefrontal (fNIRS)" },
                { data: deoxyL.data, color: "#6366F1", label: "DeoxyHb · Left prefrontal (fNIRS)" },
                { data: deoxyR.data, color: "#EC4899", label: "DeoxyHb · Right prefrontal (fNIRS)" },
              ].map(({ data, color, label }) => (
                <div key={label} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 20px" }}>
                  <LiveChart data={data} color={color} label={label} height={88} />
                </div>
              ))}
            </div>

            {/* EEG band charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { data: thetaW.data, color: "#F59E0B", label: "Theta (4–8 Hz) · relaxed focus" },
                { data: alphaW.data, color: "#EF4444", label: "Alpha (8–12 Hz) · calm alertness" },
                { data: betaW.data, color: "#EC4899", label: "Beta (12–30 Hz) · active thinking" },
              ].map(({ data, color, label }) => (
                <div key={label} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 20px" }}>
                  <LiveChart data={data} color={color} label={label} height={72} />
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#94A3B8" }}>
              Simulated data · Mendi BLE adapter built — UUIDs confirmed post-May 11 call ·{" "}
              <a href="https://eegbase.com" style={{ color: "#2563EB" }}>eegbase.com</a>{" "}
              ·{" "}
              <a href="https://github.com/trainbase/eegbase" style={{ color: "#2563EB" }}>github.com/trainbase/eegbase</a>
            </div>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
