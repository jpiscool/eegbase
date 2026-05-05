"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SimulatorAdapter } from "@/lib/device/simulator";
import type { DeviceSample } from "@/lib/device/adapter";
import { LiveChart } from "@/components/LiveChart";
import { GameFeedback } from "@/components/GameFeedback";
import { BrainMapPanel } from "@/components/BrainMapPanel";
import { ClinicalQuestionnaire } from "@/components/ClinicalQuestionnaire";

const MAX_POINTS = 60;
type MainTab = "session" | "game" | "brain" | "outcomes" | "progress" | "ai" | "schedule" | "hrv" | "protocols" | "reports" | "compare";

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function useSlidingWindow(size: number) {
  const [data, setData] = useState<number[]>([]);
  const push = useCallback((v: number) =>
    setData((prev) => { const next = [...prev, v]; return next.length > size ? next.slice(-size) : next; }), [size]);
  const reset = useCallback(() => setData([]), []);
  return { data, push, reset };
}

const SESSION_HISTORY = Array.from({ length: 20 }, (_, i) => ({
  session: i + 1,
  date: new Date(Date.now() - (20 - i) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  reward: 38 + i * 2.8 + (Math.random() - 0.5) * 6,
  alpha: 0.32 + i * 0.012 + (Math.random() - 0.5) * 0.03,
  thetaBeta: 2.4 - i * 0.02 + (Math.random() - 0.5) * 0.15, // Z-score, trending down
  phq9: Math.max(4, 18 - Math.floor(i * 0.7)),
  gad7: Math.max(3, 14 - Math.floor(i * 0.55)),
  duration: 20 + Math.floor(Math.random() * 10),
}));

// ── Competitor feature comparison ──────────────────────────────────────────
// Columns: eeg, myndlift, divergence, eeger, brainpaint, neuroptimal, neuroguide, brainavatar
const FEATURES: { feature: string; category: string; eeg: boolean; myndlift: boolean; divergence: boolean; eeger: boolean; brainpaint: boolean; neuroptimal: boolean; neuroguide: boolean; brainavatar: boolean }[] = [
  // Streaming & Signal
  { category: "Signal & Streaming", feature: "Live fNIRS streaming",                   eeg: true,  myndlift: true,  divergence: true,  eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Signal & Streaming", feature: "Real-time EEG band power charts",        eeg: true,  myndlift: true,  divergence: true,  eeger: true,  brainpaint: false, neuroptimal: false, neuroguide: true,  brainavatar: true  },
  { category: "Signal & Streaming", feature: "HRV + GSR multimodal biofeedback",       eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Signal & Streaming", feature: "Hardware-agnostic (multi-vendor EEG)",   eeg: true,  myndlift: false, divergence: false, eeger: true,  brainpaint: false, neuroptimal: false, neuroguide: true,  brainavatar: false },
  { category: "Signal & Streaming", feature: "Simulator / demo without hardware",      eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  // Analysis & QEEG
  { category: "Analysis & QEEG",    feature: "Prefrontal activity brain map",          eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: true,  brainavatar: true  },
  { category: "Analysis & QEEG",    feature: "Z-score neurofeedback training",         eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: true,  brainavatar: true  },
  { category: "Analysis & QEEG",    feature: "LORETA / sLORETA source localization",   eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: true,  brainavatar: true  },
  { category: "Analysis & QEEG",    feature: "Normative database (age-matched Z)",     eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: true,  brainavatar: true  },
  // AI & Automation
  { category: "AI & Automation",    feature: "AI protocol change recommendations",     eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "AI & Automation",    feature: "AI-drafted SOAP clinical notes",         eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "AI & Automation",    feature: "Stalled-progress / at-risk alerts",      eeg: true,  myndlift: true,  divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "AI & Automation",    feature: "Branded PDF progress reports",           eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  // Client Engagement
  { category: "Client Engagement",  feature: "Game mode / immersive feedback",         eeg: true,  myndlift: true,  divergence: true,  eeger: true,  brainpaint: true,  neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Client Engagement",  feature: "Generative art feedback",                eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: true,  neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Client Engagement",  feature: "Client mobile app (iOS / Android)",      eeg: true,  myndlift: true,  divergence: true,  eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Client Engagement",  feature: "Daily symptom journal (between sessions)",eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Client Engagement",  feature: "Wearable data import (Oura, Apple Watch)",eeg: true, myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  // Clinical Workflow
  { category: "Clinical Workflow",  feature: "PHQ-9 / GAD-7 questionnaires",          eeg: true,  myndlift: true,  divergence: true,  eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Clinical Workflow",  feature: "Automated questionnaire scheduling",     eeg: true,  myndlift: false, divergence: true,  eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Clinical Workflow",  feature: "CPT cognitive assessment",               eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Clinical Workflow",  feature: "Treatment goals tracking",               eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Clinical Workflow",  feature: "Live remote session supervision",        eeg: true,  myndlift: true,  divergence: true,  eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Clinical Workflow",  feature: "Group / cohort management dashboard",   eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  // Practice Management
  { category: "Practice Mgmt",      feature: "Integrated appointment scheduling",     eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Practice Mgmt",      feature: "Billing / CPT code superbills",         eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Practice Mgmt",      feature: "EHR / SimplePractice integration",      eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  // Platform
  { category: "Platform",           feature: "Cloud / web-based (no Windows install)", eeg: true,  myndlift: true,  divergence: true,  eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Platform",           feature: "Open source / self-hosted",              eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Platform",           feature: "No per-session or per-client fees",     eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Platform",           feature: "HIPAA-compliant data residency options", eeg: true,  myndlift: true,  divergence: true,  eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  // Multimodal
  { category: "Multimodal",         feature: "HRV biofeedback (native, not separate software)", eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Multimodal",         feature: "Respiration / skin conductance integration",      eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Multimodal",         feature: "Wearable import (Oura Ring / Apple Watch sleep)", eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Multimodal",         feature: "Condition-specific protocol library (50+ protocols)", eeg: true, myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Multimodal",         feature: "Built-in HIPAA telehealth video sessions",        eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Multimodal",         feature: "EHR integration (SimplePractice / TherapyNotes)", eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
  { category: "Multimodal",         feature: "EDF / BIDS open-format raw EEG export",           eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
];

const COMPETITORS: { key: string; label: string; sub: string; highlight?: boolean }[] = [
  { key: "eeg",         label: "EEGBase",     sub: "$0/mo · Open Source", highlight: true },
  { key: "myndlift",    label: "Myndlift",    sub: "~$315/mo" },
  { key: "divergence",  label: "Divergence",  sub: "~$315/mo" },
  { key: "eeger",       label: "EEGer",       sub: "~$95/mo" },
  { key: "brainpaint",  label: "BrainPaint",  sub: "$15–25/session" },
  { key: "neuroptimal", label: "NeurOptimal", sub: "~$650/mo rental" },
  { key: "neuroguide",  label: "NeuroGuide",  sub: "$3,500–6,000" },
  { key: "brainavatar", label: "BrainAvatar", sub: "Hardware bundle" },
];

// Fake SOAP note
const SOAP_NOTE = `S: Client reports moderate difficulty concentrating this week; rated focus 4/10. Sleep quality 6/10 (down from 7 last visit). No medication changes. Reports feeling "stuck" on same tasks at work.

O: 22-minute SMR (12–15 Hz) training session at Cz. Average reward score 64.2/100 (above-threshold 71% of session). Theta power elevated; θ/β ratio 2.2 SD above age/sex norm (ages 28–35, eyes-open resting). Heart rate 68 bpm, HRV-RMSSD 45 ms (within expected baseline). PHQ-9: 11 (moderate). GAD-7: 8 (mild).

A: Client engagement improving — reward score +18% from session 1 baseline (38.4). Theta/beta ratio has remained above normative range (>1.5 SD) across sessions 6–8 despite consistent attendance and compliance. PHQ-9 depression score trending down from 18 → 11 over 8 sessions. Alpha-theta protocol may be better indicated given stalled theta/beta trajectory.

P: 1. Consider switching to alpha-theta (Pz/Oz, 8–12 Hz reward) for sessions 9–12 per EEGBase protocol recommendation. 2. Reassess PHQ-9 at session 10. 3. Discuss sleep hygiene strategies at next appointment. 4. Continue 22-minute weekly sessions. 5. Client to complete daily symptom journal between sessions.`;

// Schedule appointments
const APPOINTMENTS = [
  { time: "Mon May 6 · 9:00 AM",  client: "Sarah Mitchell",   protocol: "SMR — Session 9",              status: "confirmed" },
  { time: "Mon May 6 · 11:00 AM", client: "James Okafor",     protocol: "Alpha-Theta — Session 4",      status: "confirmed" },
  { time: "Tue May 7 · 2:30 PM",  client: "Priya Sharma",     protocol: "Intake + QEEG Assessment",     status: "pending" },
  { time: "Wed May 8 · 10:00 AM", client: "Daniel Cruz",      protocol: "ILF — Session 12",             status: "confirmed" },
  { time: "Thu May 9 · 3:00 PM",  client: "Emily Tanaka",     protocol: "Neuromuscular — Session 6",    status: "confirmed" },
  { time: "Fri May 10 · 1:00 PM", client: "Marcus Webb",      protocol: "SMR — Session 2",              status: "pending" },
];

export default function DemoPage() {
  const adapterRef = useRef<SimulatorAdapter | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tab, setTab] = useState<MainTab>("session");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sample, setSample] = useState<DeviceSample | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [soapCopied, setSoapCopied] = useState(false);
  const [recommendationApplied, setRecommendationApplied] = useState(false);
  const [featureCategory, setFeatureCategory] = useState<string | null>(null);
  const [reportExported, setReportExported] = useState(false);
  const [protocolSearch, setProtocolSearch] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [ehrCopied, setEhrCopied] = useState(false);
  const [protocolApplied, setProtocolApplied] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [faxSent, setFaxSent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [gameMode, setGameMode] = useState<"orb" | "art" | "audio">("orb");
  const [reminderToggles, setReminderToggles] = useState({ sms: true, email: true, noshow: true, lapsed: false });
  const [peakFlash, setPeakFlash] = useState(false);
  const peakReachedRef = useRef(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<MainTab>>(new Set(["session"]));
  const [tourDismissed, setTourDismissed] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Exhale">("Inhale");
  useEffect(() => {
    const iv = setInterval(() => setBreathPhase((p) => (p === "Inhale" ? "Exhale" : "Inhale")), 5000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (sessionStorage.getItem("demo-onboarding-dismissed") !== "1") {
      setShowOnboarding(true);
    }
  }, []);

  const reward  = useSlidingWindow(MAX_POINTS);
  const oxyL    = useSlidingWindow(MAX_POINTS);
  const oxyR    = useSlidingWindow(MAX_POINTS);
  const deoxyL  = useSlidingWindow(MAX_POINTS);
  const deoxyR  = useSlidingWindow(MAX_POINTS);
  const thetaW  = useSlidingWindow(MAX_POINTS);
  const alphaW  = useSlidingWindow(MAX_POINTS);
  const betaW   = useSlidingWindow(MAX_POINTS);

  const stop = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await adapterRef.current?.disconnect();
    adapterRef.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(async () => {
    reward.reset(); oxyL.reset(); oxyR.reset(); deoxyL.reset(); deoxyR.reset();
    thetaW.reset(); alphaW.reset(); betaW.reset();
    setSample(null); setSampleCount(0); setElapsed(0);
    const adapter = new SimulatorAdapter({ noiseLevel: 0.35, trendStrength: 0.7 });
    adapterRef.current = adapter;
    adapter.onSample((s) => {
      setSample(s); setSampleCount((n) => n + 1);
      if (s.rewardScore != null) reward.push(s.rewardScore / 100);
      if (s.oxyHbLeft != null)   oxyL.push(s.oxyHbLeft);
      if (s.oxyHbRight != null)  oxyR.push(s.oxyHbRight);
      if (s.deoxyHbLeft != null)  deoxyL.push(s.deoxyHbLeft);
      if (s.deoxyHbRight != null) deoxyR.push(s.deoxyHbRight);
      if (s.theta != null) thetaW.push(s.theta);
      if (s.alpha != null) alphaW.push(s.alpha);
      if (s.beta != null)  betaW.push(s.beta);
    });
    await adapter.connect();
    setRunning(true);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, [reward, oxyL, oxyR, deoxyL, deoxyR, thetaW, alphaW, betaW]);

  useEffect(() => { start(); return () => { stop(); }; }, []);

  const rewardVal = sample?.rewardScore;
  const rewardColor = rewardVal == null ? "#CBD5E1" : rewardVal >= 70 ? "#10B981" : rewardVal >= 40 ? "#F59E0B" : "#EF4444";

  // Score trend: difference vs 10 samples ago (×100 since data is 0–1)
  const rewardTrend = reward.data.length >= 11
    ? (reward.data[reward.data.length - 1] - reward.data[reward.data.length - 11]) * 100
    : null;

  // Peak achievement flash
  useEffect(() => {
    if (rewardVal != null && rewardVal >= 70 && !peakReachedRef.current) {
      peakReachedRef.current = true;
      setPeakFlash(true);
      setTimeout(() => setPeakFlash(false), 3000);
    }
    if (rewardVal != null && rewardVal < 50) peakReachedRef.current = false;
  }, [rewardVal]);

  // Live Z-score simulation from current EEG data
  const thetaZ = sample?.theta != null ? ((sample.theta - 0.28) / 0.08).toFixed(2) : null;
  const alphaZ = sample?.alpha != null ? ((sample.alpha - 0.42) / 0.09).toFixed(2) : null;
  const betaZ  = sample?.beta  != null ? ((sample.beta  - 0.22) / 0.06).toFixed(2) : null;

  // Dynamic plain-English session status
  const sessionStatus = (() => {
    if (rewardVal == null) return null;
    const thetaN = thetaZ ? parseFloat(thetaZ) : 0;
    const betaN  = betaZ  ? parseFloat(betaZ)  : 0;
    if (rewardVal >= 75) return { icon: "🌟", text: "Peak focus — target pattern sustained. Excellent session.", color: "#34D399", bg: "rgba(6,78,59,0.35)", border: "#065F46" };
    if (rewardVal >= 60) return { icon: "✓",  text: "On target — reward threshold met. Maintain this state.", color: "#6EE7B7", bg: "rgba(6,78,59,0.35)", border: "#065F46" };
    if (rewardVal >= 40) {
      if (thetaN > 1.5) return { icon: "↗", text: "Building up — theta is slightly elevated. Slow, focused breathing helps calm it.", color: "#FCD34D", bg: "rgba(120,53,15,0.3)", border: "#92400E" };
      if (betaN < 0)    return { icon: "↗", text: "Building up — beta focus band is below average. Try a light mental task to activate it.", color: "#FCD34D", bg: "rgba(120,53,15,0.3)", border: "#92400E" };
      return { icon: "↗", text: "Building up — patterns are forming. Stay relaxed but alert.", color: "#FCD34D", bg: "rgba(120,53,15,0.3)", border: "#92400E" };
    }
    return { icon: "◌", text: "Starting up — takes a moment for brainwave patterns to stabilise. Breathe naturally.", color: "#94A3B8", bg: "#1E293B", border: "#334155" };
  })();

  const TABS: { id: MainTab; label: string; groupStart?: string }[] = [
    { id: "session",   label: "📡 Live Session",       groupStart: "During a Session" },
    { id: "game",      label: "🎮 Game Mode" },
    { id: "brain",     label: "🧠 Brain Map" },
    { id: "hrv",       label: "💓 Heart & Breathing" },
    { id: "outcomes",  label: "📋 Questionnaires",     groupStart: "Client Records" },
    { id: "progress",  label: "📈 Progress" },
    { id: "ai",        label: "🤖 AI Insights" },
    { id: "protocols", label: "🎯 Protocols",          groupStart: "Practice Tools" },
    { id: "schedule",  label: "📅 Schedule" },
    { id: "reports",   label: "📊 Reports" },
    { id: "compare",   label: "🏆 Compare" },
  ];

  const DEMO_CLIENTS = [
    { name: "Sarah Mitchell",   protocol: "SMR · Cz (12–15 Hz)",        session: 8  },
    { name: "James Okafor",     protocol: "Alpha-Theta · Pz/Oz",         session: 4  },
    { name: "Priya Sharma",     protocol: "ILF · Fp1/Fp2",              session: 12 },
    { name: "Daniel Cruz",      protocol: "Sleep Spindle · Cz/Pz",      session: 3  },
    { name: "Emily Tanaka",     protocol: "Neuromuscular · C3/C4",       session: 6  },
  ];
  const [demoClientIdx, setDemoClientIdx] = useState(0);
  const demoClient = DEMO_CLIENTS[demoClientIdx];

  const switchTab = (id: MainTab) => { setTab(id); setVisitedTabs((prev) => new Set([...prev, id])); };

  const navBtn: (active: boolean) => React.CSSProperties = (active) => ({
    padding: "10px 16px", fontSize: 13, fontWeight: 600, background: "none", border: "none",
    cursor: "pointer", whiteSpace: "nowrap",
    color: active ? "#2563EB" : "#64748B",
    borderBottom: active ? "2px solid #2563EB" : "2px solid transparent",
  });

  const card: React.CSSProperties = { background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 24 };

  const categories = [...new Set(FEATURES.map((f) => f.category))];
  const filteredFeatures = featureCategory ? FEATURES.filter((f) => f.category === featureCategory) : FEATURES;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#F0F4F8", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes scoreGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes artShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.35); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes soundBar { 0% { height: 4px; } 100% { height: 14px; } }
        @keyframes floatA { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-12px) scale(1.08); } }
        @keyframes floatB { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(10px) scale(0.92); } }
        @keyframes statPop { 0% { opacity: 0; transform: translateY(14px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .skeleton { background: linear-gradient(90deg, #1E293B 25%, #334155 50%, #1E293B 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        .demo-section-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.07em; padding-bottom: 10px; margin-bottom: 14px; border-bottom: 1px solid #334155; }
        select option { background: #1E293B; color: white; }
        @media (max-width: 640px) {
          .demo-grid-2 { grid-template-columns: 1fr !important; }
          .demo-grid-3 { grid-template-columns: 1fr !important; }
          .demo-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .demo-sidebar { display: none !important; }
          .demo-content { padding: 16px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", textDecoration: "none" }}>
            EEG<span style={{ color: "#60A5FA" }}>Base</span>
          </a>
          <span style={{ background: "#1E293B", color: "#60A5FA", fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: "1px solid #334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Demo Mode
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Client switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Client:</span>
            <select
              value={demoClientIdx}
              onChange={(e) => setDemoClientIdx(Number(e.target.value))}
              style={{ fontSize: "0.78rem", fontWeight: 600, color: "white", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", background: "#1E293B", cursor: "pointer", outline: "none" }}
            >
              {DEMO_CLIENTS.map((c, i) => (
                <option key={c.name} value={i}>{c.name}</option>
              ))}
            </select>
          </div>
          {running && (
            <span style={{ fontSize: "0.78rem", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.04em" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block", animation: "pulse 1.5s infinite", boxShadow: "0 0 8px #34D39988" }} />
              LIVE · {fmt(elapsed)}
            </span>
          )}
          <a href="/login" style={{ fontSize: "0.82rem", fontWeight: 700, padding: "7px 16px", background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "white", borderRadius: 8, textDecoration: "none", letterSpacing: "0.01em" }}>
            Get Access →
          </a>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#1E293B" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, #2563EB, #8B5CF6, #EC4899)", width: `${Math.min(100, (elapsed / 1800) * 100)}%`, transition: "width 1s linear" }} />
      </div>

      {/* Onboarding overlay */}
      {showOnboarding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, maxWidth: 520, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", animation: "fadeIn 0.25s ease", overflow: "hidden" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg, #2563EB, #7C3AED, #EC4899)" }} />
            <div style={{ padding: "28px 32px 32px" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Welcome to EEGBase Demo</div>
              <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24, lineHeight: 1.7 }}>
                A live simulator running real-time synthetic EEG + fNIRS data. No hardware needed.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[
                  { icon: "📡", title: "Live Session + Brain Map", desc: "EEG, fNIRS, and HRV streaming with Z-score comparison to 847 healthy adults — no hardware needed." },
                  { icon: "🎮", title: "3 Feedback Modes", desc: "Energy Orb, Generative Art, or Audio Interrupt — show the client what their brain is doing in real time." },
                  { icon: "🤖", title: "AI Insights + SOAP Notes", desc: "Protocol recommendations, 20-session trend analysis, and one-click clinical notes ready for your EHR." },
                  { icon: "📊", title: "Progress Reports + Compare", desc: "Branded PDF reports for clients and physicians. See how EEGBase compares to 7 competitors." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 14px", background: "#F8FAFC", borderRadius: 12 }}>
                    <div style={{ fontSize: 20, lineHeight: 1.3 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>{title}</div>
                      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { sessionStorage.setItem("demo-onboarding-dismissed", "1"); setShowOnboarding(false); }}
                style={{ width: "100%", padding: "13px 20px", background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.01em" }}
              >
                Start Exploring →
              </button>
              <p style={{ fontSize: 12, color: "#CBD5E1", textAlign: "center", marginTop: 12 }}>No sign-up required · Synthetic data only</p>
            </div>
          </div>
        </div>
      )}

      {/* Peak achievement flash */}
      {peakFlash && (
        <div style={{ position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)", zIndex: 998, animation: "fadeIn 0.3s ease", pointerEvents: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #065F46, #059669)", color: "white", borderRadius: 14, padding: "14px 24px", boxShadow: "0 8px 40px rgba(16,185,129,0.4)", display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 22 }}>🌟</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>Peak focus achieved!</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>Score crossed 70 — excellent brain state</div>
            </div>
          </div>
        </div>
      )}

      {/* Guided tour checklist */}
      {!tourDismissed && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 90, background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 200, animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Explore the demo</span>
            <button onClick={() => setTourDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94A3B8", padding: 0 }}>✕</button>
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>
            {visitedTabs.size} of {TABS.length} sections visited
          </div>
          <div style={{ height: 3, background: "#F1F5F9", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #2563EB, #7C3AED)", width: `${(visitedTabs.size / TABS.length) * 100}%`, transition: "width 0.4s ease", borderRadius: 99 }} />
          </div>
          {TABS.slice(0, 6).map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: visitedTabs.has(t.id) ? "#10B981" : "#CBD5E1", fontWeight: 700 }}>
                {visitedTabs.has(t.id) ? "✓" : "○"}
              </span>
              <button
                onClick={() => switchTab(t.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: visitedTabs.has(t.id) ? "#64748B" : "#2563EB", fontWeight: visitedTabs.has(t.id) ? 400 : 600, padding: 0, textDecoration: visitedTabs.has(t.id) ? "line-through" : "none" }}
              >
                {t.label}
              </button>
            </div>
          ))}
          {visitedTabs.size >= TABS.length && (
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#F0FDF4", borderRadius: 8, fontSize: 11, color: "#065F46", fontWeight: 700 }}>
              🎉 Tour complete! Ready to get access?
            </div>
          )}
        </div>
      )}

      {/* Sidebar + Content layout */}
      <div style={{ display: "flex", alignItems: "flex-start", background: "#F0F4F8", minHeight: "calc(100vh - 60px)" }}>

        {/* Left sidebar nav */}
        <nav aria-label="Demo sections" className="demo-sidebar" style={{ width: 216, background: "#0F172A", flexShrink: 0, position: "sticky", top: 56, height: "calc(100vh - 60px)", overflowY: "auto", zIndex: 10, borderRight: "1px solid #1E293B" }}>
          <div style={{ padding: "14px 0 28px" }}>
            {TABS.map((t, i) => (
              <div key={t.id}>
                {t.groupStart && (
                  <div style={{ padding: i === 0 ? "6px 16px 8px" : "20px 16px 8px", fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {t.groupStart}
                  </div>
                )}
                <button
                  aria-current={tab === t.id ? "page" : undefined}
                  onClick={() => switchTab(t.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: tab === t.id ? "rgba(96,165,250,0.12)" : "transparent",
                    border: "none", borderLeft: tab === t.id ? "3px solid #60A5FA" : "3px solid transparent",
                    padding: "9px 16px", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                    color: tab === t.id ? "#E2E8F0" : "#64748B", cursor: "pointer", display: "block", lineHeight: 1.3,
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {t.label}
                </button>
              </div>
            ))}
          </div>
        </nav>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0 }}>
        <div
          role="tabpanel"
          id={`tabpanel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="demo-content"
          style={{ padding: "24px 20px", maxWidth: 920 }}
        >

        {/* ── LIVE SESSION ── */}
        {tab === "session" && (
          <>
            {/* Context strip */}
            <div style={{ background: "#1E293B", boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(37,99,235,0.12)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderLeft: "3px solid #2563EB" }}>
              <span style={{ fontSize: 16 }}>👩‍⚕️</span>
              <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5 }}>
                <strong style={{ color: "#93C5FD" }}>Clinician view</strong> — you&apos;re watching {demoClient.name}&apos;s brain signals in real time (simulated). The <strong>Reward Score</strong> rises when the client&apos;s brain is producing the target pattern. Switch to <button onClick={() => switchTab("game")} style={{ background: "none", border: "none", color: "#60A5FA", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13, textDecoration: "underline" }}>Game Mode</button> to see what the client sees.
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-2 demo-grid-4">
              {[
                { label: "Client", value: demoClient.name, updated: false },
                { label: "Protocol", value: recommendationApplied ? "Alpha-Theta · Pz/Oz" : demoClient.protocol, updated: recommendationApplied },
                { label: "Device", value: "Mendi fNIRS (sim)", updated: false },
                { label: "Elapsed", value: fmt(elapsed), updated: false },
              ].map(({ label, value, updated }) => (
                <div key={label} style={{ background: "#0F172A", boxShadow: updated ? "0 0 0 2px #10B981, 0 4px 12px rgba(16,185,129,0.15)" : "0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px #334155", borderRadius: 12, padding: "14px 18px", transition: "box-shadow 0.4s ease" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: updated ? "#34D399" : "#F1F5F9", transition: "color 0.4s ease" }}>
                    {value}
                    {updated && <span style={{ fontSize: "0.65rem", background: "rgba(6,78,59,0.5)", color: "#34D399", borderRadius: 99, padding: "2px 6px", marginLeft: 6, fontWeight: 700 }}>AI ✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              border: "1px solid #334155",
              borderRadius: 20,
              padding: 24,
              marginBottom: 16,
              boxShadow: `0 8px 40px rgba(0,0,0,0.4), 0 0 80px ${rewardColor}22`,
              transition: "box-shadow 1.5s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
                {/* Reward score ring */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "flex-start" }}>Reward Score</div>
                  <div style={{ position: "relative", width: 130, height: 130 }}>
                    <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
                      {/* Track */}
                      <circle cx="65" cy="65" r="50" fill="none" stroke="#1E293B" strokeWidth="11" />
                      {/* Target zone marker at 60% */}
                      <circle cx="65" cy="65" r="50" fill="none" stroke="#334155" strokeWidth="11"
                        strokeDasharray={`${2 * Math.PI * 50 * 0.01} ${2 * Math.PI * 50 * 0.99}`}
                        strokeDashoffset={`${-2 * Math.PI * 50 * 0.60}`} />
                      {/* Progress arc */}
                      <circle
                        cx="65" cy="65" r="50" fill="none"
                        stroke={rewardColor} strokeWidth="11" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - (rewardVal ?? 0) / 100)}`}
                        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 1.5s ease", filter: `drop-shadow(0 0 8px ${rewardColor}99)` }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                        {rewardVal != null ? rewardVal.toFixed(0) : "—"}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: 1 }}>/ 100</div>
                      {rewardTrend != null && (
                        <div style={{ fontSize: "0.7rem", color: rewardTrend > 1 ? "#34D399" : rewardTrend < -1 ? "#F87171" : "#64748B", fontWeight: 700, marginTop: 3 }}>
                          {rewardTrend > 1 ? "↑" : rewardTrend < -1 ? "↓" : "→"} {rewardTrend > 0 ? "+" : ""}{rewardTrend.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${rewardColor}25`, padding: "4px 12px", borderRadius: 99, border: `1px solid ${rewardColor}40` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: rewardColor, animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: rewardColor }}>
                      {rewardVal == null ? "—" : rewardVal >= 80 ? "Peak — excellent" : rewardVal >= 60 ? "On target" : rewardVal >= 40 ? "Building up" : "Below target"}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <LiveChart data={reward.data} color="#60A5FA" label="Reward score · last 60s" height={80} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { label: "O₂ flow L", val: sample?.oxyHbLeft, color: "#10B981" },
                    { label: "O₂ flow R", val: sample?.oxyHbRight, color: "#0EA5E9" },
                    { label: "O₂ use L", val: sample?.deoxyHbLeft, color: "#6366F1" },
                    { label: "O₂ use R", val: sample?.deoxyHbRight, color: "#EC4899" },
                    { label: "Heart rate", val: sample?.heartRate, color: "#F59E0B", suffix: " bpm" },
                    { label: "HRV", val: sample?.hrvRmssd, color: "#8B5CF6", suffix: " ms" },
                  ].map(({ label, val, color, suffix }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.72rem", color: "#64748B", width: 58 }}>{label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums", width: 58, textAlign: "right" }}>
                        {val != null ? val.toFixed(suffix ? 0 : 3) + (suffix ?? "") : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Z-score strip */}
            <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", border: "1px solid #334155", borderRadius: 12, padding: "12px 20px", marginBottom: 16, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>How brainwaves compare to healthy adults</span>
              {[
                { label: "Theta", val: thetaZ, color: "#F59E0B" },
                { label: "Alpha", val: alphaZ, color: "#EF4444" },
                { label: "Beta",  val: betaZ,  color: "#EC4899" },
              ].map(({ label, val, color }) => {
                const n = val ? parseFloat(val) : 0;
                const devColor = Math.abs(n) > 2 ? "#EF4444" : Math.abs(n) > 1 ? "#F59E0B" : "#10B981";
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color, fontWeight: 600, width: 36 }}>{label}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: devColor, fontVariantNumeric: "tabular-nums", width: 52 }}>
                      {val ? (n > 0 ? "+" : "") + val : "—"}
                    </span>
                    <span style={{ fontSize: 10, color: "#475569" }}>SD</span>
                    <span style={{ fontSize: 11, color: devColor, fontWeight: 500 }}>
                      {Math.abs(n) > 2 ? "↑ Elevated" : Math.abs(n) > 1 ? "Borderline" : "✓ Normal"}
                    </span>
                  </div>
                );
              })}
              <span style={{ marginLeft: "auto", display: "flex", gap: 10, fontSize: 10, color: "#475569", alignItems: "center" }}>
                <span style={{ color: "#10B981" }}>🟢 Normal</span>
                <span style={{ color: "#F59E0B" }}>🟡 Borderline</span>
                <span style={{ color: "#EF4444" }}>🔴 Elevated</span>
              </span>
            </div>

            {/* Dynamic plain-English status */}
            {sessionStatus && (
              <div style={{ background: sessionStatus.bg, border: `1px solid ${sessionStatus.border}`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, transition: "background 1s ease, border-color 1s ease" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: sessionStatus.color, flexShrink: 0 }}>{sessionStatus.icon}</span>
                <span style={{ fontSize: 13, color: sessionStatus.color, fontWeight: 500, lineHeight: 1.5 }}>{sessionStatus.text}</span>
              </div>
            )}

            <div className="demo-section-label">Blood flow to the prefrontal cortex (fNIRS sensor)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="demo-grid-2">
              {[
                { data: oxyL.data, color: "#10B981", label: "Oxygenated blood · Left prefrontal" },
                { data: oxyR.data, color: "#0EA5E9", label: "Oxygenated blood · Right prefrontal" },
              ].map(({ data, color, label }) => (
                <div key={label} style={{ background: "#0F172A", boxShadow: "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px #334155", borderRadius: 14, padding: 18 }}>
                  {sampleCount === 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 8 }}>{label}</div>
                      <div className="skeleton" style={{ height: 80 }} />
                    </>
                  ) : (
                    <LiveChart data={data} color={color} label={label} height={80} />
                  )}
                </div>
              ))}
            </div>

            {/* Session visual hierarchy: highlight training metric */}
            <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", border: "1px solid #334155", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <span style={{ fontSize: 13, color: "#FCD34D", fontWeight: 700 }}>Session goal:</span>
              <span style={{ fontSize: 13, color: "#FDE68A", marginLeft: 4 }}>Increase <strong>Beta</strong> (active focus) · Reduce <strong>Theta</strong> (drowsy slow waves) · Score rises when both happen together</span>
            </div>

            <div className="demo-section-label">Brainwave bands (EEG)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }} className="demo-grid-3">
              {[
                { data: thetaW.data, color: "#F59E0B", label: "Theta — slow waves (drowsy/relaxed)", isTarget: false, isSuppressed: true },
                { data: alphaW.data, color: "#EF4444", label: "Alpha — calm focus", isTarget: false, isSuppressed: false },
                { data: betaW.data,  color: "#EC4899", label: "Beta — active thinking",  isTarget: true,  isSuppressed: false },
              ].map(({ data, color, label, isTarget, isSuppressed }) => (
                <div key={label} style={{
                  background: "#0F172A",
                  border: "none",
                  boxShadow: isTarget
                    ? "0 0 0 2px #EC4899, 0 4px 20px rgba(236,72,153,0.16)"
                    : isSuppressed
                    ? "0 0 0 2px #F59E0B, 0 4px 20px rgba(245,158,11,0.14)"
                    : "0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px #334155",
                  borderRadius: 14, padding: 18, position: "relative",
                }}>
                  {isTarget && <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 700, color: "#EC4899", background: "rgba(236,72,153,0.15)", padding: "2px 7px", borderRadius: 99 }}>REWARD ↑</div>}
                  {isSuppressed && <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 700, color: "#D97706", background: "rgba(245,158,11,0.15)", padding: "2px 7px", borderRadius: 99 }}>SUPPRESS ↓</div>}
                  {sampleCount === 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 8 }}>{label}</div>
                      <div className="skeleton" style={{ height: 68 }} />
                    </>
                  ) : (
                    <LiveChart data={data} color={color} label={label} height={68} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── GAME MODE ── */}
        {tab === "game" && (
          <div>
            {/* Clinician context banner */}
            <div style={{ background: "rgba(6,78,59,0.35)", border: "1px solid #065F46", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 14 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>👨‍⚕️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399", marginBottom: 4 }}>How clinicians use Game Mode</div>
                <p style={{ fontSize: 13, color: "#6EE7B7", lineHeight: 1.6, margin: 0 }}>
                  Turn your monitor toward the client during a session. Pick a feedback style below — all update in real time from live EEG. Green = on target. Clients engage 2–3× longer with visual feedback vs. a progress bar.
                </p>
              </div>
            </div>

            {/* Mode selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "#1E293B", borderRadius: 12, padding: 6, border: "1px solid #334155", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, paddingLeft: 6, whiteSpace: "nowrap" }}>Feedback style:</span>
              {([
                { id: "orb",   icon: "🔮", label: "Energy Orb" },
                { id: "art",   icon: "🎨", label: "Generative Art" },
                { id: "audio", icon: "🎵", label: "Audio Interrupt" },
              ] as const).map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => setGameMode(id)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    background: gameMode === id ? "#2563EB" : "transparent",
                    color: gameMode === id ? "white" : "#64748B",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Energy Orb */}
            {gameMode === "orb" && (
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>Energy Orb — Client View</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>Threshold: 60 · Orb grows + turns green above threshold</div>
                  </div>
                </div>
                <GameFeedback score={rewardVal ?? null} threshold={60} />
              </div>
            )}

            {/* Generative Art */}
            {gameMode === "art" && (
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>Generative Art — Client View</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>Your brain is the paintbrush. Colors deepen and motion quickens as focus improves.</div>
                <div style={{
                  height: 300, borderRadius: 16, position: "relative", overflow: "hidden",
                  background: rewardVal != null
                    ? rewardVal >= 70
                      ? "linear-gradient(-45deg, #064E3B, #065F46, #0F172A, #10B981, #34D399, #064E3B)"
                      : rewardVal >= 40
                      ? "linear-gradient(-45deg, #0F172A, #1E3A5F, #1E40AF, #1D4ED8, #3B82F6, #0F172A)"
                      : "linear-gradient(-45deg, #0F172A, #1C1018, #3B0764, #4C0519, #7C3AED, #0F172A)"
                    : "linear-gradient(-45deg, #0F172A, #1E293B)",
                  backgroundSize: "400% 400%",
                  animation: `artShift ${rewardVal != null ? Math.max(2, 9 - (rewardVal / 100) * 7).toFixed(1) : "9"}s ease infinite`,
                  transition: "background 2s ease",
                }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                    <div style={{ fontSize: "clamp(3.5rem, 9vw, 5.5rem)", fontWeight: 800, color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: "0 0 60px rgba(255,255,255,0.4)" }}>
                      {rewardVal != null ? rewardVal.toFixed(0) : "—"}
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
                      {rewardVal == null ? "—" : rewardVal >= 80 ? "Peak focus ✦" : rewardVal >= 60 ? "On target" : rewardVal >= 40 ? "Building..." : "Warming up"}
                    </div>
                  </div>
                  {rewardVal != null && rewardVal >= 35 && (
                    <>
                      <div style={{ position: "absolute", top: "18%", left: "12%", width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.07)", animation: "floatA 5s ease-in-out infinite" }} />
                      <div style={{ position: "absolute", bottom: "22%", right: "16%", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", animation: "floatB 6.5s ease-in-out infinite" }} />
                      <div style={{ position: "absolute", top: "55%", left: "70%", width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.09)", animation: "floatA 4s ease-in-out infinite 1s" }} />
                    </>
                  )}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
                  Inspired by BrainPaint — fractal art that evolves with your brainwaves
                </div>
              </div>
            )}

            {/* Audio Interrupt */}
            {gameMode === "audio" && (
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>Audio Interrupt — Client View</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>Music plays when you&apos;re on target. When focus drops, audio pauses — a gentle nudge to refocus.</div>
                <div style={{
                  background: "#0F172A", borderRadius: 16, padding: "24px 28px",
                  opacity: rewardVal != null && rewardVal >= 60 ? 1 : 0.5,
                  transition: "opacity 0.8s ease",
                }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 12, flexShrink: 0,
                      background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: rewardVal != null && rewardVal >= 60 ? "spin 12s linear infinite" : "none",
                    }}>
                      <span style={{ fontSize: 28 }}>🎵</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>Ambient Focus Mix</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>EEGBase · Curated for neurofeedback</div>
                      <div style={{ height: 3, background: "#1E293B", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", background: "linear-gradient(90deg, #2563EB, #7C3AED)",
                          width: rewardVal != null && rewardVal >= 60 ? `${35 + (elapsed % 60)}%` : "35%",
                          transition: "width 1s linear",
                        }} />
                      </div>
                    </div>
                  </div>
                  {rewardVal != null && rewardVal >= 60 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                      <span style={{ fontSize: 22, color: "#10B981" }}>▶</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>Playing — keep it up!</span>
                      <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                        {[8, 14, 10, 16, 6].map((h, i) => (
                          <div key={i} style={{ width: 3, borderRadius: 99, background: "#10B981", height: h, animation: `soundBar ${0.35 + i * 0.1}s ease-in-out infinite alternate` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                      <span style={{ fontSize: 22, color: "#F59E0B" }}>⏸</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>Paused — bring your focus back</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#1E293B", borderRadius: 10, fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
                  <strong>How it works:</strong> Music pauses the moment reward score drops below 60. Clients naturally learn to self-regulate to keep the music playing — no instructions needed. Inspired by NeurOptimal&apos;s audio interrupt method.
                </div>
              </div>
            )}

            {/* Metrics row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="demo-grid-2">
              {[
                { label: "Score", value: rewardVal != null ? rewardVal.toFixed(1) : "—", color: rewardColor },
                { label: "Focus band (β)", value: sample?.beta != null ? (sample.beta * 100).toFixed(1) + "%" : "—", color: "#EC4899" },
                { label: "Heart rate", value: sample?.heartRate != null ? sample.heartRate.toFixed(0) + " bpm" : "—", color: "#F59E0B" },
                { label: "HRV", value: sample?.hrvRmssd != null ? sample.hrvRmssd.toFixed(1) + " ms" : "—", color: "#8B5CF6" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HRV / BIOFEEDBACK ── */}
        {tab === "hrv" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Heart & Breathing (HRV)</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>Monitor heart rate variability and breathing coherence alongside EEG — all in one view. Helps clients learn to combine calm breathing with focused brain states.</p>
            </div>

            {/* Live HRV metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-2">
              {[
                { label: "Heart Rate", val: sample?.heartRate, color: "#EF4444", unit: "bpm", norm: "60–80 bpm", icon: "❤️" },
                { label: "HRV (RMSSD)", val: sample?.hrvRmssd, color: "#8B5CF6", unit: "ms", norm: "Target: >50 ms", icon: "📊" },
                { label: "Coherence", val: sample?.hrvRmssd != null ? Math.min(9.9, (sample.hrvRmssd / 10)).toFixed(1) : null, color: "#10B981", unit: "/ 10", norm: "High: >8.0", icon: "🌊" },
                { label: "Resonance Freq", val: "6.0", color: "#F59E0B", unit: "breaths/min", norm: "Personalised target", icon: "🫁" },
              ].map(({ label, val, color, unit, norm, icon }) => (
                <div key={label} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>
                    {val != null ? (typeof val === "string" ? val : Number(val).toFixed(0)) : "—"} <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>{unit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{norm}</div>
                </div>
              ))}
            </div>

            {/* HRV trend chart */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Live HRV Waveform — RMSSD</h3>
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>● Recording</span>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: 4 }}>
                  {["100", "75", "50", "25", "0"].map((v) => (
                    <span key={v} style={{ fontSize: 9, color: "#CBD5E1", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{v}</span>
                  ))}
                </div>
                <div style={{ paddingLeft: 22 }}>
                  <LiveChart data={reward.data.map((r) => r * 0.6 + 0.3)} color="#8B5CF6" label="HRV RMSSD (ms) · last 60s" height={120} />
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Avg RMSSD this session", val: "47 ms", color: "#10B981" },
                  { label: "Baseline (last 3 sessions)", val: "41 ms", color: "#94A3B8" },
                  { label: "Coherence time >8.0", val: "68%", color: "#2563EB" },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combined EEG + HRV feedback */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }} className="demo-grid-2">
              <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>Combined EEG + HRV Score</div>
                <p style={{ fontSize: 11, color: "#475569", marginBottom: 16 }}>Both channels must exceed threshold for maximum reward — trains mind-body coherence simultaneously.</p>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>EEG Alpha</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>{sample?.alpha != null ? (sample.alpha * 100).toFixed(0) : "—"}<span style={{ fontSize: 12 }}>%</span></div>
                  </div>
                  <div style={{ fontSize: 24, color: "#475569" }}>×</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>HRV Coherence</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#8B5CF6" }}>{sample?.hrvRmssd != null ? Math.min(9.9, sample.hrvRmssd / 10).toFixed(1) : "—"}<span style={{ fontSize: 12 }}>/ 10</span></div>
                  </div>
                  <div style={{ fontSize: 24, color: "#475569" }}>=</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Combined</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: rewardColor }}>{rewardVal != null ? rewardVal.toFixed(0) : "—"}</div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Resonance Frequency Trainer</div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Paced breathing guide at client&apos;s personal resonance frequency (typically 4.5–7 breaths/min) to maximise HRV amplitude.</p>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: breathPhase === "Inhale" ? "rgba(37,99,235,0.2)" : "rgba(37,99,235,0.2)",
                    border: `4px solid ${breathPhase === "Inhale" ? "#2563EB" : "#93C5FD"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 12px",
                    animation: "breathe 10s ease-in-out infinite",
                    transition: "background 0.5s, border-color 0.5s",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", transition: "opacity 0.3s" }}>{breathPhase}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>6.0 breaths/min · 5s inhale / 5s exhale</div>
                </div>
              </div>
            </div>

            {/* Wearable import */}
            <div style={{ background: "rgba(6,78,59,0.35)", border: "1px solid #065F46", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399", marginBottom: 8 }}>📱 Wearable Data Import</div>
              <p style={{ fontSize: 12, color: "#6EE7B7", marginBottom: 12 }}>Import overnight HRV and sleep data from wearables. If the client slept poorly, the AI suggests a lower-intensity session today.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { name: "Oura Ring", icon: "💍", status: "Connected · Last sync 6h ago", active: true },
                  { name: "Apple Watch", icon: "⌚", status: "Connect →", active: false },
                  { name: "Garmin", icon: "🏃", status: "Connect →", active: false },
                  { name: "Whoop", icon: "💪", status: "Connect →", active: false },
                ].map(({ name, icon, status, active }) => (
                  <div key={name} style={{ background: active ? "#1E293B" : "#243148", border: active ? "1.5px solid #10B981" : "1px solid #334155", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{name}</div>
                      <div style={{ fontSize: 11, color: active ? "#10B981" : "#94A3B8" }}>{status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BRAIN MAP + Z-SCORE ── */}
        {tab === "brain" && (
          <div>
            <div style={{ ...card, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Prefrontal Activity Map</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 12, lineHeight: 1.6 }}>
                This map shows blood flow to the front of the brain — the decision-making and focus centre. Warmer colors (green → red) mean more oxygen-rich blood is flowing there. It updates live as the session runs.
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { color: "#10B981", label: "OxyHb", desc: "Oxygen-rich blood flow" },
                  { color: "#EC4899", label: "Alpha", desc: "Relaxed attention" },
                  { color: "#8B5CF6", label: "Theta", desc: "Deep/drowsy waves" },
                ].map(({ color, label, desc }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1E293B", borderRadius: 8, padding: "5px 10px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#CBD5E1" }}>{label}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>— {desc}</span>
                  </div>
                ))}
              </div>
              <BrainMapPanel
                oxyHbLeft={sample?.oxyHbLeft ?? null}
                oxyHbRight={sample?.oxyHbRight ?? null}
                deoxyHbLeft={sample?.deoxyHbLeft ?? null}
                deoxyHbRight={sample?.deoxyHbRight ?? null}
                alpha={sample?.alpha ?? null}
                theta={sample?.theta ?? null}
                beta={sample?.beta ?? null}
                title="Live Prefrontal fNIRS"
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }} className="demo-grid-2">
                {[
                  { data: oxyL.data, color: "#10B981", label: "OxyHb L · prefrontal" },
                  { data: oxyR.data, color: "#0EA5E9", label: "OxyHb R · prefrontal" },
                ].map(({ data, color, label }) => (
                  <div key={label} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 12, padding: 14 }}>
                    <LiveChart data={data} color={color} label={label} height={64} />
                  </div>
                ))}
              </div>
            </div>

            {/* Z-score training panel */}
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Real-Time Z-Score Training</span>
                <span style={{ fontSize: 10, background: "#2563EB", color: "white", borderRadius: 99, padding: "2px 8px", fontWeight: 700 }}>LIVE</span>
              </div>
              <p style={{ fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.5 }}>
                We compare your client&apos;s brainwaves in real time to <strong style={{ color: "#A5B4FC" }}>847 healthy adults of the same age</strong>. The colored bars show how far they differ — the goal is to bring each band closer to 0 (the healthy average). A bar that shrinks toward the center means the training is working.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="demo-grid-3">
                {[
                  { label: "Theta (4–8 Hz)", val: thetaZ, norm: "0.28", sd: "0.08", color: "#F59E0B", target: "Reduce toward 0 (currently elevated)" },
                  { label: "Alpha (8–12 Hz)", val: alphaZ, norm: "0.42", sd: "0.09", color: "#10B981", target: "Maintain within ±1 SD" },
                  { label: "Beta (12–30 Hz)", val: betaZ,  norm: "0.22", sd: "0.06", color: "#EC4899", target: "Increase toward +0.5 SD" },
                ].map(({ label, val, norm, sd, color, target }) => {
                  const n = val ? parseFloat(val) : 0;
                  const barWidth = Math.min(100, Math.abs(n) * 25);
                  const devColor = Math.abs(n) > 2 ? "#EF4444" : Math.abs(n) > 1 ? "#F59E0B" : "#10B981";
                  return (
                    <div key={label} style={{ background: "#1E293B", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: devColor, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
                        {val ? (n > 0 ? "+" : "") + val : "—"} <span style={{ fontSize: 14, fontWeight: 500, color: "#475569" }}>SD</span>
                      </div>
                      {/* Deviation bar */}
                      <div style={{ height: 6, background: "#0F172A", borderRadius: 99, marginBottom: 8, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: `${barWidth / 2}%`, background: devColor, ...(n < 0 ? { right: "50%", left: "auto" } : {}) }} />
                        <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 1, background: "#475569" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>
                        Norm: {norm} ± {sd}<br />
                        <span style={{ color: devColor }}>{target}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PHQ-9 / GAD-7 ── */}
        {tab === "outcomes" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Questionnaires</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
                Send depression and anxiety check-ins to clients on a schedule (e.g. every 5 sessions). Clients fill them out on their phone, and scores automatically appear alongside their brain data.
              </p>
            </div>

            {/* Questionnaire schedule demo */}
            <div style={{ background: "rgba(6,78,59,0.35)", border: "1px solid #065F46", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Automated Questionnaire Schedule</div>
                <div style={{ fontSize: 13, color: "#6EE7B7" }}>PHQ-9 every 5 sessions · GAD-7 every 5 sessions · ADHD-RS at intake + discharge</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                {["PHQ-9", "GAD-7", "ADHD-RS", "DASS-21"].map((q) => (
                  <span key={q} style={{ fontSize: 11, background: "rgba(6,78,59,0.4)", border: "1px solid #065F46", borderRadius: 6, padding: "4px 10px", color: "#34D399", fontWeight: 600 }}>{q}</span>
                ))}
              </div>
            </div>

            <ClinicalQuestionnaire clientName="Sarah Mitchell" />
          </div>
        )}

        {/* ── PROGRESS ── */}
        {tab === "progress" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Longitudinal Progress Dashboard</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#CBD5E1" }}>Sarah Mitchell · 20 sessions</span>
                <span style={{ background: "rgba(120,53,15,0.4)", border: "1px solid #92400E", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: "#FCD34D" }}>🔥 8-session streak</span>
                <span style={{ background: "rgba(6,78,59,0.4)", border: "1px solid #065F46", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: "#34D399" }}>✓ 95% attendance</span>
                <span style={{ background: "rgba(30,58,138,0.4)", border: "1px solid #3B82F6", borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: "#60A5FA" }}>↑ Top 12% of clients</span>
              </div>
            </div>

            {/* AI stall detection banner */}
            <div style={{ background: "rgba(120,53,15,0.3)", border: "1.5px solid #92400E", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FCD34D", marginBottom: 4 }}>
                  EEGBase AI · Session 8 Insight — Theta/Beta ratio not improving
                </div>
                <div style={{ fontSize: 13, color: "#FDE68A", lineHeight: 1.6 }}>
                  θ/β Z-score has remained above 2.0 SD for the last 3 sessions (S6: +2.1, S7: +2.0, S8: +2.2). 74% of similar profiles in the community database responded to Alpha-Theta protocol switch within 2 sessions.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setRecommendationApplied(true)}
                    style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", background: recommendationApplied ? "#10B981" : "#F59E0B", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                  >
                    {recommendationApplied ? "✓ Protocol Updated to Alpha-Theta" : "Apply Recommendation"}
                  </button>
                  <button style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", background: "#1E293B", color: "#FCD34D", border: "1px solid #92400E", borderRadius: 6, cursor: "pointer" }}>
                    View Similar Cases
                  </button>
                  <button style={{ fontSize: 12, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>Dismiss</button>
                </div>
              </div>
            </div>

            {/* Reward trajectory */}
            <div style={{ ...card, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Reward Score Trajectory</h3>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 100 }}>
                {SESSION_HISTORY.map((s) => (
                  <div key={s.session} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div
                      title={`Session ${s.session}: ${s.reward.toFixed(1)}`}
                      style={{
                        flex: 1, width: "100%", borderRadius: "4px 4px 0 0",
                        background: `linear-gradient(180deg, ${s.reward >= 70 ? "#10B981" : s.reward >= 50 ? "#F59E0B" : "#EF4444"}, ${s.reward >= 70 ? "#6EE7B7" : s.reward >= 50 ? "#FCD34D" : "#FCA5A5"})`,
                        height: `${(s.reward / 100) * 88}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#94A3B8" }}>Session 1</span>
                <span style={{ fontSize: 10, color: "#94A3B8" }}>Session 20</span>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Session 1 avg", value: SESSION_HISTORY[0].reward.toFixed(1), color: "#EF4444" },
                  { label: "Session 20 avg", value: SESSION_HISTORY[19].reward.toFixed(1), color: "#10B981" },
                  { label: "Improvement", value: `+${(SESSION_HISTORY[19].reward - SESSION_HISTORY[0].reward).toFixed(1)}`, color: "#2563EB" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PHQ-9 + GAD-7 + theta/beta over time */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }} className="demo-grid-3">
              {[
                { label: "PHQ-9 (Depression)", key: "phq9" as const, color: "#6366F1", max: 27, unit: "", improving: "lower" },
                { label: "GAD-7 (Anxiety)", key: "gad7" as const, color: "#F59E0B", max: 21, unit: "", improving: "lower" },
                { label: "θ/β Z-Score", key: "thetaBeta" as const, color: "#EF4444", max: 3, unit: " SD", improving: "lower" },
              ].map(({ label, key, color, max, unit }) => {
                const first = SESSION_HISTORY[0][key] as number;
                const last = SESSION_HISTORY[19][key] as number;
                const delta = last - first;
                const improved = delta < 0;
                return (
                  <div key={key} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{label} Trend</h3>
                      <span style={{ fontSize: 11, fontWeight: 700, color: improved ? "#10B981" : "#EF4444", background: improved ? "rgba(6,78,59,0.35)" : "rgba(127,29,29,0.35)", padding: "2px 8px", borderRadius: 99 }}>
                        {improved ? "↓" : "↑"} {Math.abs(delta).toFixed(key === "thetaBeta" ? 1 : 0)}{unit}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 120 }}>
                      {SESSION_HISTORY.map((s) => (
                        <div key={s.session} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div title={`S${s.session}: ${key === "thetaBeta" ? (s[key] as number).toFixed(1) : s[key]}${unit}`} style={{
                            width: "100%", borderRadius: "3px 3px 0 0",
                            background: color,
                            height: `${(Math.min(s[key] as number, max) / max) * 116}px`,
                            opacity: 0.5 + (s.session / 20) * 0.5,
                            transition: "height 0.3s",
                          }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>S1: {key === "thetaBeta" ? (first).toFixed(1) : Math.round(first)}{unit}</span>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>S20: {key === "thetaBeta" ? (last).toFixed(1) : Math.round(last)}{unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Session table */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Session History</h3>
                <button style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", background: "#2563EB", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
                  Export PDF Report
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#1E293B" }}>
                      {["#", "Date", "Duration", "Reward", "θ/β Z", "PHQ-9", "GAD-7", "Notes"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...SESSION_HISTORY].reverse().slice(0, 8).map((s) => (
                      <tr key={s.session} style={{ borderTop: "1px solid #334155" }}>
                        <td style={{ padding: "10px 16px", color: "#94A3B8", fontWeight: 600 }}>{s.session}</td>
                        <td style={{ padding: "10px 16px", color: "#94A3B8" }}>{s.date}</td>
                        <td style={{ padding: "10px 16px", color: "#94A3B8" }}>{s.duration} min</td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontWeight: 700, color: s.reward >= 70 ? "#10B981" : s.reward >= 50 ? "#F59E0B" : "#EF4444", fontVariantNumeric: "tabular-nums" }}>
                            {s.reward.toFixed(1)}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", fontVariantNumeric: "tabular-nums" }}>
                          <span style={{ color: s.thetaBeta > 2 ? "#EF4444" : s.thetaBeta > 1.5 ? "#F59E0B" : "#10B981", fontWeight: 600 }}>
                            +{s.thetaBeta.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", fontVariantNumeric: "tabular-nums", color: "#94A3B8" }}>{s.phq9}</td>
                        <td style={{ padding: "10px 16px", fontVariantNumeric: "tabular-nums", color: "#94A3B8" }}>{s.gad7}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <button style={{ fontSize: 11, color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>AI Note</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── AI INSIGHTS ── */}
        {tab === "ai" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>AI Insights</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
                EEGBase AI watches session data and flags when a client is stalled — then suggests the next protocol to try, backed by similar cases from 847 anonymised clinics. It also drafts clinical notes you can copy straight to your EHR.
              </p>
            </div>

            {/* Protocol recommendation card */}
            <div style={{ background: "#1E1B4B", borderRadius: 16, padding: 24, marginBottom: 16, border: "1px solid #3730A3" }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>EEGBase AI · Protocol Recommendation Engine</span>
                <span style={{ marginLeft: "auto", fontSize: 10, background: "#4F46E5", color: "white", borderRadius: 99, padding: "3px 10px", fontWeight: 700 }}>Session 8 of 20</span>
              </div>

              <div style={{ background: "#312E81", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Signal Detected · Stalled Progress</div>
                <div style={{ fontSize: 14, color: "#E0E7FF", lineHeight: 1.7, marginBottom: 12 }}>
                  Sarah Mitchell&apos;s <strong style={{ color: "#A5B4FC" }}>θ/β Z-score has not improved</strong> over sessions 6–8 (S6: +2.1 SD, S7: +2.0 SD, S8: +2.2 SD) despite consistent SMR training at Cz. Current protocol (SMR 12–15 Hz) appears insufficient to normalize elevated frontal theta.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }} className="demo-grid-3">
                  {[
                    { label: "Session 6", val: "+2.1 SD", color: "#EF4444" },
                    { label: "Session 7", val: "+2.0 SD", color: "#EF4444" },
                    { label: "Session 8", val: "+2.2 SD", color: "#EF4444" },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: "#1E1B4B", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#065F46", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Recommendation</div>
                <div style={{ fontSize: 14, color: "#D1FAE5", lineHeight: 1.7, marginBottom: 10 }}>
                  Switch to <strong style={{ color: "#6EE7B7" }}>Alpha-Theta (Pz/Oz, 8–12 Hz reward)</strong> for sessions 9–12. Based on <strong style={{ color: "#6EE7B7" }}>847 similar client profiles</strong> in the EEGBase community database, <strong style={{ color: "#6EE7B7" }}>74%</strong> showed θ/β improvement within 2 sessions after this protocol transition.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setRecommendationApplied(true)}
                    style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px", background: recommendationApplied ? "#10B981" : "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
                  >
                    {recommendationApplied ? "✓ Protocol Updated" : "Apply Recommendation"}
                  </button>
                  <button style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", background: "transparent", color: "#6EE7B7", border: "1px solid #059669", borderRadius: 8, cursor: "pointer" }}>
                    View 847 Similar Cases
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 11, color: "#818CF8", lineHeight: 1.5 }}>
                ℹ️ AI insights are decision support tools, not medical advice. Clinician judgment always prevails. Model trained on de-identified session data from consenting EEGBase clinics.
              </div>
            </div>

            {/* SOAP note generator */}
            <div style={{ ...card }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>AI-Drafted SOAP Note</h3>
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>Session 8 · May 4, 2026 · Auto-generated from session data — edit before saving</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(SOAP_NOTE); setSoapCopied(true); setTimeout(() => setSoapCopied(false), 2000); }}
                    style={{ fontSize: 12, fontWeight: 700, padding: "7px 14px", background: soapCopied ? "#10B981" : "#2563EB", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                  >
                    {soapCopied ? "✓ Copied!" : "Copy to EHR"}
                  </button>
                  <button style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", background: "#1E293B", color: "#94A3B8", border: "1px solid #334155", borderRadius: 6, cursor: "pointer" }}>
                    Download PDF
                  </button>
                </div>
              </div>

              {[
                { label: "S — Subjective", color: "#6366F1", lines: ["Client reports moderate difficulty concentrating this week; rated focus 4/10.", "Sleep quality 6/10 (down from 7 last visit). No medication changes.", "Reports feeling \"stuck\" on same tasks at work."] },
                { label: "O — Objective",  color: "#0EA5E9", lines: ["22-minute SMR (12–15 Hz) training at Cz. Average reward score 64.2/100 (above-threshold 71% of session).", "θ/β Z-score: +2.2 SD above age/sex-matched norm (ages 28–35, eyes-open).", "HR 68 bpm · HRV-RMSSD 45 ms (baseline normal). PHQ-9: 11 (moderate) · GAD-7: 8 (mild)."] },
                { label: "A — Assessment", color: "#F59E0B", lines: ["Client engagement improving — reward score +18% from session 1 baseline (38.4).", "Theta/beta ratio stalled above normative range (>1.5 SD) across sessions 6–8 despite compliance.", "PHQ-9 depression score trending down from 18 → 11 over 8 sessions — positive trajectory.", "Alpha-theta protocol switch indicated given stalled θ/β trajectory."] },
                { label: "P — Plan",       color: "#10B981", lines: ["1. Switch to Alpha-Theta (Pz/Oz, 8–12 Hz reward) for sessions 9–12.", "2. Reassess PHQ-9 at session 10.", "3. Discuss sleep hygiene at next appointment.", "4. Continue 22-minute weekly sessions.", "5. Client to complete daily symptom journal between sessions."] },
              ].map(({ label, color, lines }) => (
                <div key={label} style={{ marginBottom: 16, paddingLeft: 14, borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
                  {lines.map((l, i) => (
                    <div
                      key={i}
                      contentEditable
                      suppressContentEditableWarning
                      onFocus={(e) => { e.currentTarget.style.background = "#243148"; e.currentTarget.style.borderRadius = "4px"; }}
                      onBlur={(e) => { e.currentTarget.style.background = "transparent"; }}
                      style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, marginBottom: 2, outline: "none", padding: "1px 4px", cursor: "text", borderRadius: 4, transition: "background 0.15s" }}
                    >{l}</div>
                  ))}
                </div>
              ))}

              <div style={{ marginTop: 12, padding: "10px 14px", background: "#1E293B", borderRadius: 8, border: "1px solid #334155", fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                ✏️ <strong>Click any line above to edit.</strong> Auto-populated from session metrics · PHQ-9 · Z-score database · prior session notes.
              </div>
            </div>
          </div>
        )}

        {/* ── SCHEDULING ── */}
        {tab === "schedule" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Scheduling</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
                Book appointments, send reminders, and view session history — all in one place. No need for a separate tool like Calendly or SimplePractice.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }} className="demo-grid-2">
              {/* Calendar */}
              <div style={{ ...card }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9" }}>May 2026</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #334155", borderRadius: 6, background: "#1E293B", cursor: "pointer", color: "#CBD5E1" }}>‹</button>
                    <button style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #334155", borderRadius: 6, background: "#1E293B", cursor: "pointer", color: "#CBD5E1" }}>›</button>
                    <button style={{ fontSize: 12, padding: "5px 14px", border: "none", borderRadius: 6, background: "#2563EB", color: "white", cursor: "pointer", fontWeight: 600 }}>+ New</button>
                  </div>
                </div>
                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94A3B8", padding: "4px 0" }}>{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {/* May 2026 starts on Friday (offset 4 days) */}
                  {Array.from({ length: 4 }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const hasAppt = [6, 7, 8, 9, 10, 13, 14, 15, 16, 20, 21].includes(day);
                    const isToday = day === 4;
                    return (
                      <div key={day} style={{
                        aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        background: isToday ? "#2563EB" : hasAppt ? "rgba(30,58,138,0.25)" : "transparent",
                        border: isToday ? "none" : hasAppt ? "1px solid #3B82F6" : "1px solid transparent",
                        cursor: "pointer", fontSize: 13, fontWeight: isToday ? 800 : 500,
                        color: isToday ? "white" : "#CBD5E1",
                        position: "relative",
                      }}>
                        {day}
                        {hasAppt && !isToday && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#2563EB", marginTop: 2 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar: upcoming + reminders */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ ...card, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Upcoming Appointments</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {APPOINTMENTS.slice(0, 4).map((a) => (
                      <div key={a.time} style={{ padding: "10px 12px", borderRadius: 10, background: "#1E293B", border: "1px solid #334155" }}>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 3 }}>{a.time}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 1 }}>{a.client}</div>
                        <div style={{ fontSize: 11, color: "#CBD5E1", marginBottom: 4 }}>{a.protocol}</div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: a.status === "confirmed" ? "rgba(6,78,59,0.4)" : "rgba(120,53,15,0.4)",
                          color: a.status === "confirmed" ? "#34D399" : "#FCD34D",
                        }}>
                          {a.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...card, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Automated Reminders</h3>
                  {([
                    { key: "sms" as const,    label: "24h SMS reminder" },
                    { key: "email" as const,  label: "1h email reminder" },
                    { key: "noshow" as const, label: "No-show follow-up" },
                    { key: "lapsed" as const, label: "Lapsed client (14d)" },
                  ]).map(({ key, label }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: "#CBD5E1" }}>{label}</span>
                      <div
                        onClick={() => setReminderToggles((prev) => ({ ...prev, [key]: !prev[key] }))}
                        style={{ width: 36, height: 20, borderRadius: 99, background: reminderToggles[key] ? "#2563EB" : "#334155", position: "relative", cursor: "pointer", transition: "background 0.2s" }}
                      >
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: reminderToggles[key] ? 18 : 2, transition: "left 0.2s" }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #334155" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Sync to calendar</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["Google Calendar", "iCal"].map((cal) => (
                        <button key={cal} style={{ fontSize: 11, fontWeight: 600, padding: "5px 10px", border: "1px solid #334155", borderRadius: 6, background: "#1E293B", cursor: "pointer", color: "#CBD5E1" }}>
                          {cal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing strip */}
            <div style={{ marginTop: 16, background: "rgba(6,78,59,0.35)", border: "1px solid #065F46", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399", marginBottom: 2 }}>Billing + CPT Codes — Zero competitors have this</div>
                  <div style={{ fontSize: 12, color: "#6EE7B7" }}>After each session, EEGBase auto-generates a superbill with CPT 90901 (biofeedback), 97012, and E/M codes. Export to CMS-1500 or Stripe self-pay. No separate billing software needed.</div>
                </div>
                <button style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "7px 16px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  Preview Superbill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PROTOCOL LIBRARY ── */}
        {tab === "protocols" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Condition-Specific Protocol Library</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
                50+ evidence-based protocols organised by condition. Search, preview, and apply in one click — no more looking up papers or guessing electrode placement. Zero competitors have a searchable protocol library.
              </p>
            </div>

            {/* Quick-filter tags */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {(["All", "ADHD", "Anxiety", "Trauma / PTSD", "Sleep", "Peak Performance"] as const).map((tag) => {
                const active = tag === "All" ? !protocolSearch : protocolSearch === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setProtocolSearch(tag === "All" ? "" : tag)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer",
                      background: active ? "#2563EB" : "#1E293B",
                      color: active ? "white" : "#94A3B8",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Search bar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
              <label htmlFor="protocol-search" style={{ display: "none" }}>Search protocols</label>
              <input
                id="protocol-search"
                aria-label="Search protocols"
                value={protocolSearch}
                onChange={(e) => setProtocolSearch(e.target.value)}
                placeholder="Search by condition, name, or tag…"
                style={{ flex: 1, padding: "10px 14px", border: "1px solid #334155", borderRadius: 10, fontSize: 13, outline: "none", background: "#1E293B", color: "#CBD5E1" }}
              />
              {protocolSearch && (
                <button onClick={() => setProtocolSearch("")} aria-label="Clear search" style={{ padding: "10px 14px", background: "#243148", color: "#94A3B8", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✕</button>
              )}
            </div>

            {/* Protocol cards */}
            {(() => {
              const allProtocols = [
                {
                  id: "adhd-smr",
                  condition: "ADHD",
                  name: "Theta/Beta + SMR Training",
                  sites: "Cz, Fz",
                  bands: "Reward: SMR 12–15 Hz · Inhibit: Theta 4–8 Hz",
                  duration: "20–30 min · 40+ sessions",
                  evidence: "Strong",
                  evidenceColor: "#10B981",
                  protocols: ["EEGer Classic", "Lubar Protocol"],
                  tags: ["ADHD", "Focus", "Inattention"],
                  desc: "The most-studied NFB protocol for ADHD. Reduces theta/beta ratio, increases SMR. Recommended first-line before alpha-theta for inattentive subtype.",
                },
                {
                  id: "trauma-at",
                  condition: "Trauma / PTSD",
                  name: "Alpha-Theta (Peniston) Protocol",
                  sites: "Pz, Oz",
                  bands: "Reward: Alpha 8–12 Hz + Theta 4–8 Hz",
                  duration: "30 min · 20–30 sessions",
                  evidence: "Moderate–Strong",
                  evidenceColor: "#F59E0B",
                  protocols: ["Peniston-Kulkosky", "Scott-Kaiser"],
                  tags: ["PTSD", "Trauma", "Anxiety", "Addiction"],
                  desc: "Produces theta-dominant relaxed state associated with memory reconsolidation. Well-supported for PTSD and substance dependence. Requires clinical preparation — not first-line without proper intake.",
                },
                {
                  id: "ilf-trauma",
                  condition: "Trauma / PTSD",
                  name: "Infraslow Frequency (ILF) Training",
                  sites: "Fp1/Fp2, T3/T4",
                  bands: "Reward: 0.01–0.1 Hz (infraslow)",
                  duration: "25 min · 20–40 sessions",
                  evidence: "Emerging",
                  evidenceColor: "#6366F1",
                  protocols: ["Othmer ILF", "ANS Regulation"],
                  tags: ["Trauma", "Dysregulation", "Autonomic"],
                  desc: "Targets autonomic nervous system regulation via slow cortical potentials. Particularly effective for highly dysregulated clients who cannot tolerate standard amplitude training. Othmer Method.",
                },
                {
                  id: "sleep-spindle",
                  condition: "Sleep Disorders",
                  name: "Sleep Spindle Enhancement",
                  sites: "Cz, Pz",
                  bands: "Reward: Sigma 12–16 Hz (sleep spindles)",
                  duration: "20 min daytime training · 20 sessions",
                  evidence: "Moderate",
                  evidenceColor: "#F59E0B",
                  protocols: ["Sleep NFB", "Circadian Protocol"],
                  tags: ["Insomnia", "Sleep", "Memory"],
                  desc: "Sigma band training during wakefulness enhances sleep spindle density overnight. Paired with Oura Ring data import to track sleep architecture changes between sessions.",
                },
                {
                  id: "anxiety-alpha",
                  condition: "Anxiety",
                  name: "Alpha Asymmetry Training (F4 > F3)",
                  sites: "F3, F4",
                  bands: "Reward: Right frontal alpha · Inhibit: Left frontal alpha",
                  duration: "20 min · 20–30 sessions",
                  evidence: "Moderate",
                  evidenceColor: "#F59E0B",
                  protocols: ["Davidson Asymmetry", "Approach-Withdrawal"],
                  tags: ["Anxiety", "Depression", "Mood"],
                  desc: "Corrects left frontal hypoactivation linked to anxiety and withdrawal states. Increases right alpha relative to left, shifting toward approach motivation. Used for generalised anxiety and MDD.",
                },
                {
                  id: "peak-perf",
                  condition: "Peak Performance",
                  name: "Alpha Peak Frequency (APF) Optimisation",
                  sites: "Pz, Oz",
                  bands: "Reward: Individual alpha peak ±0.5 Hz",
                  duration: "20 min · 10–20 sessions",
                  evidence: "Moderate",
                  evidenceColor: "#F59E0B",
                  protocols: ["Zone Training", "Flow State Protocol"],
                  tags: ["Athletes", "Peak Performance", "Focus", "Flow"],
                  desc: "Trains alpha at the client&apos;s individual peak frequency (typically 9–12 Hz) to maximise processing speed and attentional control. Popular with elite athletes, executives, and musicians.",
                },
              ];
              const filtered = allProtocols.filter((p) =>
                !protocolSearch ||
                p.condition.toLowerCase().includes(protocolSearch.toLowerCase()) ||
                p.name.toLowerCase().includes(protocolSearch.toLowerCase()) ||
                p.tags.some((t) => t.toLowerCase().includes(protocolSearch.toLowerCase()))
              );
              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "48px 24px", background: "#0F172A", borderRadius: 14, border: "1px solid #334155", marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>No protocols found</div>
                    <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>No protocols match &ldquo;{protocolSearch}&rdquo;</div>
                    <button onClick={() => setProtocolSearch("")} style={{ padding: "8px 20px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      Clear search
                    </button>
                  </div>
                );
              }
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }} className="demo-grid-2">
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProtocol(selectedProtocol === p.id ? null : p.id)}
                      style={{
                        background: "#0F172A", border: selectedProtocol === p.id ? "2px solid #2563EB" : "1px solid #334155",
                        borderRadius: 14, padding: 20, cursor: "pointer",
                        boxShadow: selectedProtocol === p.id ? "0 0 0 4px rgba(30,58,138,0.25)" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{p.condition}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{p.name}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: p.evidenceColor + "20", color: p.evidenceColor, whiteSpace: "nowrap" }}>
                          {p.evidence} evidence
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        {p.tags.map((tag) => (
                          <span key={tag} style={{ fontSize: 10, background: "#1E293B", color: "#94A3B8", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6, marginBottom: 10 }}>{p.desc}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {[
                          { label: "Sites", val: p.sites },
                          { label: "Duration", val: p.duration },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ background: "#1E293B", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {selectedProtocol === p.id && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #334155" }}>
                          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                            <strong>Bands:</strong> {p.bands}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setProtocolApplied(p.id); setTimeout(() => setProtocolApplied(null), 2500); }}
                              style={{ flex: 1, fontSize: 12, fontWeight: 700, padding: "8px", background: protocolApplied === p.id ? "#10B981" : "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
                            >
                              {protocolApplied === p.id ? "✓ Applied to Sarah Mitchell!" : "▶ Apply to Sarah Mitchell"}
                            </button>
                            <button onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, fontWeight: 600, padding: "8px 12px", background: "#1E293B", color: "#94A3B8", border: "1px solid #334155", borderRadius: 8, cursor: "pointer" }}>
                              View Evidence
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 12, padding: "14px 18px", fontSize: 12, color: "#94A3B8" }}>
              Showing 6 of 54 protocols. Full library includes ILF variants, LORETA-guided, gamma training, neuromuscular (TBI), and paediatric protocols. Evidence ratings based on Arns et al. 2014, van Doren et al. 2019, and EEGBase community outcome data.
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>One-Click Shareable Progress Reports</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
                Generate plain-English progress reports for clients, parents, or referring physicians. No data export or Word document needed — branded PDF in one click. Only Divergence Neuro offers a comparable report feature; all other competitors lack this entirely.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => { setReportExported(true); setTimeout(() => setReportExported(false), 3000); }}
                style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px", background: reportExported ? "#10B981" : "#2563EB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
              >
                {reportExported ? "✓ PDF Downloaded!" : "⬇ Download PDF Report"}
              </button>
              <button
                onClick={() => { setEmailSent(true); setTimeout(() => setEmailSent(false), 2500); }}
                style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", background: emailSent ? "#10B981" : "#1E293B", color: emailSent ? "white" : "#CBD5E1", border: emailSent ? "none" : "1px solid #334155", borderRadius: 8, cursor: "pointer" }}
              >
                {emailSent ? "✓ Sent to sarah@example.com" : "📧 Email to Client"}
              </button>
              <button
                onClick={() => { setFaxSent(true); setTimeout(() => setFaxSent(false), 2500); }}
                style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", background: faxSent ? "#10B981" : "#1E293B", color: faxSent ? "white" : "#CBD5E1", border: faxSent ? "none" : "1px solid #334155", borderRadius: 8, cursor: "pointer" }}
              >
                {faxSent ? "✓ Sent to Dr. Patel" : "🏥 Send to Referring Physician"}
              </button>
            </div>

            {/* Report preview */}
            <div style={{ background: "white", border: "2px solid #E2E8F0", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              {/* Report header */}
              <div style={{ background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)", padding: "24px 32px", color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>EEGBase Progress Report</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>Client: Sarah Mitchell · Sessions 1–20 · Generated May 4, 2026</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Clinician</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Dr. Jamie Chen, PhD</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Cedar Valley Neurofeedback</div>
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div style={{ padding: "24px 32px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>At a Glance</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="demo-grid-2">
                  {[
                    { label: "Sessions completed", val: "20 / 30", sub: "67% of treatment plan", color: "#2563EB" },
                    { label: "Reward score", val: "+53%", sub: "38.4 → 58.7 avg", color: "#10B981" },
                    { label: "PHQ-9 (depression)", val: "18 → 11", sub: "39% improvement", color: "#10B981" },
                    { label: "GAD-7 (anxiety)", val: "14 → 9", sub: "36% improvement", color: "#10B981" },
                  ].map(({ label, val, sub, color }, i) => (
                    <div key={label} style={{ textAlign: "center", padding: 16, background: "#F8FAFC", borderRadius: 12, animation: `statPop 0.45s ease ${i * 0.1}s both` }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 2 }}>{val}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plain-English summary */}
              <div style={{ padding: "24px 32px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Progress Summary — Plain Language</div>
                {[
                  { icon: "✅", text: "Sarah has completed 20 of 30 planned sessions with excellent attendance (95% show rate). She has made strong progress on the primary treatment goals." },
                  { icon: "📈", text: "Her brain training reward score has increased by 53% since the first session, indicating meaningfully better ability to produce the target brainwave pattern (sensorimotor rhythm, 12–15 Hz)." },
                  { icon: "😊", text: "Depression symptoms (PHQ-9) have decreased from moderate (18) to mild (11). Anxiety symptoms (GAD-7) have decreased from moderate (14) to mild (9)." },
                  { icon: "⚠️", text: "Frontal theta activity remains above the normal range for her age group. The AI has recommended a protocol adjustment (alpha-theta training) starting session 9, which we have implemented." },
                  { icon: "🔮", text: "Projected outcome at 30 sessions: PHQ-9 ≤ 8 (minimal depression), reward score ≥ 70 (above target consistently), based on trajectory and community database comparison." },
                ].map(({ icon, text }, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* Mini trend charts */}
              <div style={{ padding: "24px 32px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Training Trends (Sessions 1–20)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="demo-grid-2">
                  <div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>Reward score trend ↑</div>
                    <LiveChart data={SESSION_HISTORY.map((s) => s.reward / 100)} color="#10B981" label="" height={60} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>PHQ-9 score trend ↓ (lower is better)</div>
                    <LiveChart data={SESSION_HISTORY.map((s) => s.phq9 / 30)} color="#6366F1" label="" height={60} />
                  </div>
                </div>
              </div>

              {/* Next steps */}
              <div style={{ padding: "24px 32px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Recommended Next Steps</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="demo-grid-3">
                  {[
                    { num: "1", text: "Continue alpha-theta training for sessions 9–12", color: "#2563EB" },
                    { num: "2", text: "Re-administer PHQ-9 at session 10 to track trajectory", color: "#6366F1" },
                    { num: "3", text: "Schedule follow-up consultation at session 15 to review goals", color: "#10B981" },
                  ].map(({ num, text, color }) => (
                    <div key={num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{num}</div>
                      <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, padding: "12px 16px", background: "#F8FAFC", borderRadius: 8, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                  This report was auto-generated by EEGBase AI from session data, PHQ-9/GAD-7 scores, and EEG metrics. It is not a medical diagnosis. All clinical decisions are made by the treating clinician.
                </div>
              </div>
            </div>

            {/* EHR integration */}
            <div style={{ marginTop: 16, background: "rgba(6,78,59,0.35)", border: "1px solid #065F46", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399", marginBottom: 8 }}>🏥 EHR Integration — Zero competitors have this</div>
              <p style={{ fontSize: 12, color: "#6EE7B7", marginBottom: 12 }}>Session notes and progress data sync directly to your EHR — no copy-paste. Select your platform:</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["SimplePractice", "TherapyNotes", "Jane App", "TheraNest", "Alma"].map((ehr) => (
                  <button
                    key={ehr}
                    onClick={() => { setEhrCopied(true); setTimeout(() => setEhrCopied(false), 2000); }}
                    style={{ fontSize: 12, fontWeight: 700, padding: "8px 16px", border: "1.5px solid #10B981", borderRadius: 8, background: "#1E293B", color: "#34D399", cursor: "pointer" }}
                  >
                    {ehrCopied ? "✓ Sent!" : `Sync to ${ehr}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COMPETITOR COMPARISON ── */}
        {tab === "compare" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>EEGBase vs All Competitors</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
                Compiled May 2026 from platform docs, clinician reviews, and NeuroBB forums. EEGBase is the only platform that covers every layer — live signal, QEEG, AI, clinical workflow, practice management — in one open-source web app.
              </p>
            </div>

            {/* Why EEGBase summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} className="demo-grid-2">
              {[
                { icon: "🧠", label: "Only platform with fNIRS + EEG + HRV", sub: "Competitors offer one modality; we offer all three", color: "#60A5FA", bg: "rgba(30,58,138,0.25)", border: "#3B82F6" },
                { icon: "🤖", label: "AI protocol recommendations", sub: "74% of stalled clients improve within 2 sessions", color: "#A78BFA", bg: "rgba(76,29,149,0.25)", border: "#7C3AED" },
                { icon: "$0", label: "Zero cost · Open source", sub: "Competitors charge $95–$650/mo. We charge nothing.", color: "#34D399", bg: "rgba(6,78,59,0.35)", border: "#065F46" },
                { icon: "☁️", label: "Browser-based · No install", sub: "Runs on any device — no Windows-only requirement", color: "#38BDF8", bg: "rgba(7,89,133,0.25)", border: "#0EA5E9" },
              ].map(({ icon, label, sub, color, bg, border }) => (
                <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4, lineHeight: 1.3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Category filter pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => setFeatureCategory(null)} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", background: featureCategory === null ? "#2563EB" : "#1E293B", color: featureCategory === null ? "white" : "#94A3B8" }}>All</button>
              {categories.map((c) => (
                <button key={c} onClick={() => setFeatureCategory(featureCategory === c ? null : c)} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", background: featureCategory === c ? "#2563EB" : "#1E293B", color: featureCategory === c ? "white" : "#94A3B8" }}>
                  {c}
                </button>
              ))}
            </div>

            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#1E293B", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", minWidth: 220, position: "sticky", left: 0, background: "#1E293B" }}>Feature</th>
                      {COMPETITORS.map((c) => (
                        <th key={c.key} style={{
                          padding: "12px 12px", textAlign: "center", fontSize: 11, fontWeight: 700,
                          color: c.highlight ? "#60A5FA" : "#94A3B8",
                          background: c.highlight ? "rgba(30,58,138,0.3)" : undefined,
                          minWidth: 90,
                        }}>
                          {c.label}
                          <div style={{ fontSize: 9, fontWeight: 500, color: c.highlight ? "#93C5FD" : "#94A3B8", marginTop: 2 }}>{c.sub}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.map((f, i) => {
                      // Category header rows
                      const prevCat = i > 0 ? filteredFeatures[i - 1].category : null;
                      const showCat = f.category !== prevCat;
                      return (
                        <>
                          {showCat && (
                            <tr key={`cat-${f.category}`}>
                              <td colSpan={COMPETITORS.length + 1} style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", background: "#243148", borderTop: i > 0 ? "2px solid #334155" : undefined }}>
                                {f.category}
                              </td>
                            </tr>
                          )}
                          <tr key={f.feature} style={{ borderTop: "1px solid #334155", background: i % 2 === 0 ? "#0F172A" : "#131C2E" }}>
                            <td style={{ padding: "9px 16px", color: "#CBD5E1", fontWeight: 500, fontSize: 12, position: "sticky", left: 0, background: i % 2 === 0 ? "#0F172A" : "#131C2E" }}>{f.feature}</td>
                            {COMPETITORS.map((c) => {
                              const has = f[c.key as keyof typeof f] as boolean;
                              return (
                                <td key={c.key} style={{ padding: "9px 12px", textAlign: "center", background: c.highlight ? "rgba(30,58,138,0.2)" : undefined }}>
                                  {has
                                    ? <span style={{ color: "#10B981", fontSize: 16, fontWeight: 700 }}>✓</span>
                                    : <span style={{ color: "#334155", fontSize: 14 }}>—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #334155", fontSize: 11, color: "#94A3B8" }}>
                Sources: platform documentation, Capterra/G2 reviews, NeuroBB clinician forums, Neurosity comparison guide (May 2026).
              </div>
            </div>

            {/* Pricing callout */}
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="demo-grid-2">
              {[
                { name: "EEGer",      price: "$95/mo",     note: "Desktop-only, Windows, no AI", highlight: false },
                { name: "Myndlift",   price: "$315/mo",    note: "15 clients + $499+ hardware", highlight: false },
                { name: "NeuroGuide", price: "$3,500–6k",  note: "Analysis-only, steep learning curve", highlight: false },
                { name: "EEGBase",    price: "$0",         note: "Self-hosted, MIT open source, all features", highlight: true },
              ].map(({ name, price, note, highlight }) => (
                <div key={name} style={{
                  background: highlight ? "rgba(30,58,138,0.25)" : "#0F172A",
                  border: highlight ? "2px solid #2563EB" : "1px solid #334155",
                  borderRadius: 14, padding: "18px 20px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>{name}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: highlight ? "#60A5FA" : "#CBD5E1", marginBottom: 4 }}>{price}</div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #1E3A5F 100%)", borderTop: "1px solid #334155", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "#C4B5FD", fontWeight: 600 }}>Ready to use with real clients?</span>
        <a href="/login" style={{ fontSize: 14, fontWeight: 700, padding: "8px 20px", background: "#7C3AED", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
          Get Access →
        </a>
        <a href="https://github.com/jpiscool/eegbase" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>
          ★ GitHub →
        </a>
      </div>
        </div>
      </div>
    </div>
  );
}
