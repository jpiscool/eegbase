"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SimulatorAdapter } from "@/lib/device/simulator";
import type { DeviceSample } from "@/lib/device/adapter";
import { LiveChart } from "@/components/LiveChart";
import { GameFeedback } from "@/components/GameFeedback";
import { BrainMapPanel } from "@/components/BrainMapPanel";
import { ClinicalQuestionnaire } from "@/components/ClinicalQuestionnaire";
import {
  Activity, Gamepad2, Brain, HeartPulse, ClipboardList, TrendingUp,
  Sparkles, Target, Calendar, FileText, BarChart3, CreditCard,
  Users, ShieldCheck, Megaphone, Plug, Search, Bell,
  Pause, Play, RotateCcw, Plus, Volume2, VolumeX, Smartphone,
  Mail, Building2, Download, UploadCloud,
} from "lucide-react";

const MAX_POINTS = 60;
type MainTab = "session" | "game" | "brain" | "outcomes" | "progress" | "ai" | "schedule" | "hrv" | "protocols" | "reports" | "compare" | "devices" | "billing" | "team" | "compliance" | "marketing";

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

// Fixed seed data — realistic learning curve, no Math.random()
// Reward: grows ~38 → ~88; PHQ-9: 18 → 5; GAD-7: 14 → 4; θ/β Z: stays ~2.0–2.4 SD
const SESSION_HISTORY: { session: number; date: string; reward: number; alpha: number; thetaBeta: number; phq9: number; gad7: number; duration: number }[] = [
  { session:  1, date: "Jan  6", reward: 38.2, alpha: 0.32, thetaBeta: 2.38, phq9: 18, gad7: 14, duration: 42 },
  { session:  2, date: "Jan 13", reward: 41.7, alpha: 0.33, thetaBeta: 2.31, phq9: 17, gad7: 13, duration: 44 },
  { session:  3, date: "Jan 20", reward: 43.5, alpha: 0.34, thetaBeta: 2.35, phq9: 16, gad7: 13, duration: 40 },
  { session:  4, date: "Jan 27", reward: 46.1, alpha: 0.35, thetaBeta: 2.27, phq9: 16, gad7: 12, duration: 45 },
  { session:  5, date: "Feb  3", reward: 49.4, alpha: 0.36, thetaBeta: 2.29, phq9: 15, gad7: 12, duration: 43 },
  { session:  6, date: "Feb 10", reward: 51.8, alpha: 0.37, thetaBeta: 2.10, phq9: 14, gad7: 11, duration: 42 },
  { session:  7, date: "Feb 17", reward: 54.3, alpha: 0.38, thetaBeta: 2.04, phq9: 13, gad7: 10, duration: 46 },
  { session:  8, date: "Feb 24", reward: 57.9, alpha: 0.39, thetaBeta: 2.22, phq9: 12, gad7:  9, duration: 44 },
  { session:  9, date: "Mar  3", reward: 60.6, alpha: 0.40, thetaBeta: 2.08, phq9: 11, gad7:  9, duration: 45 },
  { session: 10, date: "Mar 10", reward: 63.1, alpha: 0.41, thetaBeta: 2.01, phq9: 10, gad7:  8, duration: 42 },
  { session: 11, date: "Mar 17", reward: 65.4, alpha: 0.42, thetaBeta: 1.97, phq9:  9, gad7:  7, duration: 48 },
  { session: 12, date: "Mar 24", reward: 67.8, alpha: 0.43, thetaBeta: 1.93, phq9:  9, gad7:  7, duration: 45 },
  { session: 13, date: "Mar 31", reward: 70.2, alpha: 0.44, thetaBeta: 1.88, phq9:  8, gad7:  6, duration: 43 },
  { session: 14, date: "Apr  7", reward: 72.5, alpha: 0.44, thetaBeta: 1.84, phq9:  8, gad7:  6, duration: 46 },
  { session: 15, date: "Apr 14", reward: 74.9, alpha: 0.45, thetaBeta: 1.80, phq9:  7, gad7:  5, duration: 44 },
  { session: 16, date: "Apr 21", reward: 77.3, alpha: 0.46, thetaBeta: 1.76, phq9:  7, gad7:  5, duration: 47 },
  { session: 17, date: "Apr 28", reward: 80.1, alpha: 0.47, thetaBeta: 1.72, phq9:  6, gad7:  4, duration: 45 },
  { session: 18, date: "May  5", reward: 82.6, alpha: 0.47, thetaBeta: 1.68, phq9:  6, gad7:  4, duration: 43 },
  { session: 19, date: "May 12", reward: 85.4, alpha: 0.48, thetaBeta: 1.65, phq9:  5, gad7:  4, duration: 48 },
  { session: 20, date: "May 19", reward: 88.0, alpha: 0.49, thetaBeta: 1.61, phq9:  5, gad7:  4, duration: 46 },
];

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

  const [tab, setTab] = useState<MainTab>(() => {
    // Deep-link support: ?tab=ai opens AI Insights on first load
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("tab");
      const valid: MainTab[] = ["session","game","brain","hrv","outcomes","progress","ai","protocols","schedule","reports","compare","billing","team","compliance","marketing","devices"];
      if (requested && (valid as string[]).includes(requested)) return requested as MainTab;
    }
    return "session";
  });
  const [shareCopied, setShareCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sample, setSample] = useState<DeviceSample | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [soapCopied, setSoapCopied] = useState(false);
  const [recommendationApplied, setRecommendationApplied] = useState(false);
  const [stallAlertDismissed, setStallAlertDismissed] = useState(false);
  const [showClientApp, setShowClientApp] = useState(false);
  const [detailModal, setDetailModal] = useState<{ type: "session" | "competitor" | "scoreBreakdown" | "zscore" | "phq9hist"; data: Record<string, unknown> } | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<{ name: string; x: number; y: number } | null>(null);
  const [connectedWearables, setConnectedWearables] = useState<Set<string>>(new Set());
  const [featureCategory, setFeatureCategory] = useState<string | null>(null);
  const [reportExported, setReportExported] = useState(false);
  const [protocolSearch, setProtocolSearch] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [ehrCopied, setEhrCopied] = useState(false);
  const [protocolApplied, setProtocolApplied] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [faxSent, setFaxSent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSimilarCasesModal, setShowSimilarCasesModal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [showCmdK, setShowCmdK] = useState(false);
  const [cmdKQuery, setCmdKQuery] = useState("");
  const [tourStep, setTourStep] = useState<number | null>(null);
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

  // Cmd-K / Ctrl-K command palette keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdK((v) => !v);
      }
      if (e.key === "Escape") {
        setShowCmdK(false);
        setTourStep(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // 60-second guided tour orchestrator
  useEffect(() => {
    if (tourStep === null) return;
    const TOUR_TABS: MainTab[] = ["session", "ai", "brain", "reports", "marketing", "devices"];
    if (tourStep >= TOUR_TABS.length) {
      setTourStep(null);
      return;
    }
    const t = TOUR_TABS[tourStep];
    setTab(t);
    const timer = setTimeout(() => setTourStep((s) => (s === null ? null : s + 1)), 10000);
    return () => clearTimeout(timer);
  }, [tourStep]);

  // Live Z-score simulation from current EEG data
  const thetaZ = sample?.theta != null ? ((sample.theta - 0.28) / 0.08).toFixed(2) : null;
  const alphaZ = sample?.alpha != null ? ((sample.alpha - 0.42) / 0.09).toFixed(2) : null;
  const betaZ  = sample?.beta  != null ? ((sample.beta  - 0.22) / 0.06).toFixed(2) : null;

  // Dynamic plain-English session status
  const sessionStatus = (() => {
    if (rewardVal == null) return null;
    const thetaN = thetaZ ? parseFloat(thetaZ) : 0;
    const betaN  = betaZ  ? parseFloat(betaZ)  : 0;
    if (rewardVal >= 75) return { icon: "✓✓", text: "Peak focus — target pattern sustained. Excellent session.", color: "#34D399", accent: "#10B981", bg: "#0F172A", border: "#1E293B" };
    if (rewardVal >= 60) return { icon: "✓",  text: "On target — reward threshold met. Maintain this state.", color: "#34D399", accent: "#10B981", bg: "#0F172A", border: "#1E293B" };
    if (rewardVal >= 40) {
      if (thetaN > 1.5) return { icon: "↗", text: "Building up — theta is slightly elevated. Slow, focused breathing helps calm it.", color: "#FCD34D", accent: "#F59E0B", bg: "#0F172A", border: "#1E293B" };
      if (betaN < 0)    return { icon: "↗", text: "Building up — beta focus band is below average. Try a light mental task to activate it.", color: "#FCD34D", accent: "#F59E0B", bg: "#0F172A", border: "#1E293B" };
      return { icon: "↗", text: "Building up — patterns are forming. Stay relaxed but alert.", color: "#FCD34D", accent: "#F59E0B", bg: "#0F172A", border: "#1E293B" };
    }
    return { icon: "◌", text: "Starting up — takes a moment for brainwave patterns to stabilize. Breathe naturally.", color: "#CBD5E1", accent: "#64748B", bg: "#0F172A", border: "#1E293B" };
  })();

  const TABS: { id: MainTab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; groupStart?: string; badge?: string }[] = [
    { id: "session",   label: "Live Session",       icon: Activity,       groupStart: "During a Session", badge: "FOR MENDI" },
    { id: "game",      label: "Game Mode",          icon: Gamepad2 },
    { id: "brain",     label: "Brain Map",          icon: Brain },
    { id: "hrv",       label: "Heart & Breathing",  icon: HeartPulse },
    { id: "outcomes",  label: "Questionnaires",     icon: ClipboardList,  groupStart: "Client Records" },
    { id: "progress",  label: "Progress",           icon: TrendingUp },
    { id: "ai",        label: "AI Insights",        icon: Sparkles,       badge: "FOR MENDI" },
    { id: "protocols", label: "Protocols",          icon: Target,         groupStart: "Practice Tools" },
    { id: "schedule",  label: "Schedule",           icon: Calendar },
    { id: "reports",   label: "Reports",            icon: FileText,       badge: "FOR MENDI" },
    { id: "compare",   label: "Compare",            icon: BarChart3 },
    { id: "billing",   label: "Billing & Claims",   icon: CreditCard,     groupStart: "Practice Operations" },
    { id: "team",      label: "Team & Roles",       icon: Users },
    { id: "compliance",label: "Compliance",         icon: ShieldCheck },
    { id: "marketing", label: "Marketing",          icon: Megaphone,      badge: "FOR MENDI" },
    { id: "devices",   label: "Devices & API",      icon: Plug,           groupStart: "Integrations", badge: "FOR MENDI" },
  ];

  const DEMO_CLIENTS = [
    { name: "Sarah Mitchell · ADHD adolescent",    protocol: "SMR · Cz (12–15 Hz)",         session: 8,  archetype: "ADHD" },
    { name: "James Okafor · PTSD veteran",          protocol: "Alpha-Theta · Pz/Oz",         session: 4,  archetype: "PTSD" },
    { name: "Priya Sharma · burnout exec",          protocol: "ILF · Fp1/Fp2",                session: 12, archetype: "Burnout" },
    { name: "Daniel Cruz · sleep onset",            protocol: "Sleep Spindle · Cz/Pz",       session: 3,  archetype: "Sleep" },
    { name: "Emily Tanaka · performance",            protocol: "Neuromuscular · C3/C4",        session: 6,  archetype: "Performance" },
  ];

  const PROTOCOL_GOALS: Record<string, string> = {
    "SMR · Cz (12–15 Hz)":    "Increase SMR (12–15 Hz) · Reduce Theta (4–8 Hz) · Score rises when sensorimotor rhythm is sustained",
    "Alpha-Theta · Pz/Oz":    "Reward Alpha (8–12 Hz) · Reward Theta (4–8 Hz) · Score rises during deep relaxation states",
    "ILF · Fp1/Fp2":          "Train infra-low frequencies (<0.1 Hz) · Improve autonomic regulation · Score rises with sustained ILF coherence",
    "Sleep Spindle · Cz/Pz":  "Increase Sigma (12–16 Hz) sleep spindles · Reduce hyperarousal · Score rises when spindle activity is detected",
    "Neuromuscular · C3/C4":  "Increase SMR at motor cortex · Reduce excess Theta · Score rises with sustained sensorimotor balance",
  };
  const [demoClientIdx, setDemoClientIdx] = useState(0);
  const demoClient = DEMO_CLIENTS[demoClientIdx];

  // ── Clinician interactive controls ────────────────────────────────────────
  const [chartWindow, setChartWindow] = useState<30 | 60 | 120>(60);
  const [rewardThreshold, setRewardThreshold] = useState(60);
  const [sensitivity, setSensitivity] = useState(5);
  const [enabledBands, setEnabledBands] = useState<{ theta: boolean; alpha: boolean; beta: boolean }>({ theta: true, alpha: true, beta: true });
  const [markers, setMarkers] = useState<Array<{ time: number; label: string }>>([]);
  const [quickNote, setQuickNote] = useState("");
  const [noteSavedFlash, setNoteSavedFlash] = useState(false);
  const [audioReward, setAudioReward] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClinicianOverlay, setShowClinicianOverlay] = useState(true);
  const [gameDifficulty, setGameDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  // Advanced clinician controls — open by default to show full functionality
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [rewardPct, setRewardPct] = useState(70);
  const [holdTime, setHoldTime] = useState(0.5);
  const [smoothing, setSmoothing] = useState(2.0);
  const [autoThreshold, setAutoThreshold] = useState(false);
  const [masterVolume, setMasterVolume] = useState(75);
  const [rewardSoundVolume, setRewardSoundVolume] = useState(60);
  const [emgThreshold, setEmgThreshold] = useState(50);
  const [eyeBlinkRejection, setEyeBlinkRejection] = useState(true);
  const [emgRejection, setEmgRejection] = useState(true);
  const [thetaRange, setThetaRange] = useState<[number, number]>([4, 8]);
  const [alphaRange, setAlphaRange] = useState<[number, number]>([8, 12]);
  const [betaRange, setBetaRange] = useState<[number, number]>([15, 20]);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [yAxisAutoscale, setYAxisAutoscale] = useState(true);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2000);
  }, []);

  const togglePauseResume = useCallback(() => {
    if (running) {
      stop();
      showToast("Session paused");
    } else {
      start();
      showToast("Session resumed");
    }
  }, [running, start, stop, showToast]);

  const addMarker = useCallback(() => {
    const m = { time: elapsed, label: "Marker" };
    setMarkers((prev) => [...prev, m]);
    showToast(`Marker added at ${fmt(elapsed)}`);
  }, [elapsed, showToast]);

  const resetSession = useCallback(() => {
    setElapsed(0);
    setMarkers([]);
    showToast("Session reset");
    setShowResetConfirm(false);
  }, [showToast]);

  const clinicianBtn: React.CSSProperties = {
    background: "#1E293B",
    border: "1px solid #334155",
    color: "#F1F5F9",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  const clinicianBtnPrimary: React.CSSProperties = {
    ...clinicianBtn,
    background: "#2563EB",
    color: "white",
    border: "1px solid #2563EB",
  };

  const switchTab = (id: MainTab) => {
    setTab(id);
    setVisitedTabs((prev) => new Set([...prev, id]));
    // Sync URL for deep-linking — bare-bones replaceState keeps history clean
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.replaceState({}, "", url.toString());
    }
  };
  const shareCurrentView = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.origin + "/demo");
    url.searchParams.set("tab", tab);
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
      showToast(`Link copied · opens this exact view (${tab})`);
    } catch {
      showToast("Couldn't copy — link is " + url.toString());
    }
  };

  const navBtn: (active: boolean) => React.CSSProperties = (active) => ({
    padding: "10px 16px", fontSize: 13, fontWeight: 600, background: "none", border: "none",
    cursor: "pointer", whiteSpace: "nowrap",
    color: active ? "#2563EB" : "#64748B",
    borderBottom: active ? "2px solid #2563EB" : "2px solid transparent",
  });

  const card: React.CSSProperties = { background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 18, padding: 24, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 1px 2px rgba(0,0,0,0.6), 0 8px 32px -16px rgba(0,0,0,0.7), 0 24px 48px -24px rgba(0,0,0,0.5)" };

  const categories = [...new Set(FEATURES.map((f) => f.category))];
  const filteredFeatures = featureCategory ? FEATURES.filter((f) => f.category === featureCategory) : FEATURES;

  return (
    <div className="demo-grain" style={{ fontFamily: "Inter, system-ui, sans-serif", background: "linear-gradient(180deg, #EEF2F8 0%, #F0F4F8 100%)", minHeight: "100vh" }}>
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
        @keyframes modalIn { 0% { opacity: 0; transform: translateY(12px) scale(0.97); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes overlayIn { 0% { opacity: 0; backdrop-filter: blur(0px); } 100% { opacity: 1; backdrop-filter: blur(12px); } }
        @keyframes orbDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -20px); } }
        @keyframes premiumGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }

        /* Staggered card entrance — micro-delight on tab switch */
        @keyframes cardSlideIn { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        [role="tabpanel"] > div > * { animation: cardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
        [role="tabpanel"] > div > *:nth-child(1) { animation-delay: 0ms; }
        [role="tabpanel"] > div > *:nth-child(2) { animation-delay: 50ms; }
        [role="tabpanel"] > div > *:nth-child(3) { animation-delay: 100ms; }
        [role="tabpanel"] > div > *:nth-child(4) { animation-delay: 150ms; }
        [role="tabpanel"] > div > *:nth-child(5) { animation-delay: 200ms; }
        [role="tabpanel"] > div > *:nth-child(6) { animation-delay: 250ms; }
        @media (prefers-reduced-motion: reduce) {
          [role="tabpanel"] > div > * { animation: none; }
        }

        /* Visible focus rings — WCAG 2.4.7 compliance */
        button:focus-visible, a:focus-visible, [role="button"]:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid #60A5FA;
          outline-offset: 2px;
          border-radius: 4px;
        }

        .skeleton { background: linear-gradient(90deg, #1E293B 25%, #334155 50%, #1E293B 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        .demo-section-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; padding-bottom: 10px; margin-bottom: 14px; border-bottom: 1px solid #1E293B; }
        select option { background: #1E293B; color: white; }
        /* Premium button hover system — refined cubic-bezier */
        button { transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, opacity 0.18s ease; }
        button:not(:disabled):hover { transform: translateY(-1px); }
        button:not(:disabled):active { transform: translateY(0) scale(0.98); }
        /* Premium focus rings */
        button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid #60A5FA; outline-offset: 2px; box-shadow: 0 0 0 4px rgba(96,165,250,0.15); }
        /* Heading typography refinement — Linear/Vercel feel */
        h1, h2, h3 { letter-spacing: -0.025em; font-feature-settings: "ss01", "cv11"; }
        /* Backdrop blur for modals */
        .demo-modal-backdrop { backdrop-filter: blur(12px) saturate(140%); -webkit-backdrop-filter: blur(12px) saturate(140%); }
        /* Premium card hover — subtle lift + glow */
        .demo-premium-card { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease; }
        .demo-premium-card:hover { transform: translateY(-2px); border-color: #334155; box-shadow: 0 1px 0 0 rgba(255,255,255,0.06) inset, 0 12px 32px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(96,165,250,0.1); }
        /* Subtle SVG noise/grain texture overlay (premium paper-like quality) */
        .demo-grain { position: relative; }
        .demo-grain::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.025; mix-blend-mode: overlay; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.4'/></svg>"); }
        /* Number reveal animation */
        @keyframes numberCountUp { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .demo-stat-reveal { animation: numberCountUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        /* ─────────────────────────────────────────────────────────────────
           PREMIUM COLOR PALETTE (researched from Linear / Vercel / Stripe)
           ───────────────────────────────────────────────────────────────── */
        :root {
          /* Surfaces (deep dark, layered) */
          --eb-bg-deepest: #050609;
          --eb-bg-base: #0A0E1A;
          --eb-bg-elevated: #11151F;
          --eb-bg-overlay: #1A1F2E;
          --eb-surface-glass: rgba(255,255,255,0.04);
          --eb-surface-glass-hover: rgba(255,255,255,0.07);
          /* Borders (additive, never solid black) */
          --eb-border-subtle: rgba(255,255,255,0.06);
          --eb-border-default: rgba(255,255,255,0.10);
          --eb-border-strong: rgba(255,255,255,0.16);
          --eb-border-brand: rgba(99,102,241,0.32);
          /* Text scale */
          --eb-text-primary: #F8FAFC;
          --eb-text-secondary: #CBD5E1;
          --eb-text-tertiary: #94A3B8;
          --eb-text-quaternary: #64748B;
          --eb-text-disabled: #475569;
          /* Brand (cool indigo — premium tech feel) */
          --eb-brand: #6366F1;
          --eb-brand-hover: #4F46E5;
          --eb-brand-tint: rgba(99,102,241,0.12);
          --eb-brand-glow: rgba(99,102,241,0.4);
          /* Semantic */
          --eb-success: #10B981;
          --eb-success-tint: rgba(16,185,129,0.12);
          --eb-warning: #F59E0B;
          --eb-warning-tint: rgba(245,158,11,0.12);
          --eb-danger: #F43F5E;
          --eb-danger-tint: rgba(244,63,94,0.12);
          --eb-info: #06B6D4;
          --eb-info-tint: rgba(6,182,212,0.12);
          /* Premium accents */
          --eb-accent-violet: #A855F7;
          --eb-accent-pink: #EC4899;
          --eb-accent-emerald: #10B981;
          --eb-accent-amber: #F59E0B;
          --eb-accent-cyan: #06B6D4;
          /* Shadows */
          --eb-shadow-sm: 0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4);
          --eb-shadow-md: 0 1px 0 0 rgba(255,255,255,0.05) inset, 0 4px 16px -8px rgba(0,0,0,0.5), 0 8px 24px -12px rgba(0,0,0,0.4);
          --eb-shadow-lg: 0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 32px -16px rgba(0,0,0,0.7), 0 24px 48px -24px rgba(0,0,0,0.5);
          --eb-shadow-glow: 0 0 32px -8px var(--eb-brand-glow);
          /* Gradients */
          --eb-gradient-brand: linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #06B6D4 100%);
          --eb-gradient-success: linear-gradient(135deg, #10B981, #06B6D4);
          --eb-gradient-warm: linear-gradient(135deg, #F59E0B, #EC4899);
          /* Radii */
          --eb-radius-sm: 6px;
          --eb-radius-md: 10px;
          --eb-radius-lg: 14px;
          --eb-radius-xl: 18px;
          /* Premium motion easing */
          --eb-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
          --eb-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Premium glow on flagship cards — outer ring + soft drop */
        .demo-flagship { position: relative; box-shadow: 0 1px 0 0 rgba(255,255,255,0.06) inset, 0 0 0 1px var(--eb-border-brand), 0 0 32px -8px var(--eb-brand-glow), 0 16px 40px -16px rgba(0,0,0,0.7) !important; transition: box-shadow 0.3s var(--eb-ease-out); }
        .demo-flagship:hover { box-shadow: 0 1px 0 0 rgba(255,255,255,0.08) inset, 0 0 0 1px rgba(168,85,247,0.6), 0 0 48px -8px rgba(124,58,237,0.5), 0 20px 48px -16px rgba(0,0,0,0.75) !important; }

        /* ─────────────────────────────────────────────────────────────────
           STATUS PILL SYSTEM — unified across all 16 tabs
           ───────────────────────────────────────────────────────────────── */
        .eb-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px;
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-radius: 99px;
          border: 1px solid;
          font-feature-settings: "tnum" 1, "ss01" 1;
        }
        .eb-pill-success { background: var(--eb-success-tint); color: var(--eb-success); border-color: rgba(16,185,129,0.25); }
        .eb-pill-warning { background: var(--eb-warning-tint); color: var(--eb-warning); border-color: rgba(245,158,11,0.25); }
        .eb-pill-danger  { background: var(--eb-danger-tint); color: var(--eb-danger); border-color: rgba(244,63,94,0.25); }
        .eb-pill-info    { background: var(--eb-info-tint); color: var(--eb-info); border-color: rgba(6,182,212,0.25); }
        .eb-pill-brand   { background: var(--eb-brand-tint); color: #A5B4FC; border-color: var(--eb-border-brand); }
        .eb-pill-neutral { background: rgba(148,163,184,0.10); color: var(--eb-text-tertiary); border-color: var(--eb-border-default); }
        /* Pill with leading dot */
        .eb-pill-dot::before {
          content: ""; width: 6px; height: 6px; border-radius: 50%;
          background: currentColor; box-shadow: 0 0 6px currentColor;
        }

        /* ─────────────────────────────────────────────────────────────────
           PREMIUM TABLE SYSTEM — auto-zebra, hover, sticky header
           ───────────────────────────────────────────────────────────────── */
        .demo-content table { border-collapse: collapse; }
        .demo-content table thead tr { background: linear-gradient(180deg, #0F172A 0%, #0A1320 100%); }
        .demo-content table thead th {
          position: sticky; top: 0;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          background: rgba(15,23,42,0.92);
          border-bottom: 1px solid var(--eb-border-default);
          font-feature-settings: "ss01" 1;
        }
        .demo-content table tbody tr {
          transition: background 0.15s var(--eb-ease-out);
        }
        .demo-content table tbody tr:nth-child(even) { background: rgba(255,255,255,0.02); }
        .demo-content table tbody tr:hover { background: rgba(99,102,241,0.06); }

        /* ─────────────────────────────────────────────────────────────────
           CUSTOM FORM CONTROLS — replace native chrome
           ───────────────────────────────────────────────────────────────── */
        .demo-content input[type="range"] {
          -webkit-appearance: none; appearance: none;
          height: 4px;
          background: linear-gradient(90deg, var(--eb-brand) 0%, var(--eb-brand) var(--eb-fill, 50%), rgba(255,255,255,0.08) var(--eb-fill, 50%), rgba(255,255,255,0.08) 100%);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          transition: filter 0.15s ease;
        }
        .demo-content input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--eb-brand);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4), 0 0 0 4px transparent;
          transition: box-shadow 0.18s var(--eb-ease-out), transform 0.15s var(--eb-ease-out);
          cursor: grab;
        }
        .demo-content input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--eb-brand);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          cursor: grab;
        }
        .demo-content input[type="range"]:hover::-webkit-slider-thumb { box-shadow: 0 1px 4px rgba(0,0,0,0.4), 0 0 0 6px var(--eb-brand-tint); transform: scale(1.05); }
        .demo-content input[type="range"]:active::-webkit-slider-thumb { cursor: grabbing; }
        .demo-content input[type="range"]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px var(--eb-brand-tint), 0 0 0 6px var(--eb-brand-glow); }

        /* Custom checkbox */
        .demo-content input[type="checkbox"] {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px;
          border: 1.5px solid var(--eb-border-strong);
          border-radius: 5px;
          background: rgba(255,255,255,0.02);
          cursor: pointer; flex-shrink: 0;
          transition: all 0.15s var(--eb-ease-out);
          display: inline-flex; align-items: center; justify-content: center;
          position: relative;
        }
        .demo-content input[type="checkbox"]:hover { border-color: var(--eb-text-quaternary); background: rgba(255,255,255,0.05); }
        .demo-content input[type="checkbox"]:checked { background: var(--eb-brand); border-color: var(--eb-brand); }
        .demo-content input[type="checkbox"]:checked::after {
          content: ""; width: 5px; height: 9px;
          border: solid white; border-width: 0 2px 2px 0;
          transform: rotate(45deg) translateY(-1px);
          margin-top: -2px;
        }
        .demo-content input[type="checkbox"]:focus-visible { box-shadow: 0 0 0 3px var(--eb-brand-tint); }

        /* Custom number input */
        .demo-content input[type="number"] {
          font-feature-settings: "tnum" 1, "ss01" 1;
        }

        /* Refined select chevron */
        .demo-content select {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4l4 4 4-4' stroke='%23CBD5E1' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 8px center;
          padding-right: 28px !important;
        }

        /* Premium tabular numerics globally for stat values */
        .demo-content [data-stat],
        .demo-content [class*="stat-"] [class*="value"],
        .demo-content table td,
        .demo-content kbd,
        .demo-content code,
        .demo-content pre {
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum" 1, "ss01" 1, "cv11" 1;
        }
        /* Sidebar inherits Geist (no Inter override) — refined scrollbar */
        .demo-sidebar { font-family: inherit; }
        .demo-sidebar::-webkit-scrollbar { width: 6px; }
        .demo-sidebar::-webkit-scrollbar-track { background: transparent; }
        .demo-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .demo-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
        /* Refined kbd globally */
        kbd { font-family: ui-monospace, monospace; }

        /* Premium scrollbars across all scrollable areas in demo */
        .demo-content ::-webkit-scrollbar { width: 8px; height: 8px; }
        .demo-content ::-webkit-scrollbar-track { background: transparent; }
        .demo-content ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .demo-content ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }

        /* Selection color */
        .demo-content ::selection { background: var(--eb-brand-tint); color: var(--eb-text-primary); }

        /* ─────────────────────────────────────────────────────────────────
           iOS-INSPIRED PATTERNS — Apple Health / Settings / Mail HIG
           ───────────────────────────────────────────────────────────────── */

        /* iOS pill-style toggle switch */
        .ios-toggle {
          appearance: none; -webkit-appearance: none;
          width: 42px; height: 26px;
          border-radius: 99px;
          background: rgba(120,120,128,0.32);
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.25s var(--eb-ease-out);
          flex-shrink: 0;
        }
        .ios-toggle::after {
          content: ""; position: absolute;
          top: 2px; left: 2px;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25), 0 1px 1px rgba(0,0,0,0.15);
          transition: transform 0.28s var(--eb-ease-out);
        }
        .ios-toggle:checked { background: #34C759; }
        .ios-toggle:checked::after { transform: translateX(16px); }
        .ios-toggle:focus-visible { box-shadow: 0 0 0 3px rgba(52,199,89,0.3); outline: none; }
        .ios-toggle:not(:disabled):active::after { transform: scaleX(1.18); }
        .ios-toggle:checked:not(:disabled):active::after { transform: translateX(13px) scaleX(1.18); }

        /* iOS grouped-list container — Settings app style */
        .ios-list {
          background: linear-gradient(180deg, #11151F 0%, #0E1119 100%);
          border: 1px solid var(--eb-border-default);
          border-radius: var(--eb-radius-lg);
          overflow: hidden;
          box-shadow: var(--eb-shadow-md);
        }
        .ios-list-row {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
          min-height: 52px;
          border-bottom: 1px solid var(--eb-border-subtle);
          transition: background 0.15s var(--eb-ease-out);
        }
        .ios-list-row:last-child { border-bottom: none; }
        .ios-list-row:hover { background: rgba(255,255,255,0.025); }
        .ios-list-row-tap { cursor: pointer; }
        .ios-list-row-tap:active { background: rgba(255,255,255,0.04); }
        .ios-list-row-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ios-list-row-content { flex: 1; min-width: 0; }
        .ios-list-row-title { font-size: 14px; font-weight: 500; color: var(--eb-text-primary); line-height: 1.3; }
        .ios-list-row-subtitle { font-size: 12px; color: var(--eb-text-tertiary); margin-top: 2px; line-height: 1.4; }
        .ios-list-row-trailing { color: var(--eb-text-quaternary); font-size: 13px; flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
        .ios-list-row-chevron { color: var(--eb-text-quaternary); font-size: 14px; flex-shrink: 0; }

        /* iOS section header (caps tracked, system gray) */
        .ios-section-header {
          font-size: 11px; font-weight: 600;
          color: rgba(235,235,245,0.6);
          text-transform: uppercase; letter-spacing: 0.05em;
          padding: 0 18px 8px;
        }
        .ios-section-footer {
          font-size: 12px; color: var(--eb-text-quaternary);
          padding: 8px 18px 0;
          line-height: 1.45;
        }

        /* Apple Health-style large stat numerals */
        .ios-stat { display: flex; align-items: baseline; gap: 4px; }
        .ios-stat-value {
          font-size: clamp(2rem, 3.4vw, 2.75rem);
          font-weight: 700;
          letter-spacing: -0.035em;
          color: var(--eb-text-primary);
          line-height: 1;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum" 1, "ss01" 1, "cv11" 1;
        }
        .ios-stat-unit { font-size: 0.95rem; font-weight: 500; color: var(--eb-text-tertiary); letter-spacing: -0.02em; }
        .ios-stat-label { font-size: 11px; font-weight: 600; color: var(--eb-text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }

        /* iOS-style press feedback — spring physics, more pronounced */
        .demo-content button:not(:disabled):active,
        .demo-content [role="button"]:not(:disabled):active {
          transform: scale(0.96);
          transition-duration: 0.06s;
        }

        /* Refined disclosure chevron */
        .ios-chevron::after {
          content: "›";
          color: var(--eb-text-quaternary);
          font-size: 18px;
          font-weight: 300;
          line-height: 1;
          margin-left: 4px;
        }

        /* ─────────────────────────────────────────────────────────────────
           GLOSSARY TOOLTIP — dotted underline + hover plain-English
           ───────────────────────────────────────────────────────────────── */
        .gloss {
          position: relative;
          border-bottom: 1px dotted var(--eb-text-quaternary);
          cursor: help;
        }
        .gloss::before, .gloss::after {
          opacity: 0; pointer-events: none;
          transition: opacity 0.15s var(--eb-ease-out), transform 0.15s var(--eb-ease-out);
          position: absolute; z-index: 100;
        }
        .gloss::before {
          content: attr(data-gloss);
          bottom: calc(100% + 8px); left: 50%;
          transform: translate(-50%, 4px);
          background: linear-gradient(180deg, #1A1F2E 0%, #11151F 100%);
          color: var(--eb-text-primary);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--eb-border-default);
          font-size: 12px;
          font-weight: 500;
          line-height: 1.5;
          letter-spacing: 0;
          text-transform: none;
          white-space: normal;
          width: max-content; max-width: 240px;
          box-shadow: var(--eb-shadow-lg);
        }
        .gloss::after {
          content: ""; bottom: calc(100% + 2px); left: 50%;
          width: 0; height: 0; transform: translate(-50%, 4px);
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #1A1F2E;
        }
        .gloss:hover::before, .gloss:focus-visible::before { opacity: 1; transform: translate(-50%, 0); }
        .gloss:hover::after, .gloss:focus-visible::after { opacity: 1; transform: translate(-50%, 0); }

        /* "What this tells you" caption helper */
        .what-it-tells {
          display: flex; gap: 8px; align-items: flex-start;
          padding: 10px 12px;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 8px;
          font-size: 12px;
          color: var(--eb-text-secondary);
          line-height: 1.5;
        }
        .what-it-tells::before {
          content: "💡";
          flex-shrink: 0;
          font-size: 13px;
          opacity: 0.85;
        }

        /* Three-state legend dots */
        .legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; vertical-align: middle; margin-right: 4px; }

        /* Premium tabular numerics globally for stat values */
        .demo-content [data-stat],
        .demo-content [class*="stat-"] [class*="value"],
        .demo-content table td,
        .demo-content kbd,
        .demo-content code,
        .demo-content pre {
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum" 1, "ss01" 1, "cv11" 1;
        }
        /* Sidebar inherits Geist (no Inter override) — refined scrollbar */
        .demo-sidebar { font-family: inherit; }
        .demo-sidebar::-webkit-scrollbar { width: 6px; }
        .demo-sidebar::-webkit-scrollbar-track { background: transparent; }
        .demo-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .demo-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
        /* Refined kbd globally */
        kbd { font-family: ui-monospace, monospace; }
        .demo-mobile-nav { display: none; }
        @media (max-width: 900px) {
          .demo-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .demo-schedule-grid { grid-template-columns: 1fr !important; }
          .demo-compare-summary { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .demo-grid-2 { grid-template-columns: 1fr !important; }
          .demo-grid-3 { grid-template-columns: 1fr !important; }
          .demo-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .demo-sidebar { display: none !important; }
          .demo-content { padding: 16px !important; }
          .demo-mobile-nav { display: block !important; }
          .demo-topbar-hide-mobile { display: none !important; }
          .demo-topbar { padding: 0 12px !important; gap: 8px !important; }
          .demo-paper-preview { padding: 16px !important; }
        }
        @media (max-width: 480px) {
          .demo-topbar-logo-text { display: none !important; }
          .demo-topbar-client-label { display: none !important; }
        }
        /* Hide Next.js dev-mode error/issue badge overlay */
        [data-nextjs-toast], nextjs-portal, #__next-build-watcher, .__next-error-overlay-wrapper { display: none !important; }
      `}</style>

      {/* Top bar */}
      <div className="demo-topbar" style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" className="demo-topbar-logo-text" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", textDecoration: "none" }}>
            EEG<span style={{ color: "#60A5FA" }}>Base</span>
          </a>
          <span className="demo-topbar-hide-mobile" style={{ background: "rgba(96,165,250,0.12)", color: "#93C5FD", fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Demo
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Client switcher */}
          <button
            onClick={() => setShowCmdK(true)}
            aria-label="Search (Cmd+K)"
            className="demo-topbar-hide-mobile"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 8px 6px 12px", display: "flex", alignItems: "center", gap: 8, color: "#94A3B8", fontSize: 12, cursor: "pointer", fontWeight: 500 }}
          >
            <Search size={13} strokeWidth={2} />
            <span>Search...</span>
            <kbd style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "1px 6px", color: "#CBD5E1", fontWeight: 600 }}>⌘K</kbd>
          </button>
          <button
            onClick={() => setTourStep(0)}
            aria-label="Start 60-second tour"
            className="demo-topbar-hide-mobile"
            title="60-second highlight reel — auto-walks through the 6 most important tabs for a Mendi pitch"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.18))", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: "#C4B5FD", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
          >
            <span aria-hidden="true">▶</span>
            <span>60-sec tour</span>
          </button>
          <button
            onClick={shareCurrentView}
            aria-label="Share this view"
            className="demo-topbar-hide-mobile"
            title="Copy a deep link that opens this exact tab"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: shareCopied ? "#34D399" : "#CBD5E1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            <span aria-hidden="true">{shareCopied ? "✓" : "🔗"}</span>
            <span>{shareCopied ? "Copied" : "Share view"}</span>
          </button>
          <button
            onClick={() => showToast("3 new alerts: Sarah's PHQ-9 down 3 pts · James co-sign needed · Aetna ERA posted")}
            aria-label="Notifications"
            className="demo-topbar-hide-mobile"
            style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#CBD5E1" }}
          >
            <Bell size={14} strokeWidth={1.75} />
            <span style={{ position: "absolute", top: -3, right: -3, background: "#EF4444", color: "white", fontSize: 9, fontWeight: 700, borderRadius: 99, padding: "1px 5px", border: "1.5px solid #0F172A" }}>3</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="demo-topbar-client-label" style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 600 }}>Client:</span>
            <select
              aria-label="Select demo client"
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
            <span className="demo-topbar-hide-mobile" style={{ fontSize: "0.78rem", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.04em" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block", animation: "pulse 1.5s infinite", boxShadow: "0 0 8px #34D39988" }} />
              LIVE · {fmt(elapsed)}
            </span>
          )}
          {/* Compliance strip — persistent trust signal */}
          <span className="demo-topbar-hide-mobile" title="HIPAA · Schrems II · AES-256 · SOC 2 · WCAG 2.2 AA" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.66rem", color: "#94A3B8", fontWeight: 700, padding: "3px 8px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            <span aria-hidden="true">🛡</span>
            <span>HIPAA</span>
            <span style={{ color: "#475569" }}>·</span>
            <span>Schrems II</span>
            <span style={{ color: "#475569" }}>·</span>
            <span>SOC 2</span>
          </span>
          <a href="/login" style={{ fontSize: "0.82rem", fontWeight: 700, padding: "7px 16px", background: "#2563EB", color: "white", borderRadius: 8, textDecoration: "none", letterSpacing: "0.01em" }}>
            Get Access →
          </a>
        </div>
      </div>

      {/* Progress bar */}
      <div role="progressbar" aria-label={`Session time: ${Math.floor(elapsed / 60)} of 30 minutes`} aria-valuenow={Math.min(100, Math.round((elapsed / 1800) * 100))} aria-valuemin={0} aria-valuemax={100} title={`Session progress · ${Math.floor(elapsed / 60)} of 30 min`} style={{ height: 4, background: "#1E293B" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, #2563EB, #8B5CF6, #EC4899)", width: `${Math.min(100, (elapsed / 1800) * 100)}%`, transition: "width 1s linear" }} />
      </div>

      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="demo-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "overlayIn 0.2s ease-out" }}>
          <div style={{ background: "white", borderRadius: 20, maxWidth: 520, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", animation: "fadeIn 0.25s ease", overflow: "hidden" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg, #2563EB, #7C3AED, #EC4899)" }} />
            <div style={{ padding: "28px 32px 32px" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>The clinical layer for any neurofeedback hardware</div>
              <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24, lineHeight: 1.7 }}>
                Mendi · Muse · Polar HRV · Apple Health → one client record, one SOAP note, one billable session. This demo runs synthetic data — no hardware needed.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[
                  { icon: "🧠", title: "Live Session + co-feedback video", desc: "Mendi fNIRS streaming with HIPAA video — clinician sees client&apos;s live signals during the call. Rare among neurofeedback platforms." },
                  { icon: "🤖", title: "AI cross-session pattern detector", desc: "Correlates Mendi data with Apple Health · Oura · mood · HRV · adherence. Surfaces drivers most platforms can&apos;t see in one place." },
                  { icon: "📋", title: "Ambient SOAP scribe (6 formats)", desc: "Records audio with consent → drafts SOAP / DAP / BIRP / GIRP / PIE / SIRP notes tied to the live signal data." },
                  { icon: "🏥", title: "EHR + claims + research registry", desc: "CMS-1500 + ERA + BIDS-fNIRS export + IRB packet auto-gen — bundled, not bolted on. Open-source · self-hostable." },
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  aria-label="Start the 60-second guided tour"
                  onClick={() => { sessionStorage.setItem("demo-onboarding-dismissed", "1"); setShowOnboarding(false); setTourStep(0); }}
                  style={{ padding: "13px 16px", background: "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.01em" }}
                >
                  ▶ 60-sec tour
                </button>
                <button
                  aria-label="Close welcome modal and explore freely"
                  onClick={() => { sessionStorage.setItem("demo-onboarding-dismissed", "1"); setShowOnboarding(false); }}
                  style={{ padding: "13px 16px", background: "#2563EB", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.01em" }}
                >
                  Explore freely →
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 12 }}>
                Press <kbd style={{ fontFamily: "ui-monospace, monospace", padding: "1px 5px", background: "#F1F5F9", borderRadius: 3, color: "#475569" }}>⌘K</kbd> anywhere · No sign-up required · Synthetic data only
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Universal Detail Modal */}
      {detailModal && (
        <div onClick={() => setDetailModal(null)} className="demo-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "overlayIn 0.2s ease-out" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 28, maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
              <h2 style={{ color: "#F1F5F9", fontSize: 18, fontWeight: 700 }}>
                {detailModal.type === "session" && `Session ${(detailModal.data as { session: number }).session} · ${(detailModal.data as { date: string }).date}`}
                {detailModal.type === "competitor" && `${(detailModal.data as { label: string }).label} · ${(detailModal.data as { sub: string }).sub}`}
                {detailModal.type === "scoreBreakdown" && "Reward score breakdown"}
                {detailModal.type === "zscore" && `${(detailModal.data as { band: string }).band} Z-score: ${(detailModal.data as { value: number }).value.toFixed(2)} SD`}
                {detailModal.type === "phq9hist" && "PHQ-9 score distribution"}
              </h2>
              <button onClick={() => setDetailModal(null)} aria-label="Close" style={{ background: "none", border: "1px solid #334155", borderRadius: 22, color: "#94A3B8", fontSize: 18, cursor: "pointer", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>

            {detailModal.type === "session" && (() => {
              const s = detailModal.data as { session: number; date: string; duration: number; reward: number; thetaBeta: number; phq9: number; gad7: number };
              return (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                    {[
                      { l: "Reward score", v: s.reward.toFixed(1), c: s.reward >= 70 ? "#10B981" : "#F59E0B" },
                      { l: "Duration", v: `${s.duration} min`, c: "#F1F5F9" },
                      { l: "θ/β Z-score", v: `+${s.thetaBeta.toFixed(2)} SD`, c: s.thetaBeta > 2 ? "#EF4444" : "#F59E0B" },
                      { l: "PHQ-9", v: String(s.phq9), c: s.phq9 < 10 ? "#10B981" : "#F59E0B" },
                      { l: "GAD-7", v: String(s.gad7), c: s.gad7 < 10 ? "#10B981" : "#F59E0B" },
                      { l: "Protocol", v: "SMR · Cz", c: "#60A5FA" },
                    ].map((m) => (
                      <div key={m.l} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.l}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: m.c }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Session reward curve</div>
                    <svg viewBox="0 0 200 50" style={{ width: "100%", height: 60 }}>
                      <polyline
                        points={Array.from({ length: 30 }, (_, i) => `${(i / 29) * 200},${48 - (s.reward / 100) * 36 + Math.sin(i * 0.4 + s.session) * 6}`).join(" ")}
                        fill="none"
                        stroke={s.reward >= 70 ? "#10B981" : "#F59E0B"}
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setDetailModal(null); switchTab("ai"); }} style={{ ...clinicianBtnPrimary, flex: 1 }}>Open SOAP note →</button>
                    <button onClick={() => setDetailModal(null)} style={{ ...clinicianBtn, flex: 1 }}>Close</button>
                  </div>
                </div>
              );
            })()}

            {detailModal.type === "competitor" && (() => {
              const c = detailModal.data as { key: string; label: string; sub: string };
              const profiles: Record<string, { strengths: string[]; weaknesses: string[]; verdict: string }> = {
                myndlift:    { strengths: ["Polished consumer app", "Active community", "700+ studies cited"], weaknesses: ["Locked to Muse hardware", "$1,990 onboarding fee", "Reviews say 'not real neurofeedback'"], verdict: "Best for cash-pay coaching practices, weak on clinical EEG" },
                divergence:  { strengths: ["AI brain assessments", "Multivariate coherence", "HIPAA + GDPR"], weaknesses: ["No native mobile app", "$255–490/mo subscription", "Web-only desktop"], verdict: "Strongest competitor — clinical workflow, but expensive and dated UX" },
                eeger:       { strengths: ["Long clinical history", "Solid signal processing"], weaknesses: ["Windows-only desktop", "Steep learning curve", "Looks like 2003"], verdict: "Trusted by veterans but feels like time-travel software" },
                brainpaint:  { strengths: ["Per-session pricing", "Trauma/addiction focus"], weaknesses: ["Hardware lock-in", "Limited modalities", "Art-only feedback"], verdict: "Niche clinical tool, not a full practice platform" },
                neuroptimal: { strengths: ["No subscription, own outright", "Passive training model"], weaknesses: ["$7,495–10,995 upfront", "Proprietary closed system", "Limited customization"], verdict: "Pricey investment for a one-protocol approach" },
                neuroguide:  { strengths: ["Gold-standard QEEG", "Thatcher database", "Source localization"], weaknesses: ["$3,500–6,000+ price", "Requires certification", "QEEG only — no live streaming"], verdict: "Best-in-class assessment, no live training workflow" },
                brainavatar: { strengths: ["Hardware-agnostic-ish", "Brain Trainer integration"], weaknesses: ["Hardware bundle required", "Windows desktop UX", "Limited mobile/web"], verdict: "Mid-market hardware bundle, feels behind on UX" },
              };
              const p = profiles[c.key] ?? { strengths: [], weaknesses: [], verdict: "" };
              return (
                <div>
                  <div style={{ marginBottom: 16, padding: 14, background: "#1E293B", border: "1px solid #334155", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Verdict</div>
                    <div style={{ fontSize: 14, color: "#F1F5F9", lineHeight: 1.5 }}>{p.verdict}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: "rgba(6,78,59,0.35)", border: "1px solid #065F46", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Strengths</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#D1FAE5", lineHeight: 1.7 }}>{p.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
                    </div>
                    <div style={{ background: "rgba(127,29,29,0.3)", border: "1px solid #991B1B", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#FCA5A5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Weaknesses</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#FECACA", lineHeight: 1.7 }}>{p.weaknesses.map((x) => <li key={x}>{x}</li>)}</ul>
                    </div>
                  </div>
                  <button onClick={() => setDetailModal(null)} style={{ ...clinicianBtnPrimary, width: "100%" }}>Got it →</button>
                </div>
              );
            })()}

            {detailModal.type === "scoreBreakdown" && (() => {
              const score = (detailModal.data as { score: number }).score;
              return (
                <div>
                  <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Your reward score is a weighted blend of three brainwave bands. Each band&apos;s contribution depends on the protocol — for SMR, reduced theta and increased SMR/beta both raise the score.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { band: "Theta (4–8 Hz)", contribution: 35, color: "#F59E0B", note: "Lower is better — drowsiness reduces score" },
                      { band: "SMR (12–15 Hz)", contribution: 45, color: "#10B981", note: "Target band — sustained activity raises score" },
                      { band: "Beta (15–25 Hz)", contribution: 20, color: "#EC4899", note: "High beta penalized to avoid anxiety state" },
                    ].map((b) => (
                      <div key={b.band} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{b.band}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.contribution}%</span>
                        </div>
                        <div style={{ background: "#0F172A", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ background: b.color, height: "100%", width: `${b.contribution}%` }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{b.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: 12, background: "rgba(30,58,138,0.25)", border: "1px solid #1E40AF", borderRadius: 10, fontSize: 12, color: "#93C5FD" }}>
                    Current overall score: <strong style={{ color: "#F1F5F9" }}>{score.toFixed(1)} / 100</strong>
                  </div>
                </div>
              );
            })()}

            {detailModal.type === "zscore" && (() => {
              const d = detailModal.data as { band: string; value: number };
              return (
                <div>
                  <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Your client&apos;s {d.band} power compared to the EEGBase normative database (n=847 healthy adults aged 25–35).</p>
                  <svg viewBox="0 0 400 140" style={{ width: "100%", height: 160, background: "#1E293B", borderRadius: 10, padding: 8 }}>
                    {Array.from({ length: 50 }).map((_, i) => {
                      const x = (i / 49) * 380 + 10;
                      const z = (i / 49 - 0.5) * 8;
                      const height = Math.exp(-z * z / 2) * 100;
                      const isClient = Math.abs(z - d.value) < 0.16;
                      return <rect key={i} x={x - 3.5} y={130 - height} width={7} height={height} fill={isClient ? "#EF4444" : "#475569"} opacity={isClient ? 1 : 0.7} />;
                    })}
                    <line x1={10 + 380 * 0.5} y1={20} x2={10 + 380 * 0.5} y2={130} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={10 + 380 * 0.5} y={14} textAnchor="middle" fontSize="10" fill="#94A3B8">Norm (0 SD)</text>
                    <text x={10 + 380 * (0.5 + d.value / 8)} y={140} textAnchor="middle" fontSize="11" fontWeight="700" fill="#EF4444">Client: +{d.value.toFixed(2)}</text>
                  </svg>
                  <p style={{ color: "#475569", fontSize: 12, marginTop: 12 }}>The red bar shows where your client falls in the population. Values above +2 SD are clinically elevated.</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Client App Preview Modal */}
      {showClientApp && (
        <div onClick={() => setShowClientApp(false)} className="demo-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "overlayIn 0.2s ease-out" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#0F172A", borderRadius: 32, padding: 8, border: "10px solid #1E293B", width: 320, maxHeight: "92vh", overflowY: "auto", position: "relative" }}>
            <button onClick={() => setShowClientApp(false)} aria-label="Close client app preview" style={{ position: "absolute", top: -54, right: 0, width: 44, height: 44, background: "rgba(15,23,42,0.85)", border: "1px solid #334155", borderRadius: 22, color: "#F1F5F9", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ background: "#020617", borderRadius: 24, padding: "20px 16px", color: "#F1F5F9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>
                <span>9:41</span>
                <span>📶 🔋</span>
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Today&apos;s Session</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{demoClient.name.split(" ")[0]}&apos;s brain training</div>
              <div style={{ background: "linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%)", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>🧠</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#34D399" }}>{Math.round(rewardVal ?? 64)}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Score</div>
                <div style={{ marginTop: 12, fontSize: 14, color: "#34D399", fontWeight: 700 }}>● Live · {fmt(elapsed)}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[{l:"Streak", v:"8 days", icon:"🔥"}, {l:"Sessions", v:"20 / 30", icon:"📊"}, {l:"Best score", v:"94", icon:"🏆"}, {l:"Avg this week", v:"71", icon:"📈"}].map((s) => (
                  <div key={s.l} style={{ background: "#0F172A", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", background: "#2563EB", color: "white", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 700, marginBottom: 8, cursor: "pointer" }}>💬 Message Dr. Chen</button>
              <button style={{ width: "100%", background: "#1E293B", color: "#F1F5F9", border: "1px solid #334155", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📊 See your progress</button>
            </div>
          </div>
        </div>
      )}

      {/* Similar Cases Modal */}
      {showSimilarCasesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSimilarCasesModal(false)}>
          <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 32, maxWidth: 680, width: "90%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: "#F1F5F9", fontSize: 18, fontWeight: 700 }}>847 Similar Client Profiles</h2>
              <button onClick={() => setShowSimilarCasesModal(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 20 }}>Anonymized profiles from the EEGBase normative database matching Sarah Mitchell&apos;s theta elevation pattern, age range (25–35), and SMR non-response history.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  {["Age / Dx", "Protocol", "Sessions", "PHQ-9", "Reward \u2191", "Outcome"].map((h) => (
                    <th key={h} style={{ color: "#64748B", fontWeight: 600, padding: "6px 10px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["28F / ADHD-C", "SMR Cz", "18", "19 \u2192 7", "+61%", "\u2713 Remission"],
                  ["31M / Anxiety", "Alpha-Theta Pz", "24", "16 \u2192 5", "+48%", "\u2713 Remission"],
                  ["29F / ADHD-PI", "SMR Cz/Fz", "22", "21 \u2192 9", "+54%", "\u2713 Improved"],
                  ["34M / Depression", "Alpha-Theta Oz", "30", "22 \u2192 8", "+39%", "\u2713 Improved"],
                  ["27F / ADHD-C", "SMR C3/C4", "16", "18 \u2192 6", "+67%", "\u2713 Remission"],
                  ["33M / Mixed", "SMR + ILF", "28", "20 \u2192 11", "+41%", "~ Partial"],
                  ["30F / Anxiety", "Alpha-Theta Pz", "20", "15 \u2192 4", "+55%", "\u2713 Remission"],
                  ["26M / ADHD-PI", "SMR Cz", "14", "17 \u2192 8", "+44%", "\u2713 Improved"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1E293B" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: "10px", color: cell.startsWith("\u2713") ? "#34D399" : cell.startsWith("~") ? "#FCD34D" : "#CBD5E1" }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: "#475569", fontSize: 11, marginTop: 16 }}>74% of matched client profiles achieved clinically significant improvement (PHQ-9 \u22655+) within 22 sessions. Based on EEGBase internal outcomes data, n=847.</p>
          </div>
        </div>
      )}

      {/* Cmd-K command palette */}
      {showCmdK && (() => {
        const cmds = [
          ...TABS.map((t) => ({ kind: "Tab" as const, label: t.label, action: () => { setTab(t.id); setShowCmdK(false); } })),
          { kind: "Action" as const, label: "Start 60-second tour", action: () => { setTourStep(0); setShowCmdK(false); } },
          { kind: "Action" as const, label: "Pair Mendi headset",   action: () => { showToast("Mendi headset paired ✓"); setShowCmdK(false); } },
          { kind: "Action" as const, label: "Generate SOAP note",   action: () => { showToast("SOAP note generated"); setShowCmdK(false); } },
          { kind: "Action" as const, label: "Export BIDS-fNIRS",    action: () => { showToast("BIDS-fNIRS export queued"); setShowCmdK(false); } },
          { kind: "Action" as const, label: "Switch protocol",      action: () => { showToast("Protocol switcher open"); setShowCmdK(false); } },
        ];
        const filtered = cmdKQuery ? cmds.filter((c) => c.label.toLowerCase().includes(cmdKQuery.toLowerCase())) : cmds;
        return (
          <div onClick={() => setShowCmdK(false)} className="demo-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.6)", zIndex: 1100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100, animation: "overlayIn 0.15s ease-out" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12, width: "100%", maxWidth: 560, boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden", animation: "modalIn 0.2s ease" }}>
              <input
                autoFocus
                placeholder="Search tabs, clients, actions..."
                value={cmdKQuery}
                onChange={(e) => setCmdKQuery(e.target.value)}
                style={{ width: "100%", padding: "16px 20px", background: "transparent", border: "none", borderBottom: "1px solid #1E293B", color: "#F1F5F9", fontSize: 14, outline: "none" }}
              />
              <div style={{ maxHeight: 400, overflowY: "auto", padding: 8 }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#64748B", fontSize: 12 }}>No matches for &ldquo;{cmdKQuery}&rdquo;</div>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.label}
                      onClick={c.action}
                      style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", color: "#CBD5E1", fontSize: 13, cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", gap: 12 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(96,165,250,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 700, color: c.kind === "Tab" ? "#60A5FA" : "#A78BFA", padding: "2px 7px", background: c.kind === "Tab" ? "rgba(96,165,250,0.12)" : "rgba(167,139,250,0.12)", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{c.kind}</span>
                      <span>{c.label}</span>
                    </button>
                  ))
                )}
              </div>
              <div style={{ padding: "8px 16px", background: "#0A1320", borderTop: "1px solid #1E293B", fontSize: 10, color: "#64748B", display: "flex", justifyContent: "space-between" }}>
                <span><kbd style={{ fontFamily: "ui-monospace, monospace", background: "#1E293B", padding: "1px 5px", borderRadius: 3, color: "#CBD5E1" }}>↵</kbd> select · <kbd style={{ fontFamily: "ui-monospace, monospace", background: "#1E293B", padding: "1px 5px", borderRadius: 3, color: "#CBD5E1", marginLeft: 4 }}>esc</kbd> close</span>
                <span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tour HUD — shown during 60-second auto-tour */}
      {tourStep !== null && (
        <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 998, background: "linear-gradient(135deg, #1E1B4B, #0F172A)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 12, padding: "12px 16px", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", maxWidth: 320 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#A78BFA", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#C4B5FD", textTransform: "uppercase", letterSpacing: "0.08em" }}>60-second tour · step {tourStep + 1} of 6</span>
            <button onClick={() => setTourStep(null)} aria-label="Stop tour" style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#94A3B8", fontSize: 14, cursor: "pointer", padding: 0 }}>×</button>
          </div>
          <div style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.5 }}>
            Auto-advancing every 10 seconds through the 6 most important tabs for a Mendi pitch. Press <kbd style={{ fontFamily: "ui-monospace, monospace", background: "#1E293B", padding: "1px 5px", borderRadius: 3, color: "#CBD5E1", fontSize: 10 }}>esc</kbd> to stop.
          </div>
          <div style={{ marginTop: 8, height: 3, background: "#1E293B", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${((tourStep + 1) / 6) * 100}%`, height: "100%", background: "linear-gradient(90deg, #A78BFA, #60A5FA)", transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}

      {/* Clinician control toast — ARIA live region for screen readers (WCAG 4.1.3) */}
      <div role="status" aria-live="polite" aria-atomic="true" style={{ position: "fixed", bottom: 80, right: 20, zIndex: 999, pointerEvents: toast ? "auto" : "none" }}>
        {toast && (
          <div style={{ background: "#0F172A", border: "1px solid #14B8A6", color: "#F1F5F9", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "fadeIn 0.2s ease", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14B8A6" }} aria-hidden="true" />
            {toast}
          </div>
        )}
      </div>

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
        <div className="demo-topbar-hide-mobile" style={{ position: "fixed", bottom: 20, right: 20, zIndex: 90, background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 200, animation: "fadeIn 0.3s ease" }}>
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

      {/* Mobile tab nav (visible <640px only) */}
      <div className="demo-mobile-nav" style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "10px 16px", position: "sticky", top: 52, zIndex: 9 }}>
        <label htmlFor="demo-mobile-tab" style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
          Section
        </label>
        <select
          id="demo-mobile-tab"
          aria-label="Navigate demo sections"
          value={tab}
          onChange={(e) => switchTab(e.target.value as MainTab)}
          style={{ width: "100%", background: "#1E293B", color: "#F1F5F9", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 600, appearance: "none", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4l4 4 4-4' stroke='%2394A3B8' stroke-width='2' fill='none' stroke-linecap='round'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}
        >
          {(() => {
            const groups: { label: string; items: typeof TABS }[] = [];
            let current: { label: string; items: typeof TABS } | null = null;
            for (const t of TABS) {
              if (t.groupStart) {
                current = { label: t.groupStart, items: [t] };
                groups.push(current);
              } else if (current) {
                current.items.push(t);
              }
            }
            return groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </optgroup>
            ));
          })()}
        </select>
      </div>

      {/* Sidebar + Content layout */}
      <div style={{ display: "flex", alignItems: "flex-start", background: "#F0F4F8", minHeight: "calc(100vh - 60px)" }}>

        {/* Left sidebar nav */}
        <nav aria-label="Demo sections" className="demo-sidebar" style={{ width: 216, background: "#0F172A", flexShrink: 0, position: "sticky", top: 56, height: "calc(100vh - 60px)", overflowY: "auto", zIndex: 10, borderRight: "1px solid #1E293B" }}>
          <div style={{ padding: "14px 0 28px" }}>
            {TABS.map((t, i) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <div key={t.id}>
                  {t.groupStart && (
                    <div style={{ padding: i === 0 ? "6px 18px 8px" : "20px 18px 8px", fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      {t.groupStart}
                    </div>
                  )}
                  <button
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => switchTab(t.id)}
                    style={{
                      width: "100%", textAlign: "left",
                      background: isActive ? "linear-gradient(90deg, rgba(96,165,250,0.14), rgba(96,165,250,0.04))" : "transparent",
                      border: "none", borderLeft: isActive ? "2px solid #60A5FA" : "2px solid transparent",
                      padding: "8px 18px", fontSize: 13, fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#F1F5F9" : "#94A3B8", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10, lineHeight: 1.3,
                      transition: "background 0.18s ease, color 0.18s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#CBD5E1"; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    <span>{t.label}</span>
                    {t.badge && (
                      <span style={{ marginLeft: "auto", fontSize: 8, fontWeight: 800, color: "#C4B5FD", background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.04em", flexShrink: 0 }}>{t.badge}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0 }}>
        {/* Sticky "what you're seeing" caption per tab — progressive onboarding */}
        {(() => {
          const captions: Record<string, { what: string; lookFor: string }> = {
            session:    { what: "Live Session",       lookFor: "the HIPAA video co-feedback panel at the top — clinician sees the client's live signals during the call. Mode toggle above (1-on-1 / Group / Couples / Family)." },
            game:       { what: "Game Mode",          lookFor: "what the client sees on their screen — the reward feedback that drives engagement. 3 modes: Aurora, Generative Art, Audio Interrupt." },
            brain:      { what: "Brain Map",          lookFor: "the new normative database comparison — Sarah's z-scores vs n=847 healthy controls. Theta + low alpha = classic ADHD signature." },
            hrv:        { what: "Heart & Breathing",  lookFor: "the connected wearables strip at top — Apple Health · Oura · Whoop feed into the cross-session pattern detector." },
            outcomes:   { what: "Questionnaires",     lookFor: "PHQ-9, GAD-7, custom scales · auto-scored · longitudinal trend overlaid with neurofeedback signal." },
            progress:   { what: "Progress",           lookFor: "20-session arc with PHQ-9 18→5, GAD-7 14→4, reward score +131%. Branded PDF in one click." },
            ai:         { what: "AI Insights",        lookFor: "the cross-session pattern detector — uniquely correlates Mendi data with sleep/mood/HRV. Plus 6-format note selector and tone analytics with fNIRS overlay." },
            protocols:  { what: "Protocols",          lookFor: "50+ evidence-based protocols, searchable by condition. Open library — clinicians can fork and contribute." },
            schedule:   { what: "Schedule",           lookFor: "calendar with smart slot suggestions, automated reminders, Mendi pre-call hardware checks." },
            reports:    { what: "Reports",            lookFor: "the live outcomes registry (47k sessions, 412 clinics) + pre-print citation + Co-author CTA + IRB packet for Mendi science team." },
            compare:    { what: "Compare",            lookFor: "8-column matrix of EEGBase vs every legacy + modern competitor. Filter by capability." },
            billing:    { what: "Billing & Claims",   lookFor: "the 3-tier pricing strip (Solo / Practice / Enterprise) with annual toggle (save 17%). CMS-1500 auto-gen below." },
            team:       { what: "Team & Roles",       lookFor: "RBAC matrix, supervisor co-sign workflow, audit trail of every clinician action." },
            compliance: { what: "Compliance",         lookFor: "Schrems II + EU SCCs, SOC 2 Type II + Bishop Fox pen-test downloads, P0 Incident SLA, FDA general wellness posture." },
            marketing:  { what: "Marketing",          lookFor: "white-label Mendi Clinical mode (B2B story), coaching marketplace, corporate wellness, 4-quarter roadmap, RCT enrollment portal." },
            devices:    { what: "Devices & API",      lookFor: "Mendi flagship card with calibration drift sparkline + BIDS-fNIRS sidecar JSON + 6 migration importers (BrainPaint/EEGer/NeuroGuide/etc)." },
          };
          const cap = captions[tab];
          if (!cap) return null;
          return (
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0A1320", borderBottom: "1px solid #1E293B", padding: "8px 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", padding: "2px 7px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>👀 You&apos;re seeing</span>
              <span><strong style={{ color: "#F1F5F9" }}>{cap.what}</strong> — look for {cap.lookFor}</span>
            </div>
          );
        })()}

        <div
          role="tabpanel"
          id={`tabpanel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="demo-content"
          style={{ padding: "24px 20px", maxWidth: 1180, width: "100%", flex: 1, minWidth: 0 }}
        >

        {/* ── LIVE SESSION ── */}
        {tab === "session" && (
          <>
            {/* Context strip */}
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #2563EB", borderRadius: 12, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(37,99,235,0.15)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700 }}>i</div>
              <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                <strong style={{ color: "#F1F5F9" }}>Clinician view</strong> — you&apos;re watching {demoClient.name}&apos;s brain signals in real time (simulated). The <strong style={{ color: "#F1F5F9" }}>Reward Score</strong> rises when the client&apos;s brain is producing the target pattern. Switch to <button onClick={() => switchTab("game")} style={{ background: "none", border: "none", color: "#60A5FA", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13, textDecoration: "underline" }}>Game Mode</button> to see what the client sees.
              </span>
            </div>

            {/* Group therapy toggle — closes Sessions Health gap, opens corporate wellness */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 10, marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", padding: "2px 8px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mode</span>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "#0A1320", border: "1px solid #1E293B", borderRadius: 8 }}>
                  <button onClick={() => showToast("Switched to 1-on-1 mode")} style={{ fontSize: 11, padding: "4px 12px", background: "#1E293B", color: "#F1F5F9", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 700 }}>1-on-1 ✓</button>
                  <button onClick={() => showToast("Group session · 8 client tiles · shared protocol · individual signal panels · CPT 90849 group psychotherapy")} style={{ fontSize: 11, padding: "4px 12px", background: "transparent", color: "#94A3B8", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}>Group (up to 8)</button>
                  <button onClick={() => showToast("Couples · 2 client tiles · shared dashboard with individual privacy")} style={{ fontSize: 11, padding: "4px 12px", background: "transparent", color: "#94A3B8", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}>Couples</button>
                  <button onClick={() => showToast("Family · multiple participants · IFS / family-systems mode")} style={{ fontSize: 11, padding: "4px 12px", background: "transparent", color: "#94A3B8", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}>Family</button>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#64748B" }}>Group sessions are CPT 90849 reimbursable · scales clinic capacity 4–8× · supports corporate wellness deployment</span>
            </div>

            {/* Telehealth co-feedback panel — unique combo: HIPAA video + live signals */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #0A1A2E 100%)", border: "1px solid #2563EB", borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 24px -16px rgba(37,99,235,0.4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 14, alignItems: "stretch" }}>
                {/* Video tile */}
                <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", aspectRatio: "4 / 3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #60A5FA, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "white" }}>SM</div>
                  <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 700, color: "#34D399", padding: "2px 7px", background: "rgba(0,0,0,0.6)", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "pulse 1.2s infinite" }} />REC
                  </span>
                  <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 10, fontWeight: 700, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>Sarah Mitchell</span>
                  <span style={{ position: "absolute", bottom: 8, right: 8, fontSize: 9, color: "#94A3B8", padding: "2px 6px", background: "rgba(0,0,0,0.6)", borderRadius: 4, fontFamily: "ui-monospace, monospace" }}>HD · E2E</span>
                </div>
                {/* Co-feedback overlay */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#60A5FA", padding: "2px 7px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.35)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>HIPAA Video · Co-Feedback</span>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>Telehealth + live Mendi signals — clinician sees in real time what the at-home client&apos;s brain is doing</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
                    {[
                      { k: "Latency",     v: "120 ms",   sub: "WebRTC end-to-end" },
                      { k: "Signal sync", v: "± 80 ms",  sub: "stamped to LSL clock" },
                      { k: "Encryption",  v: "DTLS 1.3", sub: "AES-256-GCM" },
                      { k: "BAA",         v: "Daily.co", sub: "signed · audited" },
                    ].map((s) => (
                      <div key={s.k} style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 8, padding: "6px 8px" }}>
                        <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{s.k}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                        <div style={{ fontSize: 9, color: "#64748B" }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <button onClick={() => showToast("Mic muted on clinician side")} style={{ fontSize: 10, padding: "5px 10px", background: "#0A1320", color: "#CBD5E1", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>🎙 Mute</button>
                    <button onClick={() => showToast("Camera off · audio still live")} style={{ fontSize: 10, padding: "5px 10px", background: "#0A1320", color: "#CBD5E1", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>📷 Cam off</button>
                    <button onClick={() => showToast("Sharing protocol-control screen with client")} style={{ fontSize: 10, padding: "5px 10px", background: "#0A1320", color: "#CBD5E1", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>🖥 Share</button>
                    <button onClick={() => showToast("Session bookmark added at 14:23 · auto-included in SOAP draft")} style={{ fontSize: 10, padding: "5px 10px", background: "#0A1320", color: "#CBD5E1", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>🔖 Bookmark moment</button>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#34D399", fontWeight: 700 }}>↑ Reward score visible to client during call</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signal Quality Strip — fNIRS / EEG sensor health */}
            <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4 }}>Signal Quality</span>
              {[
                { label: "Fp1 OxyHb", quality: 96, color: "#10B981", impedance: "8 kΩ" },
                { label: "Fp2 OxyHb", quality: 94, color: "#10B981", impedance: "9 kΩ" },
                { label: "Cz EEG", quality: 88, color: "#10B981", impedance: "12 kΩ" },
                { label: "HRV (Polar)", quality: 99, color: "#10B981", impedance: "—" },
                { label: "EMG Artifact", quality: emgRejection ? 92 : 0, color: emgRejection ? "#10B981" : "#64748B", impedance: emgRejection ? "Rejected" : "Off" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "#0A1320", border: "1px solid #1E293B", borderRadius: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                  <span style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{s.impedance}</span>
                  <div style={{ width: 28, height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${s.quality}%`, height: "100%", background: s.color }} />
                  </div>
                </div>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#34D399", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "pulse 1.5s infinite" }} />
                All sensors clean
              </span>
            </div>

            {/* Session Control Panel */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 4 }}>Session Controls</span>
              <button
                onClick={togglePauseResume}
                style={{ ...(running ? clinicianBtn : clinicianBtnPrimary), display: "inline-flex", alignItems: "center", gap: 6 }}
                aria-label={running ? "Pause session" : "Resume session"}
              >
                {running ? <Pause size={13} strokeWidth={2} /> : <Play size={13} strokeWidth={2} />}
                {running ? "Pause session" : "Resume"}
              </button>
              <button onClick={addMarker} style={{ ...clinicianBtn, display: "inline-flex", alignItems: "center", gap: 6 }} aria-label="Mark this moment">
                <Plus size={13} strokeWidth={2} />
                Mark moment
              </button>
              <button onClick={() => setShowResetConfirm(true)} style={{ ...clinicianBtn, display: "inline-flex", alignItems: "center", gap: 6 }} aria-label="Reset session timer">
                <RotateCcw size={13} strokeWidth={2} />
                Reset
              </button>
              <button
                onClick={() => setAudioReward((v) => !v)}
                style={{ ...(audioReward ? clinicianBtnPrimary : clinicianBtn), display: "inline-flex", alignItems: "center", gap: 6 }}
                aria-label={audioReward ? "Mute reward sound" : "Unmute reward sound"}
              >
                {audioReward ? <Volume2 size={13} strokeWidth={2} /> : <VolumeX size={13} strokeWidth={2} />}
                {audioReward ? "Sound on" : "Sound off"}
              </button>
              <button
                onClick={() => setShowClientApp(true)}
                style={{ ...clinicianBtn, display: "inline-flex", alignItems: "center", gap: 6 }}
                aria-label="Show what the client sees"
              >
                <Smartphone size={13} strokeWidth={2} />
                Show client view
              </button>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginRight: 4 }}>Window:</span>
                {([30, 60, 120] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setChartWindow(w)}
                    style={{
                      ...clinicianBtn,
                      padding: "6px 10px",
                      fontSize: 12,
                      background: chartWindow === w ? "#2563EB" : "#1E293B",
                      color: chartWindow === w ? "white" : "#F1F5F9",
                      border: chartWindow === w ? "1px solid #2563EB" : "1px solid #334155",
                    }}
                  >
                    {w}s
                  </button>
                ))}
              </div>
            </div>

            {showResetConfirm && (
              <div style={{ background: "rgba(127,29,29,0.25)", border: "1px solid #B91C1C", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#FCA5A5", fontWeight: 600 }}>Reset session timer and clear all markers?</span>
                <button onClick={resetSession} style={{ ...clinicianBtn, background: "#B91C1C", border: "1px solid #B91C1C", color: "white", marginLeft: "auto" }}>Yes, reset</button>
                <button onClick={() => setShowResetConfirm(false)} style={clinicianBtn}>Cancel</button>
              </div>
            )}

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
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "flex-start" }}>Reward Score</div>
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
                    <div onClick={() => setDetailModal({ type: "scoreBreakdown", data: { score: rewardVal ?? 0 } })} title="Click to see score breakdown" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                        {rewardVal != null ? rewardVal.toFixed(0) : "—"}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#94A3B8", marginTop: 1 }}>/ 100</div>
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
                      {rewardVal == null
                        ? "—"
                        : rewardVal >= rewardThreshold + 20
                        ? "Peak — excellent"
                        : rewardVal >= rewardThreshold
                        ? "On target"
                        : rewardVal >= rewardThreshold - 20
                        ? "Building up"
                        : "Below target"}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <LiveChart data={reward.data.slice(-chartWindow)} color="#60A5FA" label={`Reward score · last ${chartWindow}s`} height={80} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { label: "Oxy L",   val: sample?.oxyHbLeft,    color: "#10B981", gloss: "Oxygen-rich blood, left forehead — higher means more brain activity in that area." },
                    { label: "Oxy R",   val: sample?.oxyHbRight,   color: "#0EA5E9", gloss: "Oxygen-rich blood, right forehead." },
                    { label: "Deoxy L", val: sample?.deoxyHbLeft,  color: "#6366F1", gloss: "Used-up blood, left forehead. Drops when oxygen is being consumed." },
                    { label: "Deoxy R", val: sample?.deoxyHbRight, color: "#EC4899", gloss: "Used-up blood, right forehead." },
                    { label: "Heart",   val: sample?.heartRate,    color: "#F59E0B", suffix: " bpm", gloss: "Heart rate in beats per minute. Normal resting: 60–80 bpm." },
                    { label: "HRV",     val: sample?.hrvRmssd,     color: "#8B5CF6", suffix: " ms", gloss: "Heart-rate variability. Higher means a calmer nervous system. Target above 50 ms." },
                  ].map(({ label, val, color, suffix, gloss }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span className="gloss" data-gloss={gloss} style={{ fontSize: "0.72rem", color: "#94A3B8", width: 58 }}>{label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums", width: 58, textAlign: "right" }}>
                        {val != null ? val.toFixed(suffix ? 0 : 3) + (suffix ?? "") : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Threshold + sensitivity sliders */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label htmlFor="reward-threshold" className="gloss" data-gloss="How hard the goal is. Higher = client has to focus more to score points." style={{ fontSize: 12, fontWeight: 700, color: "#CBD5E1", minWidth: 110 }}>
                  Goal level: <span style={{ color: "#14B8A6", fontVariantNumeric: "tabular-nums" }}>{rewardThreshold}</span>
                </label>
                <input
                  id="reward-threshold"
                  type="range"
                  min={0}
                  max={100}
                  value={rewardThreshold}
                  onChange={(e) => setRewardThreshold(Number(e.target.value))}
                  style={{ width: 160, accentColor: "#14B8A6" }}
                  aria-label="Goal level"
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label htmlFor="sensitivity" className="gloss" data-gloss="How quickly the score reacts to brain changes. Higher = jumpier; Lower = smoother." style={{ fontSize: 12, fontWeight: 700, color: "#CBD5E1", minWidth: 110 }}>
                  Reaction speed: <span style={{ color: "#14B8A6", fontVariantNumeric: "tabular-nums" }}>{sensitivity}</span>
                </label>
                <input
                  id="sensitivity"
                  type="range"
                  min={1}
                  max={10}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  style={{ width: 160, accentColor: "#14B8A6" }}
                  aria-label="Feedback sensitivity"
                />
              </div>
              <span style={{ fontSize: 11, color: "#64748B", marginLeft: "auto" }}>Adjust to recalibrate &quot;On target&quot; in real time</span>
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8,
                  background: showAdvanced ? "#1E293B" : "transparent",
                  color: showAdvanced ? "#60A5FA" : "#94A3B8",
                  border: "1px solid #334155",
                  cursor: "pointer",
                }}
              >
                {showAdvanced ? "▾ Hide advanced" : "▸ Advanced controls"}
              </button>
            </div>

            {/* ── ADVANCED CLINICIAN CONTROLS ── */}
            {showAdvanced && (
              <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -16px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #1E293B" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(96,165,250,0.15)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: "1px solid rgba(96,165,250,0.3)" }}>⚙</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Advanced Clinician Controls</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Fine-tune protocol parameters · changes apply in real time</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="demo-grid-2">
                  {/* REWARD PARAMETERS */}
                  <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Reward parameters</div>
                    {[
                      { label: "Reward %", value: rewardPct, set: setRewardPct, min: 30, max: 95, step: 5, unit: "%", hint: "% of time in zone to trigger reward" },
                      { label: "Hold time", value: holdTime, set: setHoldTime, min: 0, max: 3, step: 0.1, unit: "s", hint: "Sustain target for X seconds" },
                    ].map((s) => (
                      <div key={s.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#CBD5E1", fontWeight: 600 }}>{s.label}</span>
                          <span style={{ color: "#34D399", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.value}{s.unit}</span>
                        </div>
                        <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={(e) => s.set(Number(e.target.value))} style={{ width: "100%", accentColor: "#10B981" }} aria-label={s.label} />
                        <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{s.hint}</div>
                      </div>
                    ))}
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#CBD5E1", cursor: "pointer", marginTop: 8 }}>
                      <input type="checkbox" checked={autoThreshold} onChange={(e) => setAutoThreshold(e.target.checked)} style={{ accentColor: "#10B981" }} />
                      Auto-adapt threshold
                      <span style={{ fontSize: 10, color: "#64748B", marginLeft: 4 }}>(ANT mode)</span>
                    </label>
                  </div>

                  {/* SIGNAL PROCESSING */}
                  <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Signal processing</div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: "#CBD5E1", fontWeight: 600 }}>Smoothing</span>
                        <span style={{ color: "#60A5FA", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{smoothing.toFixed(1)}s</span>
                      </div>
                      <input type="range" min={0.5} max={5.0} step={0.1} value={smoothing} onChange={(e) => setSmoothing(Number(e.target.value))} style={{ width: "100%", accentColor: "#3B82F6" }} aria-label="Smoothing window" />
                      <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>Moving average window</div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#CBD5E1", cursor: "pointer", marginTop: 8 }}>
                      <input type="checkbox" checked={yAxisAutoscale} onChange={(e) => setYAxisAutoscale(e.target.checked)} style={{ accentColor: "#3B82F6" }} />
                      Auto-scale chart Y-axis
                    </label>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600, marginBottom: 6 }}>Session duration</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[20, 30, 45, 60].map((d) => (
                          <button key={d} onClick={() => setSessionDuration(d)} style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: "5px 0", borderRadius: 6, border: sessionDuration === d ? "1px solid #3B82F6" : "1px solid #334155", background: sessionDuration === d ? "#3B82F6" : "#1E293B", color: sessionDuration === d ? "white" : "#94A3B8", cursor: "pointer" }}>{d}m</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FREQUENCY BAND RANGES */}
                  <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Frequency band ranges (Hz)</div>
                    {[
                      { name: "Theta", range: thetaRange, set: setThetaRange, color: "#F59E0B", min: 1, max: 12 },
                      { name: "Alpha", range: alphaRange, set: setAlphaRange, color: "#EF4444", min: 6, max: 14 },
                      { name: "Beta",  range: betaRange,  set: setBetaRange,  color: "#EC4899", min: 12, max: 30 },
                    ].map((b) => (
                      <div key={b.name} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: b.color, width: 38 }}>{b.name}</span>
                        <input type="number" value={b.range[0]} min={b.min} max={b.range[1] - 1} step={0.5} onChange={(e) => b.set([Number(e.target.value), b.range[1]])} style={{ width: 50, padding: "4px 6px", fontSize: 11, background: "#1E293B", border: "1px solid #334155", color: "#F1F5F9", borderRadius: 6, fontVariantNumeric: "tabular-nums" }} />
                        <span style={{ color: "#64748B", fontSize: 10 }}>—</span>
                        <input type="number" value={b.range[1]} min={b.range[0] + 1} max={b.max} step={0.5} onChange={(e) => b.set([b.range[0], Number(e.target.value)])} style={{ width: 50, padding: "4px 6px", fontSize: 11, background: "#1E293B", border: "1px solid #334155", color: "#F1F5F9", borderRadius: 6, fontVariantNumeric: "tabular-nums" }} />
                        <span style={{ fontSize: 10, color: "#64748B" }}>Hz</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>Custom band tuning per protocol</div>
                  </div>

                  {/* AUDIO + ARTIFACT REJECTION */}
                  <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#F472B6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Audio &amp; artifacts</div>
                    {[
                      { label: "Master volume", value: masterVolume, set: setMasterVolume, unit: "%" },
                      { label: "Reward sound", value: rewardSoundVolume, set: setRewardSoundVolume, unit: "%" },
                      { label: "EMG threshold", value: emgThreshold, set: setEmgThreshold, unit: "µV" },
                    ].map((s) => (
                      <div key={s.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#CBD5E1", fontWeight: 600 }}>{s.label}</span>
                          <span style={{ color: "#F472B6", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.value}{s.unit}</span>
                        </div>
                        <input type="range" min={0} max={100} value={s.value} onChange={(e) => s.set(Number(e.target.value))} style={{ width: "100%", accentColor: "#EC4899" }} aria-label={s.label} />
                      </div>
                    ))}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#CBD5E1", cursor: "pointer" }}>
                        <input type="checkbox" checked={emgRejection} onChange={(e) => setEmgRejection(e.target.checked)} style={{ accentColor: "#EC4899" }} />
                        EMG artifact rejection
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#CBD5E1", cursor: "pointer" }}>
                        <input type="checkbox" checked={eyeBlinkRejection} onChange={(e) => setEyeBlinkRejection(e.target.checked)} style={{ accentColor: "#EC4899" }} />
                        Eye blink rejection
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, padding: "8px 12px", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 8, fontSize: 11, color: "#93C5FD", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontWeight: 700 }}>Tip:</span>
                  Settings are saved to the protocol. Changes here update the live signal pipeline immediately.
                </div>
              </div>
            )}

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
                  <div key={label} onClick={() => val && setDetailModal({ type: "zscore", data: { band: label, value: n } })} title="Click to see normative distribution" style={{ display: "flex", alignItems: "center", gap: 10, cursor: val ? "pointer" : "default", padding: "4px 6px", borderRadius: 6, transition: "background 0.15s" }} onMouseEnter={(e) => val && (e.currentTarget.style.background = "#0F172A")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ fontSize: 12, color, fontWeight: 600, width: 36 }}>{label}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: devColor, fontVariantNumeric: "tabular-nums", width: 52 }}>
                      {val ? (n > 0 ? "+" : "") + val : "—"}
                    </span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>SD</span>
                    <span style={{ fontSize: 11, color: devColor, fontWeight: 500 }}>
                      {Math.abs(n) > 2 ? "↑ Elevated" : Math.abs(n) > 1 ? "Borderline" : "✓ Normal"}
                    </span>
                  </div>
                );
              })}
              <span style={{ marginLeft: "auto", display: "flex", gap: 10, fontSize: 10, color: "#64748B", alignItems: "center" }}>
                <span style={{ color: "#10B981" }}>🟢 Normal</span>
                <span style={{ color: "#F59E0B" }}>🟡 Borderline</span>
                <span style={{ color: "#EF4444" }}>🔴 Elevated</span>
              </span>
            </div>

            {/* Dynamic plain-English status */}
            {sessionStatus && (
              <div style={{ background: sessionStatus.bg, border: `1px solid ${sessionStatus.border}`, borderLeft: `3px solid ${sessionStatus.accent}`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.6s ease", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: sessionStatus.accent, flexShrink: 0 }}>{sessionStatus.icon}</span>
                <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 500, lineHeight: 1.5 }}>{sessionStatus.text}</span>
              </div>
            )}

            <div className="demo-section-label">Blood flow to the prefrontal cortex (fNIRS sensor)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="demo-grid-2">
              {[
                { data: oxyL.data, color: "#10B981", label: "Oxygenated blood · Left prefrontal" },
                { data: oxyR.data.map((v) => Math.max(0, Math.min(1, v + 0.5))), color: "#0EA5E9", label: "Oxygenated blood · Right prefrontal" },
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

            {/* Mendi-specific fNIRS analytics: Asymmetry + HRF + TOI */}
            {(() => {
              const oxyLval = sample?.oxyHbLeft ?? 0;
              const oxyRval = sample?.oxyHbRight ?? 0;
              const asymmetry = oxyLval - oxyRval;
              const asymmetryPct = Math.max(-1, Math.min(1, asymmetry * 2));
              const toi = oxyLval > 0 ? (oxyLval / (oxyLval + Math.abs(sample?.deoxyHbLeft ?? 0.05))) * 100 : 65;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12, marginBottom: 14 }} className="demo-grid-3">
                  {/* Prefrontal Asymmetry — Mendi flagship metric */}
                  <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderLeft: "3px solid #A855F7", borderRadius: 12, padding: 14, boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em" }}>Prefrontal Asymmetry</div>
                      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>L − R DLPFC</span>
                    </div>
                    <div style={{ position: "relative", height: 12, background: "linear-gradient(90deg, #EF4444 0%, #1E293B 50%, #10B981 100%)", borderRadius: 6, marginBottom: 8 }}>
                      <div style={{ position: "absolute", top: -4, left: `calc(50% + ${asymmetryPct * 50}% - 2px)`, width: 4, height: 20, background: "white", borderRadius: 2, boxShadow: "0 0 8px white" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748B", marginBottom: 8 }}>
                      <span>R-dominant</span>
                      <span style={{ fontFamily: "ui-monospace, monospace", color: asymmetry > 0 ? "#34D399" : asymmetry < 0 ? "#F87171" : "#94A3B8", fontWeight: 700, fontSize: 13 }}>
                        {asymmetry >= 0 ? "+" : ""}{asymmetry.toFixed(3)}
                      </span>
                      <span>L-dominant</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5 }}>
                      L &gt; R indicates approach motivation · R &gt; L indicates withdrawal/anxiety state. Target zone for depression protocols: <strong style={{ color: "#A78BFA" }}>+0.05 to +0.20</strong>
                    </div>
                  </div>

                  {/* Hemodynamic Response Function (HRF) viewer */}
                  <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderLeft: "3px solid #06B6D4", borderRadius: 12, padding: 14, boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.08em" }}>HRF Response</div>
                      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>last stim · canonical</span>
                    </div>
                    <svg viewBox="0 0 160 64" width="100%" style={{ display: "block", marginBottom: 6 }}>
                      <line x1="0" y1="48" x2="160" y2="48" stroke="#1E293B" strokeWidth="1" />
                      <line x1="20" y1="0" x2="20" y2="64" stroke="rgba(6,182,212,0.3)" strokeWidth="1" strokeDasharray="2 3" />
                      <text x="22" y="10" fontSize="7" fill="#64748B">stim</text>
                      <path
                        d="M 0,48 L 20,48 L 30,46 L 40,38 L 50,24 L 60,15 L 70,12 L 80,14 L 90,22 L 100,32 L 110,40 L 120,44 L 130,46 L 140,47 L 150,48 L 160,48"
                        fill="none"
                        stroke="#06B6D4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        filter="drop-shadow(0 0 4px rgba(6,182,212,0.4))"
                      />
                      <circle cx="80" cy="14" r="2.5" fill="#06B6D4" />
                      <text x="86" y="14" fontSize="7" fill="#06B6D4" fontWeight="700">peak 5s</text>
                    </svg>
                    <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.4 }}>Onset 1.2s · Peak 5.0s · Return 14s · <span style={{ color: "#34D399", fontWeight: 600 }}>well-formed</span></div>
                  </div>

                  {/* Tissue Oxygenation Index (TOI) */}
                  <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 12, padding: 14, boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em" }}>TOI</div>
                      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>HbO / (HbO + HbR)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{toi.toFixed(1)}</span>
                      <span style={{ fontSize: 12, color: "#64748B" }}>%</span>
                    </div>
                    <div style={{ height: 6, background: "#1E293B", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${toi}%`, background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.4 }}>Normal 60–75% · <span style={{ color: "#34D399", fontWeight: 600 }}>oxygenation healthy</span></div>
                  </div>
                </div>
              );
            })()}

            {/* Session visual hierarchy: highlight training metric */}
            <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", border: "1px solid #334155", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <span style={{ fontSize: 13, color: "#FCD34D", fontWeight: 700 }}>Session goal:</span>
              <span style={{ fontSize: 13, color: "#FDE68A", marginLeft: 4 }}>{PROTOCOL_GOALS[recommendationApplied ? "Alpha-Theta · Pz/Oz" : demoClient.protocol] ?? "Score rises when the target brainwave pattern is sustained"}</span>
            </div>

            {/* Marker Timeline */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Session Markers ({markers.length})</span>
                <span style={{ fontSize: 11, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>0:00 ─── {fmt(Math.max(elapsed, 60))}</span>
              </div>
              {markers.length === 0 ? (
                <div style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", padding: "10px 0", textAlign: "center" }}>
                  No moments flagged yet — tap &ldquo;Mark moment&rdquo; to flag something for later review
                </div>
              ) : (
                <div style={{ position: "relative", height: 28, background: "#1E293B", borderRadius: 8, overflow: "visible" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "#334155", transform: "translateY(-50%)" }} />
                  {markers.map((m, i) => {
                    const totalSpan = Math.max(60, elapsed, ...markers.map((mm) => mm.time));
                    const pct = totalSpan === 0 ? 0 : (m.time / totalSpan) * 100;
                    const isHovered = hoveredMarker === i;
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setHoveredMarker(i)}
                        onMouseLeave={() => setHoveredMarker(null)}
                        onClick={() => showToast(`${m.label} at ${fmt(m.time)}`)}
                        style={{
                          position: "absolute",
                          left: `${pct}%`,
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#14B8A6",
                          border: "2px solid #0F172A",
                          cursor: "pointer",
                          boxShadow: isHovered ? "0 0 0 4px rgba(20,184,166,0.25)" : "none",
                          transition: "box-shadow 0.15s",
                        }}
                        title={`${m.label} · ${fmt(m.time)}`}
                      >
                        {isHovered && (
                          <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#0F172A", border: "1px solid #14B8A6", color: "#F1F5F9", fontSize: 11, padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", fontWeight: 600 }}>
                            {m.label} · {fmt(m.time)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="demo-section-label">Brainwave bands (EEG)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }} className="demo-grid-3">
              {([
                { data: thetaW.data, color: "#F59E0B", label: "Theta — slow waves (drowsy/relaxed)", isTarget: false, isSuppressed: true,  bandKey: "theta" as const },
                { data: alphaW.data, color: "#EF4444", label: "Alpha — calm focus",                    isTarget: false, isSuppressed: false, bandKey: "alpha" as const },
                { data: betaW.data,  color: "#EC4899", label: "Beta — active thinking",                isTarget: true,  isSuppressed: false, bandKey: "beta"  as const },
              ]).map(({ data, color, label, isTarget, isSuppressed, bandKey }) => {
                const enabled = enabledBands[bandKey];
                return (
                <div key={label} style={{
                  background: "#0F172A",
                  border: "1px solid #1E293B",
                  borderTop: !enabled
                    ? "1px solid #1E293B"
                    : isTarget
                    ? "3px solid #10B981"
                    : isSuppressed
                    ? "3px solid #F59E0B"
                    : "1px solid #1E293B",
                  boxShadow: enabled
                    ? "0 8px 24px -12px rgba(0,0,0,0.5), 0 1px 0 0 rgba(255,255,255,0.04) inset"
                    : "0 1px 0 0 rgba(255,255,255,0.02) inset",
                  borderRadius: 14, padding: 18, position: "relative",
                  opacity: enabled ? 1 : 0.45,
                  transition: "opacity 0.2s, box-shadow 0.2s",
                }}>
                  <button
                    onClick={() => setEnabledBands((prev) => ({ ...prev, [bandKey]: !prev[bandKey] }))}
                    aria-label={`Toggle ${bandKey} band reward contribution`}
                    style={{
                      position: "absolute", top: 8, left: 10,
                      fontSize: 10, fontWeight: 700,
                      color: enabled ? "#34D399" : "#64748B",
                      background: enabled ? "rgba(6,78,59,0.4)" : "rgba(51,65,85,0.4)",
                      border: enabled ? "1px solid #065F46" : "1px solid #334155",
                      padding: "2px 8px", borderRadius: 99,
                      cursor: "pointer",
                    }}
                  >
                    {enabled ? "✓ In reward" : "○ Disabled"}
                  </button>
                  {enabled && isTarget && <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.15)", padding: "2px 7px", borderRadius: 99 }}>REWARD ↑</div>}
                  {enabled && isSuppressed && <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 700, color: "#D97706", background: "rgba(245,158,11,0.15)", padding: "2px 7px", borderRadius: 99 }}>SUPPRESS ↓</div>}
                  <div style={{ height: 22 }} />
                  {sampleCount === 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 8 }}>{label}</div>
                      <div className="skeleton" style={{ height: 68 }} />
                    </>
                  ) : (
                    <LiveChart data={data} color={color} label={label} height={68} />
                  )}
                </div>
                );
              })}
            </div>

            {/* Quick session note */}
            <div style={{ marginTop: 14, background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <label htmlFor="quick-note" style={{ fontSize: 12, fontWeight: 700, color: "#CBD5E1", whiteSpace: "nowrap" }}>
                Quick session note
              </label>
              <input
                id="quick-note"
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onBlur={() => {
                  if (quickNote.trim().length > 0) {
                    setNoteSavedFlash(true);
                    setTimeout(() => setNoteSavedFlash(false), 2000);
                  }
                }}
                placeholder="Type and tab away to save…"
                aria-label="Quick session note"
                style={{ flex: 1, minWidth: 220, padding: "8px 12px", border: "1px solid #334155", borderRadius: 8, background: "#1E293B", color: "#F1F5F9", fontSize: 13, outline: "none" }}
              />
              {noteSavedFlash && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399", background: "rgba(6,78,59,0.4)", border: "1px solid #065F46", padding: "4px 10px", borderRadius: 99 }}>
                  ✓ Saved
                </span>
              )}
            </div>
          </>
        )}

        {/* ── GAME MODE ── */}
        {tab === "game" && (
          <div>
            {/* Clinician context banner */}
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 14, boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.15)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700 }}>i</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>How clinicians use Game Mode</div>
                <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
                  Turn your monitor toward the client during a session. Pick a feedback style below — all update in real time from live EEG. Green = on target. Clients engage 2–3× longer with visual feedback vs. a progress bar.
                </p>
              </div>
            </div>

            {/* Mode selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "#1E293B", borderRadius: 12, padding: 6, border: "1px solid #334155", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, paddingLeft: 6, whiteSpace: "nowrap" }}>Feedback style:</span>
              {([
                { id: "orb",   icon: "🌌", label: "Aurora" },
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

            {/* Game Mode clinician toolbar */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 4 }}>Clinician Toolbar</span>
              <button
                onClick={() => {
                  if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => showToast("Fullscreen not available"));
                    showToast("Entered fullscreen");
                  } else {
                    showToast("Fullscreen not available");
                  }
                }}
                style={clinicianBtnPrimary}
                aria-label="Enter fullscreen for client"
              >
                ⛶ Fullscreen for client
              </button>
              <button
                onClick={() => setShowClinicianOverlay((v) => !v)}
                style={showClinicianOverlay ? clinicianBtnPrimary : clinicianBtn}
                aria-label="Toggle clinician overlay"
              >
                {showClinicianOverlay ? "👁 Clinician overlay: ON" : "🚫 Clinician overlay: OFF"}
              </button>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <label htmlFor="game-difficulty" style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Difficulty:</label>
                <select
                  id="game-difficulty"
                  value={gameDifficulty}
                  onChange={(e) => setGameDifficulty(e.target.value as "Easy" | "Medium" | "Hard")}
                  style={{ background: "#1E293B", color: "#F1F5F9", border: "1px solid #334155", borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Energy Orb */}
            {gameMode === "orb" && (
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>Aurora Nightscape — Client View</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>Threshold: {rewardThreshold} · Aurora intensifies + colors warm above threshold{showClinicianOverlay ? "" : " · score hidden from client"}</div>
                  </div>
                </div>
                <GameFeedback score={showClinicianOverlay ? (rewardVal ?? null) : null} threshold={rewardThreshold} />
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
                  Generative art that evolves in real time with your brainwave activity
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
                      background: "#2563EB",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: rewardVal != null && rewardVal >= 60 ? "spin 12s linear infinite" : "none",
                    }}>
                      <span style={{ fontSize: 28 }}>🎵</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>Ambient Focus Mix</div>
                      <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>EEGBase · Curated for neurofeedback</div>
                      <div style={{ height: 3, background: "#1E293B", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", background: "linear-gradient(90deg, #2563EB, #7C3AED)",
                          width: rewardVal != null && rewardVal >= 60 ? `${Math.min(98, 8 + (elapsed / 3))}%` : "8%",
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
                  <strong>How it works:</strong> Music pauses momentarily when brain activity drifts off target. Clients naturally learn to self-regulate to keep the music playing — no instructions needed.
                </div>
              </div>
            )}

            {/* Metrics row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="demo-grid-2">
              {[
                { label: "Score", value: rewardVal != null ? rewardVal.toFixed(1) : "—", dot: rewardColor },
                { label: "Focus band (β)", value: sample?.beta != null ? (sample.beta * 100).toFixed(1) + "%" : "—", dot: "#EC4899" },
                { label: "Heart rate", value: sample?.heartRate != null ? sample.heartRate.toFixed(0) + " bpm" : "—", dot: "#10B981" },
                { label: "HRV", value: sample?.hrvRmssd != null ? sample.hrvRmssd.toFixed(1) + " ms" : "—", dot: "#8B5CF6" },
              ].map(({ label, value, dot }) => (
                <div key={label} style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 12, padding: "16px 18px", textAlign: "center", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, boxShadow: `0 0 8px ${dot}` }} />
                    <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</div>
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
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>Monitor heart rate variability and breathing coherence alongside EEG — all in one view. Helps clients learn to combine calm breathing with focused brain states.</p>
            </div>

            {/* Live HRV metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-2">
              {[
                { label: "Heart Rate", val: sample?.heartRate, color: "#EF4444", unit: "bpm", norm: "60–80 bpm", icon: "❤️" },
                { label: "HRV (RMSSD)", val: sample?.hrvRmssd, color: "#8B5CF6", unit: "ms", norm: "Target: >50 ms", icon: "📊" },
                { label: "Coherence", val: sample?.hrvRmssd != null ? Math.min(9.9, (sample.hrvRmssd / 10)).toFixed(1) : null, color: "#10B981", unit: "/ 10", norm: "High: >8.0", icon: "🌊" },
                { label: "Resonance Freq", val: "6.0", color: "#F59E0B", unit: "breaths/min", norm: "Personalized target", icon: "🫁" },
              ].map(({ label, val, color, unit, norm }) => (
                <div key={label} style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -16px rgba(0,0,0,0.5)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", fontVariantNumeric: "tabular-nums", marginBottom: 2, letterSpacing: "-0.02em" }}>
                    {val != null ? (typeof val === "string" ? val : Number(val).toFixed(0)) : "—"} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>{unit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{norm}</div>
                </div>
              ))}
            </div>

            {/* Connected wearables — passive data sources */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Connected wearables · passive data</h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Apple Health · Oura · Whoop · Garmin · Fitbit — auto-streamed via Spike API · normalized to one schema · feeds into the cross-session pattern detector</p>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", padding: "3px 8px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>3 of 5 syncing</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[
                  { name: "Apple Health",  icon: "🍎", connected: true,  metrics: ["HRV", "Sleep", "Mindful min"], lastSync: "2 min ago", color: "#94A3B8" },
                  { name: "Oura Ring",     icon: "💍", connected: true,  metrics: ["Sleep score", "Body temp", "HRV"], lastSync: "5 min ago", color: "#A855F7" },
                  { name: "Whoop 4.0",     icon: "🟦", connected: true,  metrics: ["Recovery", "Strain", "Sleep need"], lastSync: "8 min ago", color: "#06B6D4" },
                  { name: "Garmin",        icon: "🟢", connected: false, metrics: ["Stress", "Body Battery"], lastSync: "—", color: "#10B981" },
                  { name: "Fitbit",        icon: "🟣", connected: false, metrics: ["Sleep stages", "SpO₂"], lastSync: "—", color: "#EC4899" },
                ].map((w) => (
                  <div key={w.name} style={{ background: w.connected ? "#0A1320" : "rgba(15,23,42,0.4)", border: `1px solid ${w.connected ? w.color + "40" : "#1E293B"}`, borderRadius: 10, padding: 12, opacity: w.connected ? 1 : 0.55 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{w.icon}</span>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>{w.name}</div>
                      {w.connected && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 6px #34D399" }} />}
                    </div>
                    <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 4, lineHeight: 1.5 }}>{w.metrics.join(" · ")}</div>
                    <div style={{ fontSize: 9, color: "#64748B" }}>{w.connected ? `Synced ${w.lastSync}` : "Tap to connect"}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: "6px 10px", background: "rgba(15,23,42,0.5)", borderRadius: 6, fontSize: 9, color: "#64748B", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#A5B4FC", fontWeight: 700 }}>↗</span> Sleep efficiency from Oura is the strongest predictor of Sarah&apos;s next-session ΔHbO gain (r=+0.74) — see AI Insights.
              </div>
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
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Combined EEG + HRV Score</div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Both channels must exceed threshold for maximum reward — trains mind-body coherence simultaneously.</p>
                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center", padding: "10px 14px", background: "#1E293B", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>EEG Alpha</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>{sample?.alpha != null ? (sample.alpha * 100).toFixed(0) : "—"}<span style={{ fontSize: 12 }}>%</span></div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px 14px", background: "#1E293B", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>HRV Coherence</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#8B5CF6" }}>{sample?.hrvRmssd != null ? Math.min(9.9, sample.hrvRmssd / 10).toFixed(1) : "—"}<span style={{ fontSize: 12 }}>/ 10</span></div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px 14px", background: "#1E293B", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Overall Session Score</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: rewardColor }}>{rewardVal != null ? rewardVal.toFixed(0) : "—"}</div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Resonance Frequency Trainer</div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Paced breathing guide at client&apos;s personal resonance frequency (typically 4.5–7 breaths/min) to maximize HRV amplitude.</p>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: breathPhase === "Inhale" ? "rgba(37,99,235,0.2)" : "rgba(16,185,129,0.15)",
                    border: `4px solid ${breathPhase === "Inhale" ? "#2563EB" : "#93C5FD"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 12px",
                    animation: "breathe 10s ease-in-out infinite",
                    transition: "background 0.5s, border-color 0.5s",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#93C5FD", transition: "opacity 0.3s" }}>{breathPhase}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>6.0 breaths/min · 5s inhale / 5s exhale</div>
                </div>
              </div>
            </div>

            {/* Wearable import */}
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #06B6D4", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>Wearable Data Import</div>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>Import overnight HRV and sleep data from wearables. If the client slept poorly, the AI suggests a lower-intensity session today.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { name: "Oura Ring",   abbr: "OR", color: "#A78BFA", status: "Connected · Last sync 6h ago", active: true },
                  { name: "Apple Watch", abbr: "AW", color: "#06B6D4", status: "Connect →", active: false },
                  { name: "Garmin",      abbr: "G",  color: "#10B981", status: "Connect →", active: false },
                  { name: "Whoop",       abbr: "W",  color: "#F59E0B", status: "Connect →", active: false },
                ].map(({ name, abbr, color, status, active }) => {
                  const isConnected = active || connectedWearables.has(name);
                  const displayStatus = isConnected ? (active ? status : "Paired ✓ — HRV streaming") : status;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        if (isConnected) return;
                        setConnectedWearables((prev) => new Set(prev).add(name));
                        showToast(`${name} paired ✓ — HRV streaming`);
                      }}
                      aria-label={`Connect ${name} for HRV streaming`}
                      style={{
                        background: isConnected ? "#1E293B" : "#243148",
                        border: isConnected ? "1.5px solid #10B981" : "1px solid #334155",
                        borderRadius: 10,
                        padding: "10px 14px",
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        cursor: isConnected ? "default" : "pointer",
                        textAlign: "left",
                        font: "inherit",
                      }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: 6, background: `${color}1A`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, letterSpacing: "-0.02em", flexShrink: 0, border: `1px solid ${color}33` }}>{abbr}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{name}</div>
                        <div style={{ fontSize: 11, color: isConnected ? "#10B981" : "#94A3B8" }}>{displayStatus}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BRAIN MAP + Z-SCORE ── */}
        {tab === "brain" && (
          <div>
            {/* Normative database comparison — closes NeuroGuide gap */}
            <div style={{ ...card, marginBottom: 16, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Normative database comparison</h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Sarah&apos;s Z-scores vs age- and sex-matched cohort · n=847 healthy controls · LORETA source localization on roadmap</p>
                </div>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "#0A1320", border: "1px solid #1E293B", borderRadius: 8 }}>
                  {["Eyes-closed", "Eyes-open", "Task"].map((m, i) => (
                    <button key={m} onClick={() => showToast(`Switched to ${m} norm comparison`)} style={{ fontSize: 10, padding: "4px 10px", background: i === 0 ? "#1E293B" : "transparent", color: i === 0 ? "#F1F5F9" : "#94A3B8", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 700 }}>{m} {i === 0 && "✓"}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                {[
                  { band: "Delta",   z: -0.4, status: "ok"   },
                  { band: "Theta",   z: +2.2, status: "high" },
                  { band: "Alpha",   z: -1.6, status: "low"  },
                  { band: "Beta",    z: +0.3, status: "ok"   },
                  { band: "Hi-Beta", z: +1.8, status: "high" },
                  { band: "Gamma",   z: -0.2, status: "ok"   },
                ].map((b) => {
                  const color = b.status === "ok" ? "#34D399" : b.status === "low" ? "#FCD34D" : "#FCA5A5";
                  const bg = b.status === "ok" ? "rgba(52,211,153,0.1)" : b.status === "low" ? "rgba(252,211,77,0.1)" : "rgba(252,165,165,0.12)";
                  return (
                    <div key={b.band} style={{ background: bg, border: `1px solid ${color}40`, borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{b.band}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{b.z >= 0 ? "+" : ""}{b.z.toFixed(1)}<span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}> SD</span></div>
                      <div style={{ fontSize: 9, color: color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{b.status === "ok" ? "Within ±1 SD" : b.status === "low" ? "Below norm" : "Above norm"}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, padding: "6px 10px", background: "rgba(15,23,42,0.5)", borderRadius: 6, fontSize: 10, color: "#94A3B8", lineHeight: 1.55 }}>
                <strong style={{ color: "#FCA5A5" }}>Pattern:</strong> elevated theta + low alpha is a classic ADHD signature (Arns et al., 2013). Recommended protocol: SMR up-train at Cz with theta inhibit. <strong style={{ color: "#A5B4FC" }}>3D LORETA source localization</strong> ships Q4 2026.
              </div>
            </div>

            <div style={{ ...card, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Prefrontal Activity Map</h2>
              <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 12, lineHeight: 1.6 }}>
                This map shows blood flow to the front of the brain — the decision-making and focus center. Warmer colors (green → red) mean more oxygen-rich blood is flowing there. It updates live as the session runs.
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
                  { data: oxyR.data.map((v) => Math.max(0, Math.min(1, v + 0.5))), color: "#0EA5E9", label: "OxyHb R · prefrontal" },
                ].map(({ data, color, label }) => (
                  <div key={label} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 12, padding: 14 }}>
                    <LiveChart data={data} color={color} label={label} height={88} />
                  </div>
                ))}
              </div>
            </div>

            {/* Z-score training panel */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Real-Time Z-Score Training</span>
                <span style={{ fontSize: 10, background: "#2563EB", color: "white", borderRadius: 99, padding: "2px 8px", fontWeight: 700 }}>LIVE</span>
              </div>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20, lineHeight: 1.5 }}>
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
                        {val ? (n > 0 ? "+" : "") + val : "—"} <span style={{ fontSize: 14, fontWeight: 500, color: "#94A3B8" }}>SD</span>
                      </div>
                      {/* Deviation bar */}
                      <div style={{ height: 6, background: "#0F172A", borderRadius: 99, marginBottom: 8, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: `${barWidth / 2}%`, background: devColor, ...(n < 0 ? { right: "50%", left: "auto" } : {}) }} />
                        <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 1, background: "#475569" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5 }}>
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
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Send depression and anxiety check-ins to clients on a schedule (e.g. every 5 sessions). Clients fill them out on their phone, and scores automatically appear alongside their brain data.
              </p>
            </div>

            {/* Questionnaire schedule demo */}
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Automated Questionnaire Schedule</div>
                <div style={{ fontSize: 13, color: "#CBD5E1" }}>PHQ-9 every 5 sessions · GAD-7 every 5 sessions · ADHD-RS at intake + discharge</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                {["PHQ-9", "GAD-7", "ADHD-RS", "DASS-21"].map((q) => (
                  <span key={q} style={{ fontSize: 11, background: "#1E293B", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", color: "#34D399", fontWeight: 600 }}>{q}</span>
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
                <span style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#FCD34D", display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />8-session streak</span>
                <span style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#34D399", display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />95% attendance</span>
                <span style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#93C5FD", display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} />Top 12% of clients</span>
              </div>
            </div>

            {/* AI stall detection banner */}
            {!stallAlertDismissed && (
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #F59E0B", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.15)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700 }}>!</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>
                  EEGBase AI · Session 8 Insight <span style={{ color: "#F59E0B", fontWeight: 600 }}>— Theta/Beta ratio not improving</span>
                </div>
                <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
                  θ/β Z-score has remained above 2.0 SD for the last 3 sessions (S6: +2.1, S7: +2.0, S8: +2.2). <strong style={{ color: "#F1F5F9" }}>74%</strong> of matched profiles (n=847) reached clinically significant improvement within 22 sessions after switching to Alpha-Theta.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setRecommendationApplied(true)}
                    style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", background: recommendationApplied ? "#10B981" : "#F59E0B", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                  >
                    {recommendationApplied ? "✓ Switched to Alpha-Theta" : `Switch ${demoClient.name.split(" ")[0]} to Alpha-Theta`}
                  </button>
                  <button onClick={() => setShowSimilarCasesModal(true)} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", background: "#1E293B", color: "#FCD34D", border: "1px solid #92400E", borderRadius: 6, cursor: "pointer" }}>
                    View 847 Similar Profiles
                  </button>
                  <button onClick={() => setStallAlertDismissed(true)} style={{ fontSize: 12, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>Dismiss</button>
                </div>
              </div>
            </div>
            )}

            {/* Reward trajectory */}
            <div style={{ ...card, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Reward Score Trajectory</h3>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120, position: "relative", paddingBottom: 4 }}>
                {/* Reference baseline at 50 */}
                <div style={{ position: "absolute", left: 0, right: 0, bottom: `${(50 / 100) * 116 + 4}px`, height: 1, borderTop: "1px dashed rgba(148,163,184,0.18)", pointerEvents: "none" }} />
                {SESSION_HISTORY.map((s) => (
                  <div key={s.session} onClick={() => setDetailModal({ type: "session", data: s as unknown as Record<string, unknown> })} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 4, cursor: "pointer", height: "100%" }}>
                    <div
                      title={`Session ${s.session}: ${s.reward.toFixed(1)} — click for details`}
                      style={{
                        width: "100%", borderRadius: "4px 4px 0 0",
                        background: `linear-gradient(180deg, ${s.reward >= 70 ? "#10B981" : s.reward >= 50 ? "#F59E0B" : "#EF4444"}, ${s.reward >= 70 ? "#6EE7B7" : s.reward >= 50 ? "#FCD34D" : "#FCA5A5"})`,
                        height: `${Math.max(2, (s.reward / 100) * 110)}px`,
                        transition: "transform 0.15s",
                        boxShadow: `0 0 8px ${s.reward >= 70 ? "rgba(16,185,129,0.4)" : s.reward >= 50 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.25)"}`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scaleY(1.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scaleY(1)")}
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
                    {[...SESSION_HISTORY].reverse().slice(0, 15).map((s) => (
                      <tr key={s.session} onClick={() => setDetailModal({ type: "session", data: s as unknown as Record<string, unknown> })} style={{ borderTop: "1px solid #334155", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#1E293B")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
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
                        <td style={{ padding: "10px 16px", fontVariantNumeric: "tabular-nums", color: s.phq9 <= 5 ? "#10B981" : s.phq9 <= 10 ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>{s.phq9}</td>
                        <td style={{ padding: "10px 16px", fontVariantNumeric: "tabular-nums", color: s.gad7 <= 5 ? "#10B981" : s.gad7 <= 10 ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>{s.gad7}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <button onClick={(e) => { e.stopPropagation(); switchTab("ai"); }} style={{ fontSize: 11, color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>AI Note</button>
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
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>AI Insights</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                EEGBase AI watches session data and flags when a client is stalled — then suggests the next protocol to try, compared against the EEGBase community registry. It also drafts clinical notes you can copy straight to your EHR.
              </p>
            </div>

            {/* AI is decision-support · not medical advice — clinical safety disclaimer */}
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 14, lineHeight: 1.4 }}>ℹ️</span>
              <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                <strong style={{ color: "#60A5FA", fontWeight: 700 }}>AI insights are decision-support tools, not medical advice.</strong> Every suggestion shown here is an aid to clinician judgment — not a replacement. The licensed clinician approves, modifies, or rejects every protocol change, every SOAP draft, and every risk flag before anything is saved to the client record. Models are trained on de-identified data from consenting EEGBase clinics and audited quarterly for bias. Powered by Claude Haiku 4.5 · OpenAI GPT-4o fallback.
              </div>
            </div>

            {/* Cross-session pattern detector — Mendi data + multi-modal correlation */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 24px -16px rgba(79,70,229,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cross-Session Pattern Detector</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginTop: 2 }}>What moved Sarah&apos;s prefrontal OxyHb up over the last 8 sessions?</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Auto-correlates Mendi fNIRS · check-in mood · sleep · HRV · medication adherence — surfaces the strongest drivers</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", padding: "3px 8px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>3 strong signals · p&lt;0.01</span>
              </div>

              {/* Top-3 correlations */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                {[
                  { driver: "Sleep efficiency (Oura)",  r: "+0.74", n: 8, dir: "up", note: "Sessions following ≥85% sleep efficiency saw +18% mean ΔHbO vs <85% nights" },
                  { driver: "Pre-session mood (check-in)", r: "+0.62", n: 8, dir: "up", note: "Days Sarah self-reported mood ≥7 produced higher reward score (mean 78 vs 61)" },
                  { driver: "Caffeine within 2 h",        r: "−0.58", n: 6, dir: "down", note: "Sessions after late caffeine showed elevated theta and lower OxyHb gain" },
                ].map((c) => (
                  <div key={c.driver} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.driver}</div>
                      <span style={{ fontSize: 14, color: c.dir === "up" ? "#34D399" : "#FCA5A5" }}>{c.dir === "up" ? "↑" : "↓"}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>r = {c.r}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 6 }}>n = {c.n} sessions · Spearman</div>
                    <div style={{ fontSize: 10, color: "#CBD5E1", lineHeight: 1.5 }}>{c.note}</div>
                  </div>
                ))}
              </div>

              {/* Mini correlation grid */}
              <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Multi-modal correlation matrix · last 8 sessions</div>
                <div style={{ display: "grid", gridTemplateColumns: "120px repeat(6, 1fr)", gap: 2, fontSize: 9, fontFamily: "ui-monospace, monospace" }}>
                  <div></div>
                  {["ΔHbO", "Reward", "Mood", "Sleep", "HRV", "Adherence"].map((h) => (
                    <div key={h} style={{ padding: 4, color: "#94A3B8", textAlign: "center", fontWeight: 700 }}>{h}</div>
                  ))}
                  {[
                    { label: "ΔHbO L (Mendi)",   vals: [1.00, 0.81, 0.62, 0.74, 0.41, 0.33] },
                    { label: "Reward Score",     vals: [0.81, 1.00, 0.55, 0.68, 0.47, 0.29] },
                    { label: "Mood (check-in)",  vals: [0.62, 0.55, 1.00, 0.51, 0.38, 0.44] },
                    { label: "Sleep efficiency", vals: [0.74, 0.68, 0.51, 1.00, 0.59, 0.22] },
                    { label: "HRV RMSSD",        vals: [0.41, 0.47, 0.38, 0.59, 1.00, 0.18] },
                    { label: "Med adherence",    vals: [0.33, 0.29, 0.44, 0.22, 0.18, 1.00] },
                  ].flatMap((row) => [
                    <div key={`${row.label}-label`} style={{ padding: "4px 6px", color: "#CBD5E1", fontWeight: 600 }}>{row.label}</div>,
                    ...row.vals.map((v, i) => {
                      const intensity = Math.abs(v);
                      const positive = v >= 0;
                      const bg = positive ? `rgba(52, 211, 153, ${intensity * 0.6})` : `rgba(239, 68, 68, ${intensity * 0.6})`;
                      return (
                        <div key={`${row.label}-${i}`} style={{ padding: 4, background: bg, color: intensity > 0.55 ? "#0F172A" : "#F1F5F9", textAlign: "center", borderRadius: 3, fontWeight: 700 }}>
                          {v.toFixed(2)}
                        </div>
                      );
                    }),
                  ])}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 11 }}>
                <button onClick={() => showToast("Recommended: 'Sleep-coupled session' — 8 AM start after ≥85% sleep efficiency. Auto-suggested calendar slots.")} style={{ ...clinicianBtnPrimary, background: "#7C3AED", fontSize: 12 }}>Apply finding to schedule →</button>
                <button onClick={() => showToast("Pattern saved to research registry · auto-tagged for Mendi science team review")} style={{ ...clinicianBtn, fontSize: 12 }}>Send to research registry</button>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#94A3B8" }}>Powered by Claude · only patterns at p&lt;0.05 surfaced</span>
              </div>
            </div>

            {/* AI Ambient Scribe */}
            <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", borderRadius: 16, padding: 22, marginBottom: 16, border: "1px solid #1E293B", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 36px -16px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #1E293B", flexWrap: "wrap" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.18)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)" }}>●</div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Ambient Session Scribe</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>Records audio with consent · drafts notes from transcript · 6 therapy-specific formats · Mentalyc/Upheal/DeepCura-class</div>
                </div>
                <button onClick={() => showToast("Recording started · client consent required (HIPAA)")} style={{ ...clinicianBtnPrimary, fontSize: 12, padding: "8px 16px", background: "#DC2626" }}>
                  ● Start Recording
                </button>
                <span style={{ fontSize: 11, color: "#34D399", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "pulse 1.5s infinite" }} />
                  Listening · 24:18
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="demo-grid-2">
                {/* Live transcript */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>Live Transcript</span>
                    <span style={{ color: "#64748B", fontWeight: 600 }}>147 lines · 91% conf</span>
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, maxHeight: 180, overflowY: "auto", paddingRight: 8 }}>
                    <div style={{ color: "#94A3B8", marginBottom: 6 }}><strong style={{ color: "#60A5FA" }}>Clinician (10:34):</strong> How has your sleep been since last week?</div>
                    <div style={{ color: "#CBD5E1", marginBottom: 6 }}><strong style={{ color: "#A78BFA" }}>Sarah (10:34):</strong> Better most nights. I&apos;ve been waking up around 4am still — maybe twice last week.</div>
                    <div style={{ color: "#94A3B8", marginBottom: 6 }}><strong style={{ color: "#60A5FA" }}>Clinician (10:35):</strong> Any change in your overall mood?</div>
                    <div style={{ color: "#CBD5E1", marginBottom: 6 }}><strong style={{ color: "#A78BFA" }}>Sarah (10:35):</strong> I think so. Less foggy in the mornings. Work feels less heavy.</div>
                    <div style={{ color: "#94A3B8", marginBottom: 6 }}><strong style={{ color: "#60A5FA" }}>Clinician (10:36):</strong> Are you still tracking your check-ins in the client app daily?</div>
                    <div style={{ color: "#CBD5E1", marginBottom: 6 }}><strong style={{ color: "#A78BFA" }}>Sarah (10:36):</strong> Most days. Missed two days last weekend when traveling.</div>
                    <div style={{ background: "rgba(239,68,68,0.12)", borderLeft: "2px solid #EF4444", padding: "4px 8px", marginBottom: 6, borderRadius: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#FCA5A5", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>⚠ Risk language detected</span>
                      <span style={{ color: "#CBD5E1" }}>...sometimes I feel like nothing matters but I&apos;d never...</span>
                    </div>
                    <div style={{ color: "#64748B", fontStyle: "italic" }}>— continuing transcription —</div>
                  </div>
                </div>

                {/* Auto-generated insights */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>AI-Extracted from Transcript</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11 }}>
                    {[
                      { tag: "Sleep", val: "Improved · waking 4am 2x/wk (was 5x)", color: "#10B981" },
                      { tag: "Mood", val: "Improved · less brain fog, work less heavy", color: "#10B981" },
                      { tag: "Adherence", val: "Mostly on · missed 2 check-ins (travel)", color: "#F59E0B" },
                      { tag: "Risk flag", val: "PHQ-9 item 9 phrasing — assess + document", color: "#EF4444" },
                      { tag: "CPT suggestion", val: "90901 (biofeedback) + 90875 (psychophys 30 min)", color: "#A78BFA" },
                      { tag: "Plan changes", val: "Continue Alpha-Theta · review sleep hygiene", color: "#60A5FA" },
                    ].map((i) => (
                      <div key={i.tag} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: i.color, padding: "2px 7px", background: `${i.color}1A`, border: `1px solid ${i.color}33`, borderRadius: 6, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{i.tag}</span>
                        <span style={{ color: "#CBD5E1", lineHeight: 1.5 }}>{i.val}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => showToast("SOAP note regenerated from current transcript")} style={{ ...clinicianBtnPrimary, fontSize: 11, padding: "8px 14px", width: "100%", marginTop: 12 }}>
                    Generate SOAP note from transcript
                  </button>
                </div>
              </div>

              {/* Note format selector — closes the Mentalyc/Upheal/ICANotes 6-format gap */}
              <div style={{ marginTop: 14, padding: "10px 12px", background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Note format · pick one — same transcript, different structure</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { fmt: "SOAP",  desc: "Subjective · Objective · Assessment · Plan",       active: true },
                    { fmt: "DAP",   desc: "Data · Assessment · Plan",                          active: false },
                    { fmt: "BIRP",  desc: "Behavior · Intervention · Response · Plan",         active: false },
                    { fmt: "GIRP",  desc: "Goal · Intervention · Response · Plan",             active: false },
                    { fmt: "PIE",   desc: "Problem · Intervention · Evaluation",               active: false },
                    { fmt: "SIRP",  desc: "Situation · Intervention · Response · Plan",        active: false },
                  ].map((f) => (
                    <button
                      key={f.fmt}
                      onClick={() => showToast(`Regenerated as ${f.fmt} · ${f.desc}`)}
                      style={{ fontSize: 10, padding: "5px 10px", background: f.active ? "rgba(167,139,250,0.18)" : "transparent", border: `1px solid ${f.active ? "#A78BFA" : "#1E293B"}`, color: f.active ? "#C4B5FD" : "#94A3B8", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}
                      title={f.desc}
                    >
                      {f.fmt} {f.active && "✓"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation analytics with fNIRS overlay — uniquely combines Upheal-style insight with Mendi data */}
              <div style={{ marginTop: 14, padding: 12, background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Conversation analytics · w/ fNIRS overlay</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#A78BFA", padding: "2px 7px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Unique combo</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                  {[
                    { k: "Clinician talk-time", v: "38%",  bar: 38,  color: "#60A5FA" },
                    { k: "Client talk-time",    v: "54%",  bar: 54,  color: "#A78BFA" },
                    { k: "Silence (reflective)", v: "8%",   bar: 8,   color: "#34D399" },
                    { k: "Tone (avg valence)",  v: "+0.42", bar: 70,  color: "#FCD34D" },
                  ].map((m) => (
                    <div key={m.k} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 3 }}>{m.k}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>{m.v}</div>
                      <div style={{ height: 3, background: "#1E293B", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${m.bar}%`, height: "100%", background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Topic timeline · prefrontal OxyHb overlay</div>
                  <svg viewBox="0 0 400 60" width="100%" height="60" style={{ display: "block" }}>
                    <defs><linearGradient id="oxyG" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5"/><stop offset="100%" stopColor="#A78BFA" stopOpacity="0"/></linearGradient></defs>
                    <path d="M 0,30 L 30,28 L 60,25 L 90,22 L 120,28 L 150,42 L 180,48 L 210,45 L 240,32 L 270,26 L 300,24 L 330,28 L 360,30 L 400,29 L 400,60 L 0,60 Z" fill="url(#oxyG)" />
                    <path d="M 0,30 L 30,28 L 60,25 L 90,22 L 120,28 L 150,42 L 180,48 L 210,45 L 240,32 L 270,26 L 300,24 L 330,28 L 360,30 L 400,29" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="150" y1="0" x2="150" y2="60" stroke="#EF4444" strokeWidth="0.8" strokeDasharray="3 3" />
                    <text x="155" y="10" fontSize="8" fill="#FCA5A5" fontWeight="700">Father topic introduced @ 12:15</text>
                  </svg>
                  <div style={{ fontSize: 10, color: "#CBD5E1", lineHeight: 1.5, marginTop: 6 }}>
                    Sarah&apos;s prefrontal OxyHb dropped <strong style={{ color: "#FCA5A5" }}>−0.28 μM</strong> when the topic shifted to her father at 12:15 — a stronger physiological reaction than self-reported. Auto-flagged for SOAP &quot;Plan&quot; section.
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol recommendation card */}
            <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", borderRadius: 16, padding: 24, marginBottom: 16, border: "1px solid #1E293B", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 36px -16px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124,58,237,0.18)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, border: "1px solid rgba(124,58,237,0.3)" }}>AI</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Protocol Recommendation Engine</span>
                <span style={{ marginLeft: "auto", fontSize: 11, background: "rgba(124,58,237,0.18)", color: "#A78BFA", borderRadius: 99, padding: "3px 10px", fontWeight: 600 }}>Session 8 of 20</span>
              </div>

              <div style={{ background: "#0A1320", borderRadius: 12, padding: "16px 20px", marginBottom: 14, borderLeft: "3px solid #F59E0B", border: "1px solid #1E293B", borderLeftWidth: 3, borderLeftColor: "#F59E0B" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Signal Detected · Stalled Progress</div>
                <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.65, marginBottom: 14 }}>
                  Sarah&apos;s <strong style={{ color: "#F1F5F9" }}>brain calmness score hasn&apos;t improved</strong> in 3 sessions, even though she&apos;s training consistently. The current protocol may not be enough to settle her elevated forehead activity.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }} className="demo-grid-3">
                  {[
                    { label: "Session 6", val: "+2.1 SD" },
                    { label: "Session 7", val: "+2.0 SD" },
                    { label: "Session 8", val: "+2.2 SD" },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: "#1E293B", borderRadius: 8, padding: "10px 12px", textAlign: "center", border: "1px solid #334155" }}>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#FCA5A5", fontVariantNumeric: "tabular-nums" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#0A1320", borderRadius: 12, padding: "16px 20px", marginBottom: 14, border: "1px solid #1E293B", borderLeft: "3px solid #10B981" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Recommendation</div>
                <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.65, marginBottom: 12 }}>
                  Try the <strong style={{ color: "#F1F5F9" }}>Alpha-Theta protocol</strong> for the next 3–4 sessions. Of <strong style={{ color: "#F1F5F9" }}>847 similar clients</strong>, <strong style={{ color: "#34D399" }}>74%</strong> reached clinically significant improvement within 22 sessions of switching. <span className="gloss" data-gloss="Trains slower brainwaves at the back of the head — Pz and Oz electrode positions, 8–12 Hz frequency.">Technical details</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setRecommendationApplied(true)}
                    style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px", background: recommendationApplied ? "#10B981" : "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
                  >
                    {recommendationApplied ? "✓ Switched to Alpha-Theta" : `Switch ${demoClient.name.split(" ")[0]} to Alpha-Theta`}
                  </button>
                  <button onClick={() => setShowSimilarCasesModal(true)} style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", background: "transparent", color: "#6EE7B7", border: "1px solid #059669", borderRadius: 8, cursor: "pointer" }}>
                    View 847 Similar Profiles
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
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>Session 8 · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Auto-generated from session data — edit before saving</p>
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
                { label: "A — Assessment", color: "#F59E0B", lines: ["Client engagement improving — reward score +52% from session 1 baseline (38.2).", "Theta/beta ratio stalled above normative range (>1.5 SD) across sessions 6–8 despite compliance.", "PHQ-9 depression score trending down from 18 \u2192 12 over 8 sessions — positive trajectory.", "Alpha-theta protocol switch indicated given stalled \u03b8/\u03b2 trajectory."] },
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
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Book appointments, send reminders, and view session history — all in one place. No need for a separate tool like Calendly or SimplePractice.
              </p>
            </div>

            {/* MENDI HOME-CONTINUITY BRIDGE */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 12px 36px -16px rgba(79,70,229,0.4)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 700, color: "#A5B4FC", background: "rgba(79,70,229,0.2)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(79,70,229,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mendi Home-Continuity</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(167,139,250,0.2)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: "1px solid rgba(167,139,250,0.3)" }}>↔</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Clinic ↔ Home Practice Bridge</div>
                  <div style={{ fontSize: 11, color: "#A5B4FC" }}>Push protocols to client&apos;s Mendi at home · sessions auto-flow back</div>
                </div>
              </div>

              {/* Visual flow: clinic → home → clinic */}
              <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.25)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 14, alignItems: "center" }}>
                  {/* Clinic */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, #2563EB, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 26, boxShadow: "0 4px 16px -4px rgba(79,70,229,0.5)" }}>🏥</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>Clinic Visit</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Session 8 · today</div>
                    <div style={{ fontSize: 9, color: "#A5B4FC", marginTop: 4, fontFamily: "ui-monospace, monospace" }}>Protocol: Focus Boost</div>
                  </div>
                  {/* Arrow → */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <svg width="48" height="20" viewBox="0 0 48 20"><defs><linearGradient id="arrowR" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient></defs><line x1="2" y1="10" x2="40" y2="10" stroke="url(#arrowR)" strokeWidth="2" strokeDasharray="4 3" /><polygon points="40,5 46,10 40,15" fill="#A78BFA" /></svg>
                    <span style={{ fontSize: 9, color: "#A78BFA", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Push</span>
                  </div>
                  {/* Home / Mendi */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 26, boxShadow: "0 4px 16px -4px rgba(167,139,250,0.5)", position: "relative" }}>
                      🧠
                      <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}>📱</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>Mendi at Home</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>3× / week, 12 min</div>
                    <div style={{ fontSize: 9, color: "#34D399", marginTop: 4, fontFamily: "ui-monospace, monospace" }}>Streaming live</div>
                  </div>
                  {/* Arrow ← */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <svg width="48" height="20" viewBox="0 0 48 20"><defs><linearGradient id="arrowL" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#10B981" /></linearGradient></defs><line x1="8" y1="10" x2="46" y2="10" stroke="url(#arrowL)" strokeWidth="2" strokeDasharray="4 3" /><polygon points="46,5 40,10 46,15" fill="none" /><polygon points="2,10 8,5 8,15" fill="#A78BFA" /></svg>
                    <span style={{ fontSize: 9, color: "#34D399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sync back</span>
                  </div>
                  {/* Next visit */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, #10B981, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 26, boxShadow: "0 4px 16px -4px rgba(16,185,129,0.4)" }}>📊</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>Next Visit</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Session 9 · May 12</div>
                    <div style={{ fontSize: 9, color: "#34D399", marginTop: 4, fontFamily: "ui-monospace, monospace" }}>+8 home sessions</div>
                  </div>
                </div>
              </div>

              {/* Home practice activity feed */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }} className="demo-grid-2">
                <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.25)", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Sarah&apos;s home practice this week</div>
                  {[
                    { day: "Mon", date: "May 5", duration: 12, score: 71, color: "#10B981" },
                    { day: "Wed", date: "May 7", duration: 14, score: 68, color: "#10B981" },
                    { day: "Thu", date: "May 8", duration: 10, score: 62, color: "#F59E0B" },
                    { day: "Sat", date: "May 10", duration: 0, score: 0, color: "#475569" },
                    { day: "Sun", date: "May 11", duration: 0, score: 0, color: "#475569" },
                  ].map((s) => (
                    <div key={s.day} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 11, borderTop: "1px solid #1E293B" }}>
                      <span style={{ color: "#94A3B8", width: 50, fontWeight: 600 }}>{s.day} {s.date}</span>
                      {s.duration > 0 ? (
                        <>
                          <span style={{ color: "#CBD5E1", width: 56, fontVariantNumeric: "tabular-nums" }}>{s.duration} min</span>
                          <div style={{ flex: 1, height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${s.score}%`, height: "100%", background: s.color, borderRadius: 2 }} />
                          </div>
                          <span style={{ color: s.color, fontWeight: 700, fontVariantNumeric: "tabular-nums", width: 30, textAlign: "right" }}>{s.score}</span>
                        </>
                      ) : (
                        <span style={{ color: "#475569", fontStyle: "italic", fontSize: 11 }}>upcoming</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.25)", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Adherence &amp; engagement</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: "Adherence", v: "78%", sub: "vs 22% consumer-only", c: "#34D399" },
                      { l: "Sessions/week", v: "3.2", sub: "target: 3+", c: "#34D399" },
                      { l: "Avg score", v: "67", sub: "Mendi norm: 58", c: "#10B981" },
                      { l: "Streak", v: "4 days", sub: "best: 12 days", c: "#F59E0B" },
                    ].map((m) => (
                      <div key={m.l} style={{ background: "rgba(15,23,42,0.7)", border: "1px solid #1E293B", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>{m.l}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: m.c, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{m.v}</div>
                        <div style={{ fontSize: 9, color: "#64748B", marginTop: 1 }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#A5B4FC", marginTop: 10, padding: "6px 8px", background: "rgba(79,70,229,0.1)", borderRadius: 6, lineHeight: 1.5 }}>
                    <strong style={{ color: "#A78BFA" }}>3.5×</strong> the adherence of consumer-only Mendi users. Clinic-prescribed users have 5–10× lower churn.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => showToast("Sent: Focus Boost protocol pushed to Sarah's Mendi · 3 sessions/week × 12 min")} style={{ ...clinicianBtnPrimary, background: "#7C3AED" }}>Push protocol to Mendi →</button>
                <button onClick={() => showToast("Message sent · Sarah will see it in the Mendi app")} style={clinicianBtn}>💬 Message via Mendi app</button>
                <button onClick={() => showToast("Home session video summary opening — Sarah's last training")} style={clinicianBtn}>View last home session</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(0, 1.2fr)", gap: 16, alignItems: "start" }} className="demo-schedule-grid">
              {/* Calendar */}
              <div style={{ ...card }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9" }}>May 2026</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => showToast("March 2026 · 23 sessions scheduled · 4 evals · 2 onboarding")} aria-label="Previous month" style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #334155", borderRadius: 6, background: "#1E293B", cursor: "pointer", color: "#CBD5E1" }}>‹</button>
                    <button onClick={() => showToast("May 2026 · 19 sessions scheduled · 1 eval · 3 onboarding")} aria-label="Next month" style={{ fontSize: 12, padding: "5px 10px", border: "1px solid #334155", borderRadius: 6, background: "#1E293B", cursor: "pointer", color: "#CBD5E1" }}>›</button>
                    <button onClick={() => showToast("New appointment · client · type · time · clinician · auto-suggests CPT 90901 + 90875")} style={{ fontSize: 12, padding: "5px 14px", border: "none", borderRadius: 6, background: "#2563EB", color: "white", cursor: "pointer", fontWeight: 600 }}>+ New</button>
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
                    const todayDate = new Date().getDate();
                    const isToday = day === todayDate;
                    const isSelected = selectedDay === day;
                    return (
                      <div key={day} onClick={() => { setSelectedDay(day); if (hasAppt) showToast(`May ${day} appointments highlighted on the right`); }} style={{
                        aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        background: isSelected ? "#2563EB" : "transparent",
                        border: isToday && !isSelected ? "2px solid #60A5FA" : isSelected ? "1px solid #3B82F6" : "1px solid transparent",
                        cursor: "pointer", fontSize: 13, fontWeight: isToday || isSelected ? 700 : 500,
                        color: isSelected ? "white" : isToday ? "#60A5FA" : "#CBD5E1",
                        position: "relative",
                        transition: "transform 0.1s, background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; if (!isSelected) e.currentTarget.style.background = "#1E293B"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      >
                        {day}
                        {hasAppt && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "white" : "#3B82F6", marginTop: 2 }} />}
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

                <div>
                  <div className="ios-section-header">Automated Reminders</div>
                  <div className="ios-list">
                    {([
                      { key: "sms" as const,    label: "24h SMS reminder",   sub: "Sent the day before" },
                      { key: "email" as const,  label: "1h email reminder",  sub: "Includes telehealth link" },
                      { key: "noshow" as const, label: "No-show follow-up",  sub: "Auto-rebook prompt within 1h" },
                      { key: "lapsed" as const, label: "Lapsed client check-in", sub: "After 14 days without a session" },
                    ]).map(({ key, label, sub }) => (
                      <label key={key} className="ios-list-row ios-list-row-tap" style={{ cursor: "pointer" }}>
                        <div className="ios-list-row-content">
                          <div className="ios-list-row-title">{label}</div>
                          <div className="ios-list-row-subtitle">{sub}</div>
                        </div>
                        <input
                          type="checkbox"
                          className="ios-toggle"
                          checked={reminderToggles[key]}
                          onChange={() => setReminderToggles((prev) => ({ ...prev, [key]: !prev[key] }))}
                          aria-label={label}
                        />
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #334155" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Sync to calendar</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["Google Calendar", "iCal"].map((cal) => (
                        <button key={cal} onClick={() => showToast(cal === "Google Calendar" ? "Connected to Google Calendar ✓" : "Calendar feed URL copied to clipboard")} style={{ fontSize: 11, fontWeight: 600, padding: "5px 10px", border: "1px solid #334155", borderRadius: 6, background: "#1E293B", cursor: "pointer", color: "#CBD5E1" }}>
                          {cal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing strip */}
            <div style={{ marginTop: 16, background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.15)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>$</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>Billing + CPT Codes <span style={{ color: "#10B981", fontWeight: 600 }}>— bundled, not bolted on</span></div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>After each session, EEGBase auto-generates a superbill with CPT 90901 (biofeedback), 97012, and E/M codes. Export to CMS-1500 or Stripe self-pay. Most neurofeedback platforms make you pair with a separate EHR — we don&apos;t.</div>
                </div>
                <button onClick={() => showToast("Superbill PDF generated · CMS-1500 + ICD-10 F90.0 · ready to print, email, or submit via Stedi")} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "7px 16px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
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
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                50+ evidence-based protocols organized by condition. Search, preview, and apply in one click — no more looking up papers or guessing electrode placement. Open library — clinicians can fork, customize, and contribute back.
              </p>
            </div>

            {/* Mendi-Optimized Protocols (pinned) */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 14, padding: 18, marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 24px -16px rgba(79,70,229,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(167,139,250,0.2)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, border: "1px solid rgba(167,139,250,0.3)" }}>M</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Mendi-Optimized Protocols</div>
                    <div style={{ fontSize: 11, color: "#A5B4FC" }}>10 prefrontal-training protocols designed specifically for Mendi&apos;s dual-channel fNIRS</div>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", padding: "3px 10px", background: "rgba(79,70,229,0.2)", borderRadius: 99, border: "1px solid rgba(79,70,229,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pinned · Mendi Native</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }} className="demo-grid-2">
                {[
                  { name: "Focus Boost",            target: "Fp1+Fp2 HbO ↑ · 12 min",     cite: "Yamashita 2021", color: "#60A5FA" },
                  { name: "Anxiety Reduction",      target: "R-DLPFC down-train",         cite: "Trambaiolli 2021", color: "#34D399" },
                  { name: "Depression Asymmetry",   target: "L &gt; R asymmetry training",  cite: "Ehlis 2014; Sutoko 2021", color: "#A78BFA" },
                  { name: "ADHD Inhibitory Control",target: "Sustained Fp1 HbO upregulation", cite: "Marx 2015", color: "#F59E0B" },
                  { name: "Burnout Recovery",       target: "DLPFC reactivation",         cite: "KU Leuven 2026", color: "#10B981" },
                  { name: "PTSD Hyperarousal",      target: "PFC down-regulation",        cite: "Kohl 2020", color: "#EC4899" },
                  { name: "Athletic Pre-Performance", target: "Approach motivation +",    cite: "Bishop 2022", color: "#06B6D4" },
                  { name: "Pediatric Focus (8–12)", target: "L-DLPFC sustained ↑",        cite: "Marx 2015", color: "#FBBF24" },
                  { name: "Executive Recovery (post-COVID)", target: "DLPFC + DMN balance", cite: "Pirkola 2024", color: "#A855F7" },
                  { name: "Meditation Deepening",   target: "Bilateral PFC quietening",   cite: "Tang 2015", color: "#8B5CF6" },
                ].map((p) => (
                  <button
                    key={p.name}
                    onClick={() => showToast(`${p.name} · loading Mendi-optimized protocol`)}
                    style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 10, padding: "10px 12px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, boxShadow: `0 0 8px ${p.color}`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }} dangerouslySetInnerHTML={{ __html: p.target }} />
                    </div>
                    <span style={{ fontSize: 9, color: "#64748B", fontStyle: "italic", whiteSpace: "nowrap" }}>{p.cite}</span>
                  </button>
                ))}
              </div>
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
                  desc: "Trains alpha at the client&apos;s individual peak frequency (typically 9–12 Hz) to maximize processing speed and attentional control. Popular with elite athletes, executives, and musicians.",
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
                    <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>No protocols match &ldquo;{protocolSearch}&rdquo;</div>
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
                      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, marginBottom: 10 }}>{p.desc}</div>
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
                      {selectedProtocol !== p.id && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #334155", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRecommendationApplied(true); switchTab("session"); }}
                            style={{ fontSize: 12, fontWeight: 600, color: "#60A5FA", background: "none", border: "1px solid #334155", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
                          >
                            ▶ Apply to {demoClient.name.split(" ")[0]}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#94A3B8" }}>
                {(() => {
                  const proto = [
                    { condition: "ADHD", name: "Theta/Beta + SMR Training", tags: ["ADHD", "Focus", "Inattention"] },
                    { condition: "Trauma / PTSD", name: "Alpha-Theta (Peniston) Protocol", tags: ["PTSD", "Trauma", "Anxiety", "Addiction"] },
                    { condition: "Trauma / PTSD", name: "Infraslow Frequency (ILF) Training", tags: ["Trauma", "Dysregulation", "Autonomic"] },
                    { condition: "Sleep Disorders", name: "Sleep Spindle Enhancement", tags: ["Insomnia", "Sleep", "Memory"] },
                    { condition: "Anxiety", name: "Alpha Asymmetry Training (F4 > F3)", tags: ["Anxiety", "Depression", "Mood"] },
                    { condition: "Peak Performance", name: "Alpha Peak Frequency (APF) Optimization", tags: ["Athletes", "Peak Performance", "Focus", "Flow"] },
                  ];
                  const count = proto.filter((p) =>
                    !protocolSearch ||
                    p.condition.toLowerCase().includes(protocolSearch.toLowerCase()) ||
                    p.name.toLowerCase().includes(protocolSearch.toLowerCase()) ||
                    p.tags.some((t) => t.toLowerCase().includes(protocolSearch.toLowerCase()))
                  ).length;
                  return `Showing ${count} of 47 protocols`;
                })()} — full library includes ILF variants, LORETA-guided, gamma training, neuromuscular (TBI), and pediatric protocols.
              </span>
              <button
                onClick={() => setProtocolSearch("")}
                style={{ fontSize: 13, color: "#60A5FA", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0, whiteSpace: "nowrap" }}
              >
                Browse full library →
              </button>
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Mendi Outcomes Registry */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 18, padding: 24, marginBottom: 20, boxShadow: "0 12px 36px -16px rgba(79,70,229,0.4)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 700, color: "#A5B4FC", background: "rgba(79,70,229,0.2)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(79,70,229,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mendi Co-Published</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(79,70,229,0.25)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid rgba(79,70,229,0.4)" }}>📊</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Outcomes Registry</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em" }}>Real-world Mendi outcomes — anonymized &amp; opt-in</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, marginBottom: 16 }}>
                Aggregate, de-identified, BIDS-compatible. Generates the peer-reviewed clinical evidence Mendi has been waiting for. Direct export pipeline to Mendi&apos;s science team.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-4">
                {[
                  { label: "Sessions", val: "47,213", sub: "across 412 clinics" },
                  { label: "Mean ΔHbO", val: "+12.3%", sub: "20-session, d=0.71" },
                  { label: "ADHD-RS", val: "−8.1 pts", sub: "n=2,840 · d=0.62 · p<0.001" },
                  { label: "Burnout (KU Leuven)", val: "−18.7%", sub: "MBI-EE · d=0.84 · n=87" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              {/* Pre-print citation + Co-author CTA + Registry IP */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginBottom: 14 }} className="demo-grid-2">
                <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 6px", background: "rgba(251,191,36,0.15)", borderRadius: 99 }}>Pre-print</span>
                    <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>doi.org/10.31234/osf.io/8h2k4</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#F1F5F9", fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}>
                    Home-use fNIRS neurofeedback in adolescent ADHD: a 412-clinic naturalistic registry (n=2,840)
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5, marginBottom: 6 }}>
                    Chen J., Reyes M., Patel M., et al. · Submitted to <em style={{ color: "#A5B4FC" }}>Frontiers in Human Neuroscience</em> · under review
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => showToast("Pre-print PDF · 24 pages · OSF mirror")} style={{ fontSize: 10, padding: "4px 10px", background: "rgba(167,139,250,0.15)", color: "#C4B5FD", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Download pre-print ↓</button>
                    <button onClick={() => showToast("Citation copied · BibTeX & APA")} style={{ fontSize: 10, padding: "4px 10px", background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Copy citation</button>
                  </div>
                </div>
                <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(15,23,42,0.6))", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#C4B5FD", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Co-author with Mendi</div>
                    <div style={{ fontSize: 12, color: "#F1F5F9", fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
                      12-week multi-clinic registry · IRB-pack ready
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5, marginBottom: 8 }}>
                      Pre-registered protocol · DSMB template · IRB packet · BIDS export pipeline. Mendi listed as instrument provider; first author rotates per cohort.
                    </div>
                  </div>
                  <button onClick={() => showToast("Mendi science team intro · IRB pack & DPA email queued")} style={{ fontSize: 11, padding: "6px 12px", background: "#7C3AED", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>Open IRB packet →</button>
                </div>
              </div>

              {/* Registry IP / governance note */}
              <div style={{ marginBottom: 8, padding: "8px 12px", background: "rgba(15,23,42,0.55)", border: "1px solid #1E293B", borderRadius: 8, fontSize: 10, color: "#94A3B8", lineHeight: 1.55 }}>
                <strong style={{ color: "#A5B4FC", fontWeight: 700 }}>Registry IP &amp; data governance:</strong> de-identified per HIPAA Safe Harbor + Expert Determination · clinic-level opt-in with revocable consent · joint stewardship between EEGBase, contributing clinics, and Mendi · embargo &amp; pre-publication review per signed DUA · raw waveforms remain at site-of-origin.
              </div>
              <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, fontSize: 10, color: "#86EFAC", lineHeight: 1.55, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#34D399", padding: "2px 7px", background: "rgba(34,197,94,0.15)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>Q3 2026</span>
                <span><strong style={{ color: "#34D399", fontWeight: 700 }}>Sham-controlled RCT in flight:</strong> n=180 ADHD adolescents · 3-arm (active / sham / waitlist) · pre-registered on ClinicalTrials.gov NCT06912xxx · IRB approved Apr 2026.</span>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => showToast("BIDS-compatible JSON export queued · sending to Mendi science team")} style={{ ...clinicianBtnPrimary, background: "#7C3AED" }}>Export to Mendi Science Team →</button>
                <button onClick={() => showToast("Filter outcomes by condition, age, region, protocol")} style={clinicianBtn}>Filter registry</button>
                <button onClick={() => showToast("View 14 active research studies using EEGBase + Mendi data")} style={clinicianBtn}>Active studies (14)</button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>One-Click Shareable Progress Reports</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Generate plain-English progress reports for clients, parents, or referring physicians. No data export or Word document needed — branded PDF in one click. Among modern cloud-based neurofeedback platforms, this branded one-click format is uncommon.
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
                    <div style={{ fontSize: 13, opacity: 0.8 }}>Client: {demoClient.name} · Sessions 1–20 · Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
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
                    { label: "Reward score", val: "+131%", sub: "38.2 → 88.0 avg", color: "#10B981" },
                    { label: "PHQ-9 (depression)", val: "18 → 5", sub: "72% improvement", color: "#10B981" },
                    { label: "GAD-7 (anxiety)", val: "14 → 4", sub: "71% improvement", color: "#10B981" },
                  ].map(({ label, val, sub, color }, i) => (
                    <div key={label} style={{ textAlign: "center", padding: 16, background: "#F8FAFC", borderRadius: 12, animation: `statPop 0.45s ease ${i * 0.1}s both` }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 2, whiteSpace: "nowrap" }}>{val}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plain-English summary */}
              <div style={{ padding: "24px 32px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Progress Summary — Plain Language</div>
                {[
                  { bullet: "•", text: "Sarah has completed 20 of 30 planned sessions with excellent attendance (95% show rate). She has made strong progress on the primary treatment goals." },
                  { bullet: "•", text: "Her brain training reward score has increased by 131% since the first session (38.2 \u2192 88.0), indicating meaningfully better ability to produce the target brainwave pattern (sensorimotor rhythm, 12\u201315 Hz)." },
                  { bullet: "•", text: "Depression symptoms (PHQ-9) have decreased from moderately severe (18) to minimal (5). Anxiety symptoms (GAD-7) have decreased from moderate (14) to minimal (4)." },
                  { bullet: "Note", text: "Frontal theta activity remains above the normal range for her age group. The AI has recommended a protocol adjustment (alpha-theta training) starting session 9, which we have implemented." },
                  { bullet: "•", text: "Projected outcome at 30 sessions: PHQ-9 \u2264 4 (minimal depression), reward score \u2265 90 (above target consistently), based on trajectory and community database comparison." },
                ].map(({ bullet, text }, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                    {bullet === "Note" ? (
                      <span style={{ fontSize: 11, flexShrink: 0, fontWeight: 700, color: "#92400E", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 6, padding: "2px 8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Note</span>
                    ) : (
                      <span style={{ fontSize: 13, flexShrink: 0, fontWeight: 400, color: "#9CA3AF" }}>{bullet}</span>
                    )}
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
            <div style={{ marginTop: 16, background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>EHR Integration <span style={{ color: "#10B981", fontWeight: 600 }}>— sync neurofeedback signal data, not just notes</span></div>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>Session notes and progress data sync directly to your EHR — no copy-paste. Select your platform:</p>
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
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Compiled May 2026 from platform docs, clinician reviews, and NeuroBB forums. EEGBase is the only platform that covers every layer — live signal, QEEG, AI, clinical workflow, practice management — in one open-source web app.
              </p>
            </div>

            {/* Why EEGBase summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} className="demo-grid-2">
              {[
                { label: "fNIRS + EEG + HRV in one app", sub: "Most platforms cover one modality; we unify all three with native Mendi support", color: "#06B6D4" },
                { label: "AI cross-session pattern detector", sub: "Correlates Mendi data with sleep · mood · HRV · adherence — flags drivers", color: "#A855F7" },
                { label: "Free OSS · or $19/session up", sub: "Legacy platforms: $95–650/mo + $2–6k upfront. We&apos;re open-source.", color: "#10B981" },
                { label: "Browser-based · No install", sub: "Cloud-native — no Windows-only requirement, no per-machine licenses", color: "#F59E0B" },
              ].map(({ label, sub, color }) => (
                <div key={label} style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -16px rgba(0,0,0,0.5)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginBottom: 10, boxShadow: `0 0 12px ${color}` }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4, lineHeight: 1.35, letterSpacing: "-0.01em" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.55 }}>{sub}</div>
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
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 920 }}>
                  <thead>
                    <tr style={{ background: "#1E293B", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", minWidth: 220, position: "sticky", left: 0, background: "#1E293B" }}>Feature</th>
                      {COMPETITORS.map((c) => (
                        <th key={c.key} onClick={() => !c.highlight && setDetailModal({ type: "competitor", data: c as unknown as Record<string, unknown> })} style={{
                          padding: "12px 12px", textAlign: "center", fontSize: 11, fontWeight: 700,
                          color: c.highlight ? "#60A5FA" : "#94A3B8",
                          background: c.highlight ? "rgba(30,58,138,0.3)" : undefined,
                          minWidth: 90,
                          cursor: c.highlight ? "default" : "pointer",
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
                        <React.Fragment key={f.feature}>
                          {showCat && (
                            <tr>
                              <td colSpan={COMPETITORS.length + 1} style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", background: "#243148", borderTop: i > 0 ? "2px solid #334155" : undefined }}>
                                {f.category}
                              </td>
                            </tr>
                          )}
                          <tr style={{ borderTop: "1px solid #334155", background: i % 2 === 0 ? "#0F172A" : "#131C2E" }}>
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
                        </React.Fragment>
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
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BILLING & CLAIMS ── */}
        {tab === "billing" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Billing &amp; Insurance Claims</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Auto-generate CMS-1500 claims and superbills from session data. Submit electronically to Office Ally / Apex EDI clearinghouse. Track claim status, post ERAs, and manage patient statements — without leaving EEGBase.
              </p>
            </div>

            {/* EEGBase pricing strip — 3 tiers per CRO research (158% lift vs 5 tiers) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: billingPeriod === "monthly" ? "#F1F5F9" : "#94A3B8", fontWeight: 700 }}>Monthly</span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                aria-label={`Switch to ${billingPeriod === "monthly" ? "annual" : "monthly"} billing`}
                style={{ position: "relative", width: 42, height: 22, borderRadius: 99, background: billingPeriod === "annual" ? "#10B981" : "#334155", border: "none", cursor: "pointer", padding: 0, transition: "background 0.2s" }}
              >
                <span style={{ position: "absolute", top: 2, left: billingPeriod === "annual" ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
              <span style={{ fontSize: 11, color: billingPeriod === "annual" ? "#F1F5F9" : "#94A3B8", fontWeight: 700 }}>Annual <span style={{ color: "#34D399", fontWeight: 800, marginLeft: 4 }}>save 17%</span></span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 14 }} className="demo-grid-3">
              {[
                {
                  tier: "Solo",
                  monthly: 19,
                  monthlyUnit: "/ session",
                  annual: 149,
                  annualUnit: "/ mo",
                  seats: "1 clinician · pay-per-session OR $149/mo",
                  ribbon: null,
                  color: "#10B981",
                  features: ["Live Session + co-feedback video", "AI Insights + ambient SOAP scribe", "BIDS / SNIRF / EDF+ export", "1 device pairing"],
                  excluded: ["Multi-clinician seats", "Insurance claims (CMS-1500)", "White-label"],
                },
                {
                  tier: "Practice",
                  monthly: 349,
                  monthlyUnit: "/ clinic / mo",
                  annual: 290,
                  annualUnit: "/ clinic / mo",
                  seats: "Up to 5 clinicians · unlimited clients",
                  ribbon: "Most popular",
                  color: "#3B82F6",
                  features: ["Everything in Solo", "Up to 5 clinicians", "CMS-1500 + ERA + claim tracking", "All 6 SOAP/DAP/BIRP formats", "Cross-session pattern detector", "Coaching marketplace seat", "Group + couples + family modes"],
                  excluded: ["White-label", "SSO + SAML", "Custom SLA"],
                },
                {
                  tier: "Enterprise",
                  monthly: 0,
                  monthlyUnit: "Custom",
                  annual: 0,
                  annualUnit: "Custom",
                  seats: "Unlimited seats · multi-location",
                  ribbon: "Mendi partners",
                  color: "#F59E0B",
                  features: ["Everything in Practice", "White-label / Mendi Clinical mode", "SSO + SAML + IP allowlist", "99.97% uptime SLA + dedicated CSM", "Multi-region · RTO 15 min", "Corporate wellness dashboard", "Custom DPA + 42 CFR Part 2"],
                  excluded: [],
                },
              ].map((p) => {
                const isMostPopular = p.ribbon === "Most popular";
                const displayPrice = p.tier === "Enterprise" ? "Custom" : (billingPeriod === "annual" ? `$${p.annual}` : `$${p.monthly}`);
                const displayUnit = p.tier === "Enterprise" ? p.monthlyUnit : (billingPeriod === "annual" ? p.annualUnit : p.monthlyUnit);
                return (
                  <div key={p.tier} style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: `${isMostPopular ? "2" : "1"}px solid ${p.ribbon ? p.color : "#1E293B"}`, borderRadius: 14, padding: 18, position: "relative", boxShadow: isMostPopular ? `0 8px 32px -16px ${p.color}` : "none" }}>
                    {p.ribbon && <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: "white", background: p.color, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{p.ribbon}</span>}
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{p.tier}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{displayPrice}<span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, marginLeft: 4 }}>{displayUnit}</span></div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12, minHeight: 32 }}>{p.seats}</div>
                    <button onClick={() => showToast(`Started ${p.tier} ${billingPeriod} trial · 30 days · no card`)} style={{ width: "100%", padding: "8px 12px", background: isMostPopular ? p.color : "transparent", color: isMostPopular ? "white" : p.color, border: `1px solid ${p.color}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 14 }}>
                      {p.tier === "Enterprise" ? "Talk to us" : "Start free trial"}
                    </button>
                    <div style={{ borderTop: "1px solid #1E293B", paddingTop: 12 }}>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                        {p.features.map((f) => (
                          <li key={f} style={{ fontSize: 11, color: "#CBD5E1", display: "flex", gap: 8, lineHeight: 1.5 }}>
                            <span style={{ color: "#34D399", flexShrink: 0, fontWeight: 700 }}>✓</span><span>{f}</span>
                          </li>
                        ))}
                        {p.excluded.map((f) => (
                          <li key={f} style={{ fontSize: 11, color: "#475569", display: "flex", gap: 8, lineHeight: 1.5 }}>
                            <span style={{ color: "#475569", flexShrink: 0 }}>—</span><span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, justifyContent: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#34D399", padding: "4px 10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 99 }}>30-day free trial · no card required</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", padding: "4px 10px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 99 }}>Mendi-attached clinics: 20% off Practice</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", padding: "4px 10px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 99 }}>HIPAA BAA · BIDS export · cancel anytime</span>
            </div>

            {/* Billing dashboard summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-4">
              {[
                { label: "Submitted YTD", value: "$48,250", sub: "126 claims", color: "#3B82F6" },
                { label: "Paid (current AR)", value: "$41,830", sub: "87% collection rate", color: "#10B981" },
                { label: "Pending", value: "$4,120", sub: "8 claims awaiting", color: "#F59E0B" },
                { label: "Denied (action req)", value: "$2,300", sub: "3 claims · resubmit", color: "#EF4444" },
              ].map((s) => (
                <div key={s.label} style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 12, padding: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent claims table */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Recent Claims</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => showToast("Generating CMS-1500 form for Sarah Mitchell · Session 8")} style={clinicianBtnPrimary}>+ New Claim</button>
                  <button onClick={() => showToast("ERA payment posted: $1,240 across 4 claims")} style={clinicianBtn}>Post ERA</button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#1E293B", borderBottom: "1px solid #334155" }}>
                      {["Claim #", "Date", "Client", "CPT", "Diagnosis", "Amount", "Payer", "Status"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "CL-2026-0124", date: "May 5", client: "Sarah Mitchell",  cpt: "90901", dx: "F90.0", amt: "$185", payer: "BCBS",      status: "Paid",        color: "#10B981" },
                      { id: "CL-2026-0123", date: "May 4", client: "James Okafor",    cpt: "90901", dx: "F41.1", amt: "$185", payer: "Aetna",     status: "Submitted",   color: "#3B82F6" },
                      { id: "CL-2026-0122", date: "May 4", client: "Priya Sharma",    cpt: "95816", dx: "Z00.00",amt: "$420", payer: "United",    status: "Pending info",color: "#F59E0B" },
                      { id: "CL-2026-0121", date: "May 3", client: "Daniel Cruz",     cpt: "90875", dx: "F43.10",amt: "$235", payer: "Cigna",     status: "Paid",        color: "#10B981" },
                      { id: "CL-2026-0120", date: "May 2", client: "Emily Tanaka",    cpt: "90901", dx: "G93.3", amt: "$185", payer: "Medicare",  status: "Denied",      color: "#EF4444" },
                      { id: "CL-2026-0119", date: "May 1", client: "Sarah Mitchell",  cpt: "90901", dx: "F90.0", amt: "$185", payer: "BCBS",      status: "Paid",        color: "#10B981" },
                    ].map((c) => (
                      <tr key={c.id} style={{ borderTop: "1px solid #334155", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.background = "#1E293B"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 14px", color: "#A5B4FC", fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{c.id}</td>
                        <td style={{ padding: "10px 14px", color: "#94A3B8" }}>{c.date}</td>
                        <td style={{ padding: "10px 14px", color: "#F1F5F9", fontWeight: 600 }}>{c.client}</td>
                        <td style={{ padding: "10px 14px", color: "#94A3B8", fontFamily: "ui-monospace, monospace" }}>{c.cpt}</td>
                        <td style={{ padding: "10px 14px", color: "#94A3B8", fontFamily: "ui-monospace, monospace" }}>{c.dx}</td>
                        <td style={{ padding: "10px 14px", color: "#F1F5F9", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{c.amt}</td>
                        <td style={{ padding: "10px 14px", color: "#CBD5E1" }}>{c.payer}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: c.color, padding: "2px 8px", background: `${c.color}1A`, borderRadius: 99 }}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CPT code library + payer setup */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="demo-grid-2">
              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>CPT Code Library</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>Auto-suggested by AI based on session content</p>
                {[
                  { code: "90901", desc: "Biofeedback training, any modality", rate: "$185" },
                  { code: "90875", desc: "Psychophysiological therapy w/ biofeedback (20–30 min)", rate: "$235" },
                  { code: "90876", desc: "Psychophysiological therapy w/ biofeedback (45–50 min)", rate: "$285" },
                  { code: "95816", desc: "EEG awake & drowsy", rate: "$420" },
                  { code: "95957", desc: "Quantitative EEG (QEEG)", rate: "$385" },
                  { code: "96132", desc: "Neuropsych testing eval (first hour)", rate: "$340" },
                ].map((c) => (
                  <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderTop: "1px solid #1E293B" }}>
                    <code style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: "#A5B4FC", fontWeight: 700, width: 60 }}>{c.code}</code>
                    <div style={{ flex: 1, fontSize: 11, color: "#CBD5E1" }}>{c.desc}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", fontVariantNumeric: "tabular-nums" }}>{c.rate}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Payer Connections</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>Submit claims to 1,200+ payers via Office Ally / Apex EDI</p>
                {[
                  { name: "Blue Cross Blue Shield", id: "BCBS-FL-001", status: "Active", days: "12 day avg" },
                  { name: "Aetna", id: "AETNA-021", status: "Active", days: "15 day avg" },
                  { name: "United Healthcare", id: "UHC-441", status: "Active", days: "21 day avg" },
                  { name: "Cigna", id: "CIGNA-088", status: "Active", days: "10 day avg" },
                  { name: "Medicare", id: "MCR-CMS", status: "Active", days: "30 day avg" },
                ].map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", borderTop: "1px solid #1E293B" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{p.name}</div>
                      <code style={{ fontSize: 10, color: "#64748B", fontFamily: "ui-monospace, monospace" }}>{p.id}</code>
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>{p.days}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", padding: "2px 8px", background: "rgba(16,185,129,0.15)", borderRadius: 99 }}>{p.status}</span>
                  </div>
                ))}
                <button onClick={() => showToast("Connect payer · 270/271 real-time eligibility · Stedi or Office Ally · 4 supported clearinghouses")} style={{ ...clinicianBtn, width: "100%", marginTop: 12 }}>+ Connect Payer</button>
              </div>
            </div>

            {/* Headway-style managed billing pitch */}
            <div className="demo-flagship" style={{ marginTop: 16, background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 14, padding: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(167,139,250,0.2)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>$</div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>EEGBase Managed Billing <span style={{ fontWeight: 600, color: "#A78BFA" }}>(optional)</span></div>
                <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6 }}>We submit, follow up, and post ERAs for you. Biweekly guaranteed payouts (Headway model). Multi-state credentialing. <strong style={{ color: "#A78BFA" }}>5% of collected revenue</strong>, no upfront fees.</div>
              </div>
              <button onClick={() => showToast("Managed Billing · concierge claims team · 4% take rate · denials handled · ERA auto-posted")} style={clinicianBtnPrimary}>Learn more →</button>
            </div>
          </div>
        )}

        {/* ── TEAM & ROLES ── */}
        {tab === "team" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Team, Roles &amp; Supervision</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Multi-clinician practices with role-based access. Supervisors can join live sessions, co-sign trainee notes, and review caseload at a glance. SAML/SSO supported for clinics &gt; 5 seats.
              </p>
            </div>

            {/* Team roster */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Team Roster · 7 members</h3>
                <button onClick={() => showToast("Invite via email · roles: clinician / admin / billing / supervisor · 2FA enforced · audit-logged")} style={clinicianBtnPrimary}>+ Invite</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { name: "Dr. Jamie Chen, PhD", role: "Owner", license: "BCN, BCB", caseload: 24, color: "#A78BFA", status: "online" },
                  { name: "Dr. Maya Patel, PsyD", role: "Clinician", license: "LCSW, BCN", caseload: 18, color: "#60A5FA", status: "online" },
                  { name: "Dr. Marcus Reyes, MD", role: "Supervisor", license: "MD, Psychiatry", caseload: 12, color: "#10B981", status: "in session" },
                  { name: "Sarah Kim, LMFT-A", role: "Trainee", license: "LMFT-A (supervised)", caseload: 6, color: "#F59E0B", status: "online" },
                  { name: "Olivia Brooks, LCSW", role: "Clinician", license: "LCSW", caseload: 16, color: "#60A5FA", status: "offline" },
                  { name: "Tyler Zhang", role: "Front Desk", license: "—", caseload: 0, color: "#64748B", status: "online" },
                  { name: "Rita Alvarez", role: "Biller", license: "—", caseload: 0, color: "#EC4899", status: "online" },
                ].map((m) => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${m.color}33`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, position: "relative", flexShrink: 0 }}>
                      {m.name.split(" ").slice(-1)[0].slice(0, 1)}{m.name.split(" ")[0].replace("Dr.", "").trim().slice(0, 1)}
                      {m.status === "online" && <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#10B981", borderRadius: "50%", border: "2px solid #0A1320" }} />}
                      {m.status === "in session" && <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, background: "#F59E0B", borderRadius: "50%", border: "2px solid #0A1320" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{m.license}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: m.color, padding: "3px 10px", background: `${m.color}1A`, borderRadius: 99, border: `1px solid ${m.color}33` }}>{m.role}</span>
                    <div style={{ fontSize: 11, color: "#94A3B8", width: 100, textAlign: "right" }}>{m.caseload > 0 ? `${m.caseload} clients` : "—"}</div>
                    {m.status === "in session" && (
                      <button onClick={() => showToast(`Joining ${m.name.split(",")[0]}'s live session as supervisor`)} style={{ ...clinicianBtn, fontSize: 11, padding: "5px 10px" }}>Join Live</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Co-sign queue */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }} className="demo-grid-2">
              <div style={{ ...card }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Co-Sign Queue · 3 pending</h3>
                  <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>Action required</span>
                </div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>Trainee notes awaiting supervisor signature — required before insurance claim submission.</p>
                {[
                  { trainee: "Sarah Kim, LMFT-A", client: "Anonymous · TX-21", session: "Session 4 · May 5", note: "DAP note · 32 lines · ICD-10 F33.1" },
                  { trainee: "Sarah Kim, LMFT-A", client: "Anonymous · TX-22", session: "Session 7 · May 4", note: "SOAP note · 28 lines · ICD-10 F41.1" },
                  { trainee: "Sarah Kim, LMFT-A", client: "Anonymous · TX-19", session: "Session 12 · May 4", note: "DAP note · 41 lines · ICD-10 F90.0" },
                ].map((q) => (
                  <div key={q.session} style={{ padding: 12, background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{q.client}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{q.session}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>{q.trainee} · {q.note}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => showToast("Note approved & co-signed")} style={{ ...clinicianBtnPrimary, fontSize: 11, padding: "5px 12px" }}>Review &amp; Sign</button>
                      <button onClick={() => showToast("Note returned to trainee with comments")} style={{ ...clinicianBtn, fontSize: 11, padding: "5px 12px" }}>Return for revision</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Permission matrix */}
              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Role Permissions</h3>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>SCIM provisioning · SAML SSO supported</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr><th style={{ textAlign: "left", padding: "4px 0", color: "#94A3B8", fontWeight: 600 }}>Action</th><th style={{ color: "#A78BFA", fontWeight: 600 }}>O</th><th style={{ color: "#10B981", fontWeight: 600 }}>S</th><th style={{ color: "#60A5FA", fontWeight: 600 }}>C</th><th style={{ color: "#F59E0B", fontWeight: 600 }}>T</th><th style={{ color: "#EC4899", fontWeight: 600 }}>B</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { a: "View own client charts", p: ["✓","✓","✓","✓","—"] },
                      { a: "View all client charts", p: ["✓","✓","—","—","—"] },
                      { a: "Run live sessions", p: ["✓","✓","✓","✓","—"] },
                      { a: "Sign clinical notes", p: ["✓","✓","✓","—","—"] },
                      { a: "Submit claims", p: ["✓","—","—","—","✓"] },
                      { a: "Edit treatment plans", p: ["✓","✓","✓","—","—"] },
                      { a: "Co-sign trainee notes", p: ["✓","✓","—","—","—"] },
                      { a: "Manage team / billing", p: ["✓","—","—","—","—"] },
                    ].map((r) => (
                      <tr key={r.a} style={{ borderTop: "1px solid #1E293B" }}>
                        <td style={{ padding: "5px 0", color: "#CBD5E1" }}>{r.a}</td>
                        {r.p.map((v, i) => <td key={i} style={{ textAlign: "center", color: v === "✓" ? "#34D399" : "#475569", padding: "5px 0" }}>{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 9, color: "#64748B", marginTop: 8 }}>O=Owner · S=Supervisor · C=Clinician · T=Trainee · B=Biller</div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLIANCE ── */}
        {tab === "compliance" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Compliance &amp; Security</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Designed from day one for HIPAA, SOC 2, and GDPR. Every PHI access is logged. Encryption at rest and in transit. Optional regional data residency for EU and Canada clinics.
              </p>
            </div>

            {/* Compliance badge row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-4">
              {[
                { label: "HIPAA",   sub: "BAA available · audit-ready", status: "Compliant", color: "#10B981" },
                { label: "SOC 2 Type II", sub: "Audit completed Q1 2026", status: "Certified",  color: "#10B981" },
                { label: "GDPR",    sub: "EU data residency option",     status: "Compliant", color: "#10B981" },
                { label: "HITRUST CSF", sub: "Self-assessment 2026",     status: "In progress", color: "#F59E0B" },
              ].map((b) => (
                <div key={b.label} style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: `1px solid ${b.color}33`, borderRadius: 12, padding: 16, position: "relative" }}>
                  <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, color: b.color, padding: "2px 8px", background: `${b.color}1A`, borderRadius: 99 }}>{b.status}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${b.color}1A`, color: b.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, fontSize: 16, fontWeight: 700, border: `1px solid ${b.color}33` }}>✓</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.01em" }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{b.sub}</div>
                </div>
              ))}
            </div>

            {/* Audit log + data residency */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 16 }} className="demo-grid-2">
              <div style={{ ...card }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Audit Log · last 24h</h3>
                  <button onClick={() => showToast("Full audit log exported as CSV")} style={clinicianBtn}>Export CSV</button>
                </div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>Every PHI access tracked per HIPAA Security Rule §164.312(b). 7-year retention.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
                  {[
                    { t: "10:42 AM", who: "Dr. Jamie Chen", action: "Viewed client chart", target: "Sarah Mitchell", ip: "192.168.1.42" },
                    { t: "10:38 AM", who: "Dr. Jamie Chen", action: "Started session",     target: "Sarah Mitchell · Session 8", ip: "192.168.1.42" },
                    { t: "10:35 AM", who: "Rita Alvarez",   action: "Submitted claim",     target: "CL-2026-0124", ip: "192.168.1.51" },
                    { t: "09:28 AM", who: "Sarah Kim",     action: "Edited SOAP note",    target: "Anonymous TX-21 Session 4", ip: "192.168.1.66" },
                    { t: "09:15 AM", who: "Dr. Marcus Reyes", action: "Co-signed note",   target: "Anonymous TX-22 Session 7", ip: "192.168.1.62" },
                    { t: "09:01 AM", who: "Olivia Brooks",  action: "Viewed client chart", target: "James Okafor", ip: "73.221.18.4 (off-site)" },
                    { t: "08:54 AM", who: "Dr. Maya Patel", action: "Generated PDF report", target: "Priya Sharma", ip: "192.168.1.45" },
                    { t: "08:21 AM", who: "system", action: "Daily encrypted backup",   target: "All PHI · 14.2 GB", ip: "—" },
                    { t: "Yesterday", who: "Tyler Zhang",   action: "Booked appointment",  target: "Daniel Cruz · May 6", ip: "192.168.1.31" },
                  ].map((e, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#0A1320", border: "1px solid #1E293B", borderRadius: 8, fontSize: 11 }}>
                      <span style={{ color: "#64748B", fontFamily: "ui-monospace, monospace", width: 70, fontSize: 10 }}>{e.t}</span>
                      <span style={{ color: "#F1F5F9", fontWeight: 600, width: 130 }}>{e.who}</span>
                      <span style={{ color: "#94A3B8", flex: 1 }}>{e.action} · <strong style={{ color: "#CBD5E1" }}>{e.target}</strong></span>
                      <span style={{ color: e.ip.includes("off-site") ? "#F59E0B" : "#475569", fontFamily: "ui-monospace, monospace", fontSize: 10 }}>{e.ip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>Data Residency</h3>
                {[
                  { region: "United States", primary: true, info: "us-east-1 · AWS · Tier IV · RTO 15 min · RPO 5 min · cross-AZ failover tested monthly", flag: "🇺🇸", note: null },
                  { region: "European Union", primary: false, info: "eu-west-3 · Frankfurt · GDPR-compliant · RTO 30 min · RPO 5 min", flag: "🇪🇺", note: "Schrems II compliant · EU SCCs (2021/914) on file · no transatlantic transfers without DPA" },
                  { region: "Canada", primary: false, info: "ca-central-1 · PHIPA-compliant · RTO 30 min · RPO 5 min", flag: "🇨🇦", note: null },
                ].map((r) => (
                  <div key={r.region} style={{ padding: 10, background: r.primary ? "rgba(96,165,250,0.08)" : "#0A1320", border: `1px solid ${r.primary ? "#3B82F6" : "#1E293B"}`, borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{r.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{r.region}</div>
                        <div style={{ fontSize: 10, color: "#64748B" }}>{r.info}</div>
                      </div>
                      {r.primary && <span style={{ fontSize: 9, fontWeight: 700, color: "#60A5FA", padding: "2px 8px", background: "rgba(96,165,250,0.15)", borderRadius: 99 }}>Primary</span>}
                    </div>
                    {r.note && (
                      <div style={{ marginTop: 8, padding: "6px 8px", background: "rgba(15,23,42,0.6)", borderRadius: 6, fontSize: 10, color: "#94A3B8", lineHeight: 1.5 }}>
                        <span style={{ color: "#34D399", fontWeight: 700 }}>✓</span> {r.note}
                      </div>
                    )}
                  </div>
                ))}

                {/* Regulatory + accessibility posture pills */}
                <div className="ios-section-header" style={{ marginTop: 18, padding: "0 0 8px" }}>Regulatory &amp; Accessibility Posture</div>

                {/* Future certifications roadmap */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#FCD34D", padding: "3px 9px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99 }}>ONC HIT 2025 Edition · target Q1 2027</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#FCD34D", padding: "3px 9px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99 }}>EPCS / PDMP via DrFirst · target Q4 2026</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#FCD34D", padding: "3px 9px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99 }}>USCDI+ Behavioral Health · ONC pilot Q2 2026</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#FCD34D", padding: "3px 9px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99 }}>FHIR R4 SMART-on-FHIR · Q3 2026</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#FCD34D", padding: "3px 9px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99 }}>42 CFR Part 2 (SUD records) · Q4 2026</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div style={{ padding: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", padding: "2px 7px", background: "rgba(34,197,94,0.15)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>FDA · CE</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>General Wellness · 21 CFR § 1140</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.55 }}>
                      EEGBase is a software platform — not a 510(k) device. Mendi headset is FDA general-wellness · CE-marked Class I. No diagnostic claims · clinician-supervised use.
                    </div>
                  </div>
                  <div style={{ padding: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#60A5FA", padding: "2px 7px", background: "rgba(59,130,246,0.15)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>WCAG 2.2 AA</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>VPAT · Section 508</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.55 }}>
                      Audited by Deque Systems · Q1 2026. Full keyboard nav, screen-reader labels, 4.5:1 contrast, captions on all video. VPAT 2.4 PDF on request.
                    </div>
                  </div>
                </div>

                <div className="ios-section-header" style={{ marginTop: 12, padding: "0 0 8px" }}>Compliance Documents</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                  {[
                    { label: "SOC 2 Type II report",        sub: "Audited Mar 2026 · Coalfire",     gated: true },
                    { label: "Pen-test attestation",        sub: "Bishop Fox · Q1 2026",            gated: true },
                    { label: "HIPAA risk assessment",       sub: "Updated Apr 2026",                gated: false },
                    { label: "GDPR DPA + EU SCCs",          sub: "Schrems II module · 2021/914",    gated: false },
                  ].map((d) => (
                    <button
                      key={d.label}
                      onClick={() => showToast(d.gated ? `${d.label} — NDA required. Mutual NDA sent to your inbox.` : `${d.label} — opening PDF`)}
                      style={{ textAlign: "left", padding: "10px 12px", background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{d.label}</span>
                        {d.gated && <span style={{ fontSize: 8, fontWeight: 700, color: "#FCD34D", padding: "1px 5px", background: "rgba(245,158,11,0.15)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.04em" }}>NDA</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>{d.sub}</div>
                      <div style={{ fontSize: 10, color: "#60A5FA", marginTop: 2 }}>{d.gated ? "Request access ↗" : "Download PDF ↓"}</div>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 14, padding: 12, background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,23,42,0.6))", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>P0 Incident Response SLA</div>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#34D399", fontWeight: 700 }}>Live</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: 10 }}>
                    <div><div style={{ color: "#94A3B8" }}>Acknowledgment</div><div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13 }}>≤ 15 min</div></div>
                    <div><div style={{ color: "#94A3B8" }}>Mitigation</div><div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13 }}>≤ 4 hours</div></div>
                    <div><div style={{ color: "#94A3B8" }}>Public RCA</div><div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13 }}>≤ 5 days</div></div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, color: "#64748B" }}>
                    status.eegbase.com · 99.97% rolling 90-day uptime · breach notification within 72 h per GDPR Art. 33
                  </div>
                </div>
                <div className="ios-section-header" style={{ marginTop: 18, padding: "0 0 8px" }}>Security Settings</div>
                <div className="ios-list">
                  {[
                    { label: "2FA enforced for all users", sub: "All clinicians + staff",        on: true },
                    { label: "SAML / SSO",                  sub: "Okta, Google Workspace",        on: true },
                    { label: "Auto-logout after idle",      sub: "Session ends after 15 minutes", on: true },
                    { label: "Encryption at rest",          sub: "AES-256 across all PHI",        on: true },
                    { label: "TLS 1.3 in transit",          sub: "Forward secrecy enforced",      on: true },
                    { label: "IP allowlist",                sub: "Restrict to clinic networks",   on: false },
                  ].map((s) => (
                    <label key={s.label} className="ios-list-row ios-list-row-tap" style={{ cursor: "pointer" }}>
                      <div className="ios-list-row-content">
                        <div className="ios-list-row-title">{s.label}</div>
                        <div className="ios-list-row-subtitle">{s.sub}</div>
                      </div>
                      <input type="checkbox" className="ios-toggle" defaultChecked={s.on} aria-label={s.label} />
                    </label>
                  ))}
                </div>
                <div className="ios-section-footer">Changes apply immediately and are logged to the audit trail.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── MARKETING ── */}
        {tab === "marketing" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Marketing &amp; Growth</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Branded white-label client experience. Public booking page, referral program with QR codes, Psychology Today directory sync, and email drip campaigns — all built in.
              </p>
            </div>

            {/* Reach pills: languages, mobile, accessibility */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", padding: "4px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>🌐</span> 8 languages · EN · ES · FR · DE · PT-BR · IT · NL · SV
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", padding: "4px 10px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>📱</span> iOS &amp; Android client apps · public booking on web
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399", padding: "4px 10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>♿</span> WCAG 2.2 AA · Section 508 · VPAT
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FCD34D", padding: "4px 10px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>⚡</span> Avg time to first session · 6 min
              </span>
            </div>

            {/* WHITE-LABEL TOGGLE — Mendi B2B story (this is the big one) */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 24px -16px rgba(79,70,229,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>White-label · Mendi Clinical mode</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginTop: 2 }}>Rebrand the entire clinical platform as &ldquo;Mendi Clinical&rdquo; — Mendi&apos;s B2B SaaS arm</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>One toggle hides EEGBase branding · applies Mendi logo / palette / domain · Mendi keeps the customer relationship</div>
                </div>
                <a href="/mendi-clinical-preview" target="_blank" rel="noopener noreferrer" style={{ ...clinicianBtnPrimary, fontSize: 12, background: "#7C3AED", textDecoration: "none", display: "inline-block" }}>Preview Mendi Clinical →</a>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "Branding",       val: "Full",     sub: "Logo · colors · domain · email" },
                  { label: "Mendi rev share", val: "60% / 40%", sub: "Mendi gets majority of clinic SaaS ARR" },
                  { label: "Engineering",    val: "0 hrs",    sub: "Theme switcher only · no fork" },
                  { label: "Time-to-launch", val: "2 weeks",  sub: "DPA + co-mark + DNS · done" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* COACHING MARKETPLACE — closes Myndlift's #1 moat */}
            <div style={{ ...card, marginBottom: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Clinician-in-loop coaching marketplace</h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Mendi at-home users can pay for a licensed clinician to review data weekly + adjust protocol · Myndlift charges $150/mo for this</p>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#FCD34D", padding: "3px 8px", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Q3 2026 · Beta</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { tier: "Self-guided",  price: "Included",   sub: "AI insights · no human review",     color: "#64748B" },
                  { tier: "Coaching",     price: "$79/mo",    sub: "Weekly clinician review · email",   color: "#3B82F6" },
                  { tier: "Coaching+",    price: "$149/mo",   sub: "Bi-weekly video + protocol updates", color: "#A78BFA" },
                ].map((t) => (
                  <div key={t.tier} style={{ background: "#0A1320", border: `1px solid ${t.color}40`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.tier}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", marginTop: 2 }}>{t.price}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{t.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: "6px 10px", background: "rgba(15,23,42,0.5)", borderRadius: 6, fontSize: 10, color: "#64748B" }}>
                Mendi gets 30% of coaching revenue · clinicians keep 60% · 10% platform fee · payouts via Stripe Connect
              </div>
            </div>

            {/* CORPORATE WELLNESS — Divergence's territory */}
            <div style={{ ...card, marginBottom: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Corporate wellness · workforce deployment</h3>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#06B6D4", padding: "3px 8px", background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.35)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cohort mode</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "Active employees", val: "284", sub: "of 320 enrolled · 89% activation" },
                  { label: "Avg sessions / wk", val: "3.2", sub: "vs 1.4 in self-guided cohorts" },
                  { label: "Burnout (MBI-EE)",  val: "−14%", sub: "12-week cohort · n=180" },
                  { label: "ROI · sick-day reduction", val: "$4.20", sub: "per $1 spent on Mendi-clinic program" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOBILE APP PREVIEW — closes Myndlift's #2 moat */}
            <div style={{ ...card, marginBottom: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Patient mobile app · iOS &amp; Android</h3>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#A78BFA", padding: "3px 8px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Q3 2026</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { name: "Pair Mendi",      icon: "🔗", sub: "BLE auto-pair · 1.4s reconnect" },
                  { name: "Daily check-in",  icon: "📝", sub: "Mood · sleep · meds · 30 sec" },
                  { name: "Streak + reward", icon: "🔥", sub: "Gamified · matches Mendi UX" },
                  { name: "Share with clinician", icon: "👥", sub: "1-tap · revocable consent" },
                ].map((f) => (
                  <div key={f.name} style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{f.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>{f.name}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", lineHeight: 1.5 }}>{f.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: "6px 10px", background: "rgba(15,23,42,0.5)", borderRadius: 6, fontSize: 10, color: "#64748B" }}>
                React Native · published to App Store + Play Store under Mendi or EEGBase brand · same codebase as web · TestFlight beta open
              </div>
            </div>

            {/* RCT ENROLLMENT PORTAL + PBM + SDK — research credibility row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-3">
              <div style={{ ...card, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>RCT enrollment portal</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>One-click clinic onboarding</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                  Public sign-up for the sham-controlled ADHD RCT · auto-handles consent + randomization + IRB amendment per site · Mendi science team gets live enrollment dashboard.
                </div>
                <button onClick={() => showToast("RCT portal · NCT06912xxx enrollment kit emailed")} style={{ marginTop: 10, fontSize: 11, padding: "5px 10px", background: "rgba(52,211,153,0.15)", color: "#86EFAC", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>Enroll our clinic →</button>
              </div>
              <div style={{ ...card, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Photobiomodulation</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>PBM dose tracking · Sens.ai-style</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                  Co-log Vielight · Coronet · Cellumed PBM headset dosing alongside fNIRS sessions. Joules / wavelength / minutes auto-attached to BIDS sidecar.
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: "#64748B" }}>3 PBM headsets supported · expandable</div>
              </div>
              <div style={{ ...card, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Hardware adapter SDK</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Add any BLE device in &lt;200 lines</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                  Public TypeScript adapter interface · CI runs synthetic Mendi/Muse/Polar streams against every PR · community drivers auto-merge on green.
                </div>
                <a onClick={() => showToast("docs.eegbase.io/sdk · TypeScript types + Mendi reference impl")} style={{ marginTop: 10, fontSize: 10, color: "#22D3EE", cursor: "pointer", fontWeight: 700, display: "inline-block" }}>docs.eegbase.io/sdk →</a>
              </div>
            </div>

            {/* Why us — competitive moat row */}
            <div style={{ ...card, marginBottom: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Why EEGBase vs. the rest</h3>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#A78BFA", padding: "2px 8px", background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Source: G2 + Capterra · 2026 Q1</span>
              </div>
              <div style={{ overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1E293B" }}>
                      <th style={{ textAlign: "left", padding: "8px 6px", color: "#94A3B8", fontWeight: 700 }}>Capability</th>
                      <th style={{ padding: "8px 6px", color: "#A78BFA", fontWeight: 800 }}>EEGBase</th>
                      <th style={{ padding: "8px 6px", color: "#64748B", fontWeight: 700 }}>BrainBay</th>
                      <th style={{ padding: "8px 6px", color: "#64748B", fontWeight: 700 }}>Cygnet</th>
                      <th style={{ padding: "8px 6px", color: "#64748B", fontWeight: 700 }}>BioExplorer</th>
                      <th style={{ padding: "8px 6px", color: "#64748B", fontWeight: 700 }}>Divergence</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: "#CBD5E1" }}>
                    {[
                      { cap: "Native Mendi fNIRS support",          us: true,  bb: false, cy: false, be: false, dn: false },
                      { cap: "BIDS / SNIRF export",                  us: true,  bb: false, cy: false, be: false, dn: true },
                      { cap: "Multi-clinic outcomes registry",       us: true,  bb: false, cy: false, be: false, dn: false },
                      { cap: "One-click claims (CMS-1500)",          us: true,  bb: false, cy: true,  be: false, dn: true },
                      { cap: "Co-published case studies",            us: true,  bb: false, cy: false, be: false, dn: false },
                      { cap: "Branded PDF progress reports",         us: true,  bb: false, cy: false, be: false, dn: true },
                      { cap: "SOC 2 Type II + Schrems II",           us: true,  bb: false, cy: false, be: false, dn: true },
                      { cap: "Web-based · zero-install",             us: true,  bb: false, cy: false, be: false, dn: true },
                    ].map((r) => (
                      <tr key={r.cap} style={{ borderBottom: "1px solid #0F172A" }}>
                        <td style={{ padding: "7px 6px" }}>{r.cap}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center", color: r.us ? "#34D399" : "#475569", fontWeight: 800 }}>{r.us ? "✓" : "—"}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center", color: r.bb ? "#94A3B8" : "#475569" }}>{r.bb ? "✓" : "—"}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center", color: r.cy ? "#94A3B8" : "#475569" }}>{r.cy ? "✓" : "—"}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center", color: r.be ? "#94A3B8" : "#475569" }}>{r.be ? "✓" : "—"}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center", color: r.dn ? "#94A3B8" : "#475569" }}>{r.dn ? "✓" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cannibalization-mitigation card */}
            <div style={{ ...card, marginBottom: 16, padding: 18, background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid rgba(124,58,237,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#C4B5FD", padding: "2px 8px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>For Mendi</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Clinic channel grows your consumer line — not the other way around</h3>
              </div>
              <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, marginBottom: 12 }}>
                Clinics are not consumer competitors — they are your <strong style={{ color: "#A78BFA" }}>highest-LTV customer-acquisition channel</strong>. Patients first try Mendi in-clinic, then take it home. Average per-clinic Mendi consumer attach within 90 days:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "Consumer attach rate",       val: "+38%",  sub: "patients buy own device after clinic intro" },
                  { label: "Family-member referral",     val: "1.6×",  sub: "avg new Mendi-consumer signups per clinic patient" },
                  { label: "Net new consumer LTV / clinic", val: "$8.2k", sub: "Y1 from a single Mendi-attached clinic" },
                  { label: "Cannibalization risk",       val: "<2%",   sub: "patients who replace home-use with clinic-only" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#C4B5FD", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-quarter roadmap */}
            <div style={{ ...card, marginBottom: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Roadmap · next 4 quarters</h3>
                <span style={{ fontSize: 10, color: "#64748B" }}>Updated weekly · public · linear.app/eegbase</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="demo-grid-4">
                {[
                  { q: "Q2 2026", color: "#34D399", label: "Now",      items: ["Mendi v3 native driver", "Sham-RCT enrollment", "Spanish + French i18n"] },
                  { q: "Q3 2026", color: "#60A5FA", label: "Next",     items: ["Hyperscanning v2 (4-person)", "Apple Watch HRV", "Offline mode (PWA)"] },
                  { q: "Q4 2026", color: "#A78BFA", label: "Planned",  items: ["FHIR R5 bidirectional", "Group-therapy sessions", "EU clinic onboarding"] },
                  { q: "Q1 2027", color: "#FCD34D", label: "Future",   items: ["RCT publication (Frontiers)", "Mendi consumer app deep-link", "API GA + SDK"] },
                ].map((q) => (
                  <div key={q.q} style={{ background: "#0A1320", border: `1px solid ${q.color}40`, borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: q.color }}>{q.q}</div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: q.color, padding: "1px 6px", background: `${q.color}20`, borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>{q.label}</span>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                      {q.items.map((i) => (
                        <li key={i} style={{ fontSize: 11, color: "#CBD5E1", display: "flex", gap: 6, lineHeight: 1.4 }}>
                          <span style={{ color: q.color, flexShrink: 0 }}>—</span><span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketing performance summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-4">
              {[
                { label: "New leads (30d)",   val: "47", sub: "+18% vs prior", color: "#3B82F6" },
                { label: "Conversion rate",    val: "62%", sub: "lead → first session", color: "#10B981" },
                { label: "Referral credits",   val: "$2,400", sub: "12 referrals · this Q", color: "#A78BFA" },
                { label: "Avg. client LTV",    val: "$3,840", sub: "20 sessions × $192", color: "#F59E0B" },
              ].map((s) => (
                <div key={s.label} style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 12, padding: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Mendi Clinical Case Studies */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 24px -16px rgba(79,70,229,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mendi Co-Branded Case Studies</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginTop: 2 }}>Real outcomes from clinics using Mendi + EEGBase</div>
                </div>
                <button onClick={() => showToast("Co-branded marketing kit opening — logos, photos, social tiles, intake scripts")} style={{ ...clinicianBtn, fontSize: 11 }}>Marketing kit ↓</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="demo-grid-3">
                {[
                  { clinic: "Riverside Wellness", location: "Portland, OR", n: 42, cond: "ADHD", protocol: "Focus Boost", outcome: "67% clinically significant ADHD-RS improvement", quote: "Mendi at home + EEGBase clinic visits transformed our ADHD adolescent caseload. Adherence is 4× our prior protocols.", clinician: "Dr. Maya Chen, BCN", img: "🏔" },
                  { clinic: "Cedar Valley NF",   location: "Austin, TX",   n: 28, cond: "Anxiety",   protocol: "R-DLPFC down-train", outcome: "GAD-7 −7.2 pts mean (n=28, 20 sessions)",                  quote: "We can finally publish outcomes — the registry exports as BIDS-compatible JSON. Our IRB approved fast.",         clinician: "Dr. Jamie Chen, PhD", img: "🌲" },
                  { clinic: "BrightPath Clinic", location: "Boston, MA",  n: 87, cond: "Burnout",  protocol: "DLPFC reactivation", outcome: "MBI-EE −18.7% (KU Leuven replication)",                    quote: "We replicated KU Leuven's burnout study at home using Mendi + EEGBase. The clinical channel actually works.", clinician: "Dr. Marcus Reyes, MD", img: "✨" },
                ].map((c) => (
                  <div key={c.clinic} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.img}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{c.clinic}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{c.location} · n={c.n} · {c.cond}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#A5B4FC", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Outcome</div>
                    <div style={{ fontSize: 12, color: "#34D399", fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>{c.outcome}</div>
                    <div style={{ fontSize: 11, color: "#CBD5E1", fontStyle: "italic", lineHeight: 1.5, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid rgba(167,139,250,0.4)" }}>&ldquo;{c.quote}&rdquo;</div>
                    <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>— {c.clinician}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(15,23,42,0.6)", borderRadius: 8, fontSize: 11, color: "#A5B4FC", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "pulse 1.5s infinite" }} />
                <strong style={{ color: "#34D399", fontWeight: 700 }}>14 active research studies</strong>
                <span>using EEGBase + Mendi data · published case studies → clinic acquisition tool</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="demo-grid-2">
              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Public Booking Page</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>cedarvalley.eegbase.app — embed on your website</p>
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 12 }}>CV</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>Cedar Valley Neurofeedback</div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>Book a free 15-min consultation</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                      <div key={d} style={{ flex: 1, fontSize: 10, color: "#94A3B8", textAlign: "center", padding: "4px 0", background: "#1E293B", borderRadius: 4 }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                    {["9:00", "9:30", "10:00", "10:30", "1:00", "1:30", "2:00", "2:30"].map((t) => (
                      <div key={t} style={{ fontSize: 11, color: "#CBD5E1", padding: 6, background: "#1E293B", border: "1px solid #334155", borderRadius: 4, textAlign: "center" }}>{t}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => showToast("Embed code copied to clipboard")} style={{ ...clinicianBtn, flex: 1 }}>Copy embed code</button>
                  <button onClick={() => showToast("Theme editor · clinic logo · 4 color presets · email signature · client portal subdomain")} style={{ ...clinicianBtn, flex: 1 }}>Customize theme</button>
                </div>
              </div>

              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Referral Program</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>$200 credit per referred clinician · QR codes printable</p>
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 80, height: 80, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 4 }}>
                    <svg viewBox="0 0 80 80" width="72" height="72">
                      {Array.from({ length: 9 * 9 }).map((_, i) => {
                        const r = Math.floor(i / 9), c = i % 9;
                        const blk = (r * 17 + c * 23 + r * c) % 3 === 0;
                        return blk ? <rect key={i} x={c * 8 + 4} y={r * 8 + 4} width={7} height={7} fill="#0F172A" /> : null;
                      })}
                      <rect x="2" y="2" width="22" height="22" fill="none" stroke="#0F172A" strokeWidth="3" />
                      <rect x="56" y="2" width="22" height="22" fill="none" stroke="#0F172A" strokeWidth="3" />
                      <rect x="2" y="56" width="22" height="22" fill="none" stroke="#0F172A" strokeWidth="3" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Your referral link</div>
                    <code style={{ fontSize: 11, color: "#A5B4FC", fontFamily: "ui-monospace, monospace", display: "block", marginTop: 2, wordBreak: "break-all" }}>eegbase.app/r/cv-jchen</code>
                    <div style={{ fontSize: 11, color: "#34D399", marginTop: 6 }}>12 referrals · $2,400 credited</div>
                  </div>
                </div>
                <button onClick={() => showToast("Referral link copied · scan QR to share")} style={{ ...clinicianBtn, width: "100%" }}>Copy link · Print QR poster</button>
              </div>

              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Email Drip Campaigns</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>Automated education sequences for new clients</p>
                {[
                  { name: "New client onboarding (5 emails)", on: true, opens: "82%" },
                  { name: "Mid-treatment progress check (3)", on: true, opens: "67%" },
                  { name: "Post-discharge maintenance (4)", on: true, opens: "54%" },
                  { name: "Lapsed client reactivation (2)", on: false, opens: "—" },
                ].map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #1E293B", fontSize: 11 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.on ? "#10B981" : "#475569" }} />
                    <span style={{ color: "#CBD5E1", flex: 1 }}>{d.name}</span>
                    <span style={{ color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>{d.opens}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...card }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Directory Sync</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>Auto-sync clinic profile to provider directories</p>
                {[
                  { name: "Psychology Today", connected: true, note: "Profile · 1,247 views/mo" },
                  { name: "Google Business",  connected: true, note: "4.9★ · 38 reviews" },
                  { name: "Apple Maps",       connected: false, note: "—" },
                  { name: "ISNR Directory",   connected: true, note: "BCN-listed" },
                  { name: "Zocdoc",           connected: false, note: "—" },
                ].map((p) => (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #1E293B", fontSize: 11 }}>
                    <span style={{ fontSize: 13 }}>{p.connected ? "✓" : "○"}</span>
                    <span style={{ color: "#F1F5F9", fontWeight: 600, flex: 1 }}>{p.name}</span>
                    <span style={{ color: p.connected ? "#34D399" : "#64748B" }}>{p.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DEVICES & API ── */}
        {tab === "devices" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Devices, Drivers &amp; Public API</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Hardware-agnostic by design. Plug in any supported EEG, fNIRS, or HRV device — start streaming in under 30 seconds. Full REST + WebSocket APIs and an open-source SDK for building custom integrations.
              </p>
            </div>

            {/* Featured: Mendi flagship integration */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 18, padding: 24, marginBottom: 20, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 32px -12px rgba(79,70,229,0.3)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#A5B4FC", background: "rgba(79,70,229,0.2)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(79,70,229,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Flagship Partner</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#FCD34D", background: "rgba(251,191,36,0.12)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(251,191,36,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Preferred · non-exclusive</span>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ width: 120, height: 120, borderRadius: 24, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 8px 32px -8px rgba(79,70,229,0.5)" }}>
                  <span style={{ fontSize: 64 }}>🧠</span>
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Mendi fNIRS Headset</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginBottom: 8, letterSpacing: "-0.02em" }}>First-class native integration</div>
                  <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, marginBottom: 14 }}>
                    EEGBase ships with a hand-tuned Mendi driver: dual-channel OxyHb/DeoxyHb streaming at 25 Hz, automatic light source calibration, and motion-artifact rejection trained on 1,200+ session-hours.
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
                    {[
                      { label: "Sample rate", val: "25 Hz" },
                      { label: "Latency", val: "<80 ms" },
                      { label: "Onboarding", val: "14 min" },
                      { label: "MAR accuracy", val: "96.4%" },
                    ].map((s) => (
                      <div key={s.label}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#34D399" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} />
                      BLE auto-reconnect &lt; 1.4 s
                    </span>
                    <span style={{ color: "#475569" }}>·</span>
                    <span>MAR FPR 0.8% on home-use motion</span>
                    <span style={{ color: "#475569" }}>·</span>
                    <span>Median TTFS across 412 clinics</span>
                  </div>
                  {/* Calibration drift sparkline + FW pinning + BYO + zero-lock-in */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 10, marginBottom: 12, padding: 10, background: "rgba(15,23,42,0.5)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>30-day drift (μM/day)</div>
                      <svg viewBox="0 0 120 24" width="100%" height="24" style={{ display: "block" }}>
                        <defs><linearGradient id="driftG" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#34D399" stopOpacity="0.4"/><stop offset="100%" stopColor="#34D399" stopOpacity="0"/></linearGradient></defs>
                        <path d="M 0,14 L 10,12 L 20,15 L 30,11 L 40,13 L 50,12 L 60,14 L 70,11 L 80,13 L 90,12 L 100,12 L 110,13 L 120,12 L 120,24 L 0,24 Z" fill="url(#driftG)" />
                        <path d="M 0,14 L 10,12 L 20,15 L 30,11 L 40,13 L 50,12 L 60,14 L 70,11 L 80,13 L 90,12 L 100,12 L 110,13 L 120,12" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="0" y1="20" x2="120" y2="20" stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
                      </svg>
                      <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>Median 0.04 μM/day · within ±0.1 spec · auto-recalibrate at 0.08</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Pinned firmware</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9", fontFamily: "ui-monospace, monospace" }}>Mendi-FW 2.1.3</div>
                      <div style={{ fontSize: 9, color: "#64748B" }}>EEGBase v4.6 verified · auto-test on every release</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>BYO &amp; lock-in</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>Open BIDS · zero lock-in</div>
                      <div style={{ fontSize: 9, color: "#64748B" }}>Pair any BLE device · all data exports as BIDS / SNIRF / EDF+</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => showToast("Mendi headset paired ✓ — streaming OxyHb/DeoxyHb at 25 Hz")} style={{ ...clinicianBtnPrimary, fontSize: 13 }}>Pair Mendi headset</button>
                    <button onClick={() => showToast("Calibration started — keep eyes closed for 30 seconds")} style={clinicianBtn}>Run calibration</button>
                    <button onClick={() => showToast("BYO device pairing — Muse / OpenBCI / Polar / any BLE EEG/HRV")} style={clinicianBtn}>Pair BYO device</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mendi-pitch credibility row: Support tiers · API limits · Hyperscanning */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-3">
              <div style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Support split</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Tier 1 EEGBase · Tier 2 Mendi</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.55, marginBottom: 8 }}>
                  Signal quality, UX, and clinician questions: <strong style={{ color: "#F1F5F9" }}>EEGBase</strong>. Hardware defects, RMA, firmware: <strong style={{ color: "#F1F5F9" }}>Mendi</strong> with 24h handoff SLA.
                </div>
                <div style={{ fontSize: 10, color: "#64748B" }}>P0 incident · 15 min ack · 4 h resolve · 24/7 on-call · status.eegbase.io</div>
              </div>
              <div style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Scale & API</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em" }}>50k/min</div>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>API rate limit (flagship)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em" }}>250k</div>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>Concurrent streams tested</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.5 }}>k8s auto-scaled. Driver SLA: 14 days from Mendi firmware release to EEGBase support.</div>
              </div>
              <div style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Hyperscanning ready</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>2 × Mendi · LSL-synced</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
                  Sub-millisecond alignment for dyadic studies. No SyncBox required. Beer-Lambert + DPF pipeline override available for research mode.
                </div>
              </div>
            </div>

            {/* Mendi-specific feature row: Calibration · Drop-ship · Partner program */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }} className="demo-grid-3">
              {/* Calibration Wizard */}
              <div style={{ ...card, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Mendi Calibration</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { num: 1, label: "Hairline placement", status: "complete", img: "📍" },
                    { num: 2, label: "Sensor contact pressure", status: "complete", img: "🤝" },
                    { num: 3, label: "Ambient light check", status: "active", img: "💡" },
                    { num: 4, label: "Baseline capture (60s)", status: "pending", img: "⏱" },
                  ].map((s) => (
                    <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: s.status === "active" ? "rgba(167,139,250,0.1)" : "#0A1320", border: s.status === "active" ? "1px solid #A78BFA" : "1px solid #1E293B", borderRadius: 8 }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: s.status === "complete" ? "#10B981" : s.status === "active" ? "#A78BFA" : "#1E293B", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                        {s.status === "complete" ? "✓" : s.num}
                      </span>
                      <span style={{ fontSize: 12, color: "#CBD5E1", flex: 1 }}>{s.label}</span>
                      <span style={{ fontSize: 14 }}>{s.img}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => showToast("Calibration step 3 complete · capturing baseline...")} style={{ ...clinicianBtnPrimary, fontSize: 12, width: "100%", marginTop: 12 }}>Continue to Step 3 →</button>
              </div>

              {/* Drop-ship Mendi to client */}
              <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 18, padding: 18, boxShadow: "0 8px 24px -12px rgba(79,70,229,0.3)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Order Mendi for Client</div>
                <div style={{ fontSize: 13, color: "#F1F5F9", marginBottom: 4, fontWeight: 700 }}>Ship to client&apos;s home</div>
                <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5, marginBottom: 12 }}>Drop-ship a Mendi headset to your client. Pre-paired to their EEGBase account, opens in-app already provisioned.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 10, color: "#A5B4FC", fontWeight: 600 }}>Clinic price</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", fontVariantNumeric: "tabular-nums" }}>$240</div>
                  </div>
                  <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 10, color: "#A5B4FC", fontWeight: 600 }}>HSA/FSA</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#34D399", fontVariantNumeric: "tabular-nums" }}>Eligible</div>
                  </div>
                </div>
                <button onClick={() => showToast("Order placed: Mendi headset shipping to Sarah Mitchell · arrives in 3 days · pre-paired ✓")} style={{ ...clinicianBtnPrimary, fontSize: 12, width: "100%", background: "#7C3AED" }}>Order &amp; ship to client →</button>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 8, textAlign: "center" }}>Truemed-eligible · ships in 3 days · pre-provisioned</div>
              </div>

              {/* Partner Program tiers */}
              <div style={{ ...card, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mendi Partner Program</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", padding: "2px 8px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 99 }}>SILVER</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                    <span>Sessions this month</span>
                    <span style={{ color: "#F59E0B", fontWeight: 700 }}>247 / 500</span>
                  </div>
                  <div style={{ height: 8, background: "#0A1320", borderRadius: 4, overflow: "hidden", border: "1px solid #1E293B" }}>
                    <div style={{ width: "49%", height: "100%", background: "linear-gradient(90deg, #F59E0B, #FCD34D)" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>253 more to reach <strong style={{ color: "#FCD34D" }}>Gold tier</strong></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "#CBD5E1" }}>
                  {[
                    { tier: "Bronze",   on: true,  commit: "100/qtr",   perk: "Listed on Mendi clinic finder" },
                    { tier: "Silver",   on: true,  commit: "500/qtr",   perk: "20% off device · co-marketing" },
                    { tier: "Gold",     on: false, commit: "2,000/qtr", perk: "30% off · joint research grant" },
                    { tier: "Platinum", on: false, commit: "5,000/qtr", perk: "Free devices · Certified Clinic badge" },
                  ].map((t) => (
                    <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.on ? "#10B981" : "#1E293B", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{t.on ? "✓" : ""}</span>
                      <span style={{ fontWeight: 700, color: t.on ? "#F1F5F9" : "#64748B", width: 56 }}>{t.tier}</span>
                      <span style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", fontWeight: 700, color: t.on ? "#FCD34D" : "#475569", width: 52, textAlign: "right" }}>{t.commit}</span>
                      <span style={{ color: t.on ? "#94A3B8" : "#475569", flex: 1 }}>{t.perk}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: "6px 8px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6, fontSize: 9, color: "#FCD34D", lineHeight: 1.5 }}>
                  <strong style={{ fontWeight: 700 }}>Y1 EEGBase commit:</strong> 7,500 Mendi units · $312k MDF · 4 co-published case studies · DSMB-reviewed registry
                </div>
                <div style={{ marginTop: 6, padding: "6px 8px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 6, fontSize: 9, color: "#C4B5FD", lineHeight: 1.5 }}>
                  <strong style={{ fontWeight: 700 }}>Rev-share:</strong> 18% of clinic SaaS ARR routed to Mendi for Mendi-attached clinics · 22% on Platinum · quarterly settlement · audited by Stripe Connect
                </div>
              </div>
            </div>

            {/* Connected devices grid */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Currently Connected</h3>
                <span style={{ fontSize: 11, color: "#34D399", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399", animation: "pulse 1.5s infinite" }} />
                  3 devices online
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="demo-grid-2">
                {[
                  { name: "Mendi fNIRS", channels: "Fp1, Fp2 · OxyHb/DeoxyHb · 25 Hz", status: "Connected", quality: 96, color: "#10B981" },
                  { name: "Muse S Athena", channels: "AF7, AF8, TP9, TP10 · 256 Hz", status: "Connected", quality: 88, color: "#10B981" },
                  { name: "Polar H10 (HRV)", channels: "RR intervals · 1000 Hz", status: "Connected", quality: 99, color: "#10B981" },
                  { name: "OpenBCI Cyton", channels: "8-channel EEG · 250 Hz", status: "Standby", quality: 0, color: "#64748B" },
                ].map((dev) => (
                  <div key={dev.name} style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{dev.name}</div>
                      <span style={{ fontSize: 10, color: dev.color, fontWeight: 700, padding: "2px 8px", background: `${dev.color}1A`, borderRadius: 99 }}>{dev.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>{dev.channels}</div>
                    {dev.quality > 0 && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>
                          <span>Signal quality</span>
                          <span style={{ color: dev.quality > 90 ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{dev.quality}%</span>
                        </div>
                        <div style={{ height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${dev.quality}%`, background: `linear-gradient(90deg, ${dev.color}, ${dev.color}88)`, borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* INTEROPERABILITY — LSL + BrainFlow + Web Bluetooth */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Universal Interoperability</h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Triple-stack: any LSL stream · any BrainFlow board · any Web Bluetooth device</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["LSL 1.16", "BrainFlow 5.x", "Web BLE"].map((v) => (
                    <span key={v} style={{ fontSize: 9, fontWeight: 700, color: "#34D399", padding: "3px 8px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>{v}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="demo-grid-3">
                {/* LSL Outlets/Inlets */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderLeft: "3px solid #06B6D4", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Lab Streaming Layer (LSL)</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginBottom: 8 }}>Outlets advertised on this network</div>
                  {[
                    { name: "EEGBase_Mendi_OxyHb", srate: "25 Hz", ch: 4 },
                    { name: "EEGBase_Polar_RR",    srate: "1 kHz", ch: 1 },
                    { name: "EEGBase_Markers",     srate: "irregular", ch: 1 },
                  ].map((s) => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 10, fontFamily: "ui-monospace, monospace", borderTop: "1px solid #1E293B" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
                      <span style={{ color: "#A5F3FC", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                      <span style={{ color: "#64748B", flexShrink: 0 }}>{s.ch}ch · {s.srate}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 8, marginBottom: 6 }}>Inlets resolved from peers</div>
                  {[
                    { name: "PsychoPy_Markers", srate: "irregular" },
                    { name: "Tobii_Pro_Gaze",   srate: "120 Hz" },
                  ].map((s) => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 10, fontFamily: "ui-monospace, monospace", borderTop: "1px solid #1E293B" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#A78BFA", flexShrink: 0 }} />
                      <span style={{ color: "#C4B5FD", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                      <span style={{ color: "#64748B", flexShrink: 0 }}>{s.srate}</span>
                    </div>
                  ))}
                </div>

                {/* BrainFlow universal driver */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderLeft: "3px solid #A855F7", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#A855F7", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>BrainFlow Universal Driver</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginBottom: 8 }}>Single API for 32+ supported boards</div>
                  <pre style={{ margin: 0, padding: "10px 12px", fontSize: 10, fontFamily: "ui-monospace, monospace", color: "#CBD5E1", lineHeight: 1.65, overflow: "auto", background: "#0F172A", borderRadius: 6, marginBottom: 8 }}>{`from brainflow import BoardShim
board = BoardShim(BoardIds.CYTON_BOARD,
                  params)
board.prepare_session()
board.start_stream()`}</pre>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {["Cyton", "Ganglion", "Crown", "Muse 2/S", "BrainBit", "Mentalab", "Unicorn", "Notion", "Synthetic"].map((b) => (
                      <span key={b} style={{ fontSize: 9, color: "#C4B5FD", background: "#1E293B", border: "1px solid #334155", padding: "2px 6px", borderRadius: 4 }}>{b}</span>
                    ))}
                  </div>
                </div>

                {/* Drift / latency dashboard */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderLeft: "3px solid #10B981", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Sync Drift Dashboard</div>
                  {[
                    { l: "BLE → adapter", v: "12.4 ms", c: "#34D399" },
                    { l: "Adapter → DB",  v: "3.1 ms",  c: "#34D399" },
                    { l: "LSL clock drift", v: "+0.18 ms/min", c: "#34D399" },
                    { l: "Inter-stream offset", v: "<1 ms (max 4)", c: "#34D399" },
                    { l: "Marker jitter (parallel)", v: "0.4 ms σ", c: "#34D399" },
                  ].map((m) => (
                    <div key={m.l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 10, borderTop: "1px solid #1E293B" }}>
                      <span style={{ color: "#94A3B8" }}>{m.l}</span>
                      <span style={{ color: m.c, fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{m.v}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 8, lineHeight: 1.4 }}>Sub-ms multi-device alignment without a SyncBox.</div>
                </div>
              </div>
            </div>

            {/* IMPORT / EXPORT — BIDS, EDF+, BrainVision, SNIRF, XDF */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Import &amp; Export · Research-Grade Formats</h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>BIDS-EEG / BIDS-fNIRS · EDF+ · BrainVision (.vhdr) · SNIRF · XDF · OpenNeuro publish</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }} className="demo-grid-2">
                {/* Drop zone */}
                <div style={{ background: "#0A1320", border: "2px dashed #334155", borderRadius: 10, padding: 18, textAlign: "center", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#60A5FA")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#334155")}
                  onClick={() => showToast("BIDS-compatible session imported · 64 channels · 1.2 GB · MNE auto-loaded")}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📥</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Drop a session here</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 10 }}>Auto-detects format · channel mapping wizard · MNE-Python compatible</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {[".edf", ".bdf", ".vhdr", ".eeg", ".snirf", ".xdf", ".csv", ".cnt", "BIDS folder"].map((f) => (
                      <span key={f} style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", color: "#A5B4FC", background: "#1E293B", border: "1px solid #334155", padding: "2px 8px", borderRadius: 4 }}>{f}</span>
                    ))}
                  </div>
                </div>
                {/* Export options */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>One-Click Export</div>
                  {[
                    { fmt: "BIDS-EEG bundle", desc: "sub-/ses-/eeg/ tree + sidecars", color: "#A78BFA" },
                    { fmt: "BIDS-fNIRS (Mendi)", desc: "SNIRF + dataset_description.json", color: "#A78BFA" },
                    { fmt: "EDF+ Export", desc: "Universal clinical format", color: "#60A5FA" },
                    { fmt: "Publish to OpenNeuro", desc: "DataLad · DOI assigned", color: "#10B981" },
                    { fmt: "DICOM-EEG", desc: "HL7 / FHIR Observation", color: "#F59E0B" },
                  ].map((o) => (
                    <button key={o.fmt} onClick={() => showToast(`${o.fmt} · queued`)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", background: "transparent", border: "1px solid #1E293B", borderRadius: 6, cursor: "pointer", textAlign: "left", marginBottom: 6, transition: "border-color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#475569")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E293B")}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: o.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: "#F1F5F9", fontWeight: 600 }}>{o.fmt}</div>
                        <div style={{ fontSize: 10, color: "#64748B" }}>{o.desc}</div>
                      </div>
                      <span style={{ fontSize: 9, color: "#475569" }}>↓</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Migration importer — switching cost killer */}
              <div style={{ marginTop: 14, padding: 12, background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>Switching from another platform?</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>One-click import keeps every session, every note, every claim · zero data loss</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", padding: "2px 8px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Avg migration · 38 min</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {[
                    { from: "BrainPaint",      fmt: ".bpf · session log",   ready: true  },
                    { from: "EEGer",           fmt: ".edf+ + protocol XML", ready: true  },
                    { from: "NeuroGuide",      fmt: ".nguide · qEEG",       ready: true  },
                    { from: "BioExplorer",     fmt: ".ncb · designs",       ready: true  },
                    { from: "SimplePractice", fmt: "Client CSV + notes",   ready: true  },
                    { from: "TherapyNotes",    fmt: "PDF + claim XML",      ready: true  },
                  ].map((m) => (
                    <button key={m.from} onClick={() => showToast(`${m.from} importer · upload ${m.fmt} → all clients + sessions migrated`)} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, padding: "8px 6px", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>{m.from}</div>
                      <div style={{ fontSize: 9, color: "#94A3B8" }}>{m.fmt}</div>
                      <div style={{ fontSize: 9, color: "#34D399", marginTop: 3, fontWeight: 700 }}>Import →</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SNIRF / BIDS-fNIRS sidecar preview — concrete artifact for Mendi */}
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="demo-grid-2">
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#1E293B", borderBottom: "1px solid #334155" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#A78BFA", fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>sub-021_ses-08_task-focus_nirs.json</span>
                    </div>
                    <span style={{ fontSize: 9, color: "#34D399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>BIDS v1.9.0 valid</span>
                  </div>
                  <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "ui-monospace, monospace", color: "#CBD5E1", lineHeight: 1.55, overflow: "auto", maxHeight: 220 }}>{`{
  "TaskName": "Focus Boost · Mendi",
  "InstitutionName": "Cedar Valley NF",
  "Manufacturer": "Mendi",
  "ManufacturersModelName": "Mendi v3 Headband",
  "DeviceSerialNumber": "MND-3-A4F92E",
  "SamplingFrequency": 25,
  "NIRSChannelCount": 4,
  "NIRSSourceOptodeCount": 2,
  "NIRSDetectorOptodeCount": 2,
  "Wavelengths": [760, 850],
  "RecordingDuration": 1320.4,
  "MotionArtifactRejection": {
    "method": "Wavelet + TDDR",
    "MAR_FPR": 0.008,
    "MAR_accuracy": 0.964
  },
  "SoftwareVersions": "EEGBase/4.6 + Mendi-SDK/2.1.3"
}`}</pre>
                </div>
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#1E293B", borderBottom: "1px solid #334155" }}>
                    <span style={{ fontSize: 10, color: "#60A5FA", fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>API · GET /v1/sessions/&#123;id&#125;/stream</span>
                    <span style={{ fontSize: 9, color: "#A5B4FC", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Limits</span>
                  </div>
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                    {[
                      { k: "Rate limit (flagship)",   v: "50,000 req/min" },
                      { k: "Rate limit (standard)",   v: "5,000 req/min" },
                      { k: "Concurrent WS streams",   v: "250,000 sustained" },
                      { k: "Stream payload SLO",      v: "p95 < 80 ms · p99 < 140 ms" },
                      { k: "MAR precision · recall",  v: "0.971 · 0.958 (n=2,840)" },
                      { k: "Driver SLA",              v: "14-day turnaround on FW changes" },
                      { k: "Webhook retries",         v: "Exponential · 24 h max" },
                    ].map((r) => (
                      <div key={r.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 8px", background: "#0F172A", borderRadius: 6, border: "1px solid #1E293B" }}>
                        <span style={{ color: "#94A3B8" }}>{r.k}</span>
                        <span style={{ color: "#F1F5F9", fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: "#64748B", textAlign: "center" }}>
                Sidecar conforms to BIDS-fNIRS Extension Proposal 1 (BEP-030) · validates against bids-validator 1.13+
              </div>
            </div>

            {/* MULTI-DEVICE SYNC TIMELINE */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Multi-Device Sync Timeline</h3>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>4 streams · LSL clock-aligned · click any moment to inspect all signals</p>
                </div>
                <span style={{ fontSize: 10, color: "#34D399", fontWeight: 700, padding: "3px 8px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sub-ms Aligned</span>
              </div>
              <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 12 }}>
                {[
                  { name: "Mendi OxyHb",   color: "#A855F7", path: "M 0,12 Q 30,8 60,14 T 120,11 T 180,15 T 240,10 T 300,13 T 360,12 T 420,11" },
                  { name: "Muse Beta",     color: "#06B6D4", path: "M 0,12 Q 20,16 40,10 T 80,14 T 120,9 T 160,15 T 200,11 T 240,13 T 280,10 T 320,14 T 360,12 T 420,12" },
                  { name: "Polar HRV",     color: "#10B981", path: "M 0,12 L 30,9 L 60,14 L 90,10 L 120,15 L 150,11 L 180,12 L 210,9 L 240,14 L 270,10 L 300,13 L 330,11 L 360,12 L 390,10 L 420,12" },
                  { name: "Pupil Gaze X",  color: "#F59E0B", path: "M 0,12 L 60,8 L 120,16 L 180,9 L 240,14 L 300,11 L 360,13 L 420,12" },
                ].map((s, i) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderTop: i === 0 ? "none" : "1px solid #1E293B" }}>
                    <div style={{ width: 90, fontSize: 10, color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.name}</div>
                    <svg viewBox="0 0 420 24" width="100%" style={{ flex: 1, height: 24 }}>
                      <path d={s.path} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div style={{ width: 50, fontSize: 10, color: "#64748B", fontFamily: "ui-monospace, monospace", textAlign: "right" }}>{[".05Hz", "16Hz", "·", "120Hz"][i]}</div>
                  </div>
                ))}
                {/* Stim marker */}
                <div style={{ position: "relative", height: 14, marginTop: 4, borderTop: "1px solid #1E293B" }}>
                  {[5, 18, 38, 62, 78].map((p, i) => (
                    <div key={i} style={{ position: "absolute", left: `${10 + p * 0.85}%`, top: 4, width: 2, height: 8, background: "#FCD34D" }} title={`Stim @ ${p}s`} />
                  ))}
                  <span style={{ fontSize: 9, color: "#FCD34D", marginLeft: 96, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>↑ stim markers (LSL)</span>
                </div>
              </div>
            </div>

            {/* DEVICE FLEET MANAGEMENT */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Device Fleet Management</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => showToast("Firmware OTA push initiated for 3 out-of-date devices")} style={clinicianBtn}>Update firmware (3)</button>
                  <button onClick={() => showToast("Inventory CSV exported")} style={clinicianBtn}>Export inventory</button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#1E293B", borderBottom: "1px solid #334155" }}>
                      {["Device", "Serial", "Assigned", "Last seen", "Firmware", "Battery", "Status"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dev: "Mendi #1",     sn: "MND-2403-A41", assigned: "Sarah Mitchell (home)", seen: "2h ago",  fw: "v2.4.1",  fwOk: true,  bat: 78, status: "online" },
                      { dev: "Mendi #2",     sn: "MND-2403-A42", assigned: "Clinic · Room 1",       seen: "now",      fw: "v2.4.1",  fwOk: true,  bat: 92, status: "online" },
                      { dev: "Mendi #3",     sn: "MND-2401-B17", assigned: "James Okafor (home)",   seen: "3d ago",   fw: "v2.3.0",  fwOk: false, bat: 31, status: "offline" },
                      { dev: "Muse S Athena", sn: "MSA-25-019",  assigned: "Clinic · Room 2",       seen: "12m ago",  fw: "v3.1.2",  fwOk: true,  bat: 64, status: "online" },
                      { dev: "Polar H10 #1", sn: "BD-02-2839",   assigned: "Clinic · Pool",         seen: "now",      fw: "v3.1.0",  fwOk: true,  bat: 88, status: "online" },
                      { dev: "OpenBCI Cyton", sn: "OBC-22-014",  assigned: "Lab · benchtop",        seen: "1d ago",   fw: "v3.1.2",  fwOk: false, bat: 0,  status: "wired" },
                    ].map((d) => (
                      <tr key={d.sn} style={{ borderTop: "1px solid #334155" }}>
                        <td style={{ padding: "8px 10px", color: "#F1F5F9", fontWeight: 600 }}>{d.dev}</td>
                        <td style={{ padding: "8px 10px", color: "#64748B", fontFamily: "ui-monospace, monospace" }}>{d.sn}</td>
                        <td style={{ padding: "8px 10px", color: "#CBD5E1" }}>{d.assigned}</td>
                        <td style={{ padding: "8px 10px", color: "#94A3B8" }}>{d.seen}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ color: d.fwOk ? "#34D399" : "#F59E0B", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{d.fw}</span>
                          {!d.fwOk && <span style={{ marginLeft: 6, fontSize: 9, color: "#F59E0B", fontWeight: 700 }}>UPDATE</span>}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          {d.bat > 0 ? (
                            <span style={{ color: d.bat > 50 ? "#34D399" : d.bat > 20 ? "#F59E0B" : "#EF4444", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{d.bat}%</span>
                          ) : <span style={{ color: "#64748B" }}>—</span>}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: d.status === "online" ? "#34D399" : d.status === "wired" ? "#60A5FA" : "#64748B", padding: "2px 8px", background: d.status === "online" ? "rgba(16,185,129,0.12)" : d.status === "wired" ? "rgba(96,165,250,0.12)" : "#1E293B", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supported devices catalog */}
            <div style={{ ...card, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Hardware Catalog</h3>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>110+ devices supported via LSL · BrainFlow · vendor SDK · open SDK to add your own</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="demo-grid-2">
                {[
                  { cat: "fNIRS", items: ["Mendi", "NIRx NIRSport2", "Artinis Brite", "Artinis OctaMon", "Gowerlabs LUMO", "Cortivision", "Kernel Flow", "OBELAB NIRSIT"] },
                  { cat: "EEG (consumer)", items: ["Muse 2/S", "Muse S Athena", "NeuroSky", "BrainBit", "BrainBit Flex", "Emotiv Insight", "Emotiv EPOC X", "Neurosity Crown"] },
                  { cat: "EEG (clinical)", items: ["OpenBCI Cyton", "OpenBCI Galea", "Wearable Sensing DSI-24", "ANT Neuro eego", "Brain Products LiveAmp", "Brain Products actiCHamp", "BrainMaster Discovery 24E", "g.tec Unicorn"] },
                  { cat: "HRV / Wearable / EDA", items: ["Polar H10 / Verity", "Garmin HRM-Pro", "Whoop 4.0", "Oura Ring 4", "Apple Watch", "HeartMath emWave", "Empatica EmbracePlus", "Shimmer3 GSR+"] },
                  { cat: "Eye tracking", items: ["Tobii Pro Spectrum", "Pupil Labs Neon", "EyeLink 1000+"] },
                  { cat: "Multimodal hubs", items: ["BIOPAC MP160", "Thought Tech ProComp", "Mind Media NeXus", "iMotions"] },
                  { cat: "BCI / hybrid", items: ["OpenBCI Galea", "Cognixion ONE", "Bitbrain Diadem"] },
                ].map((g) => (
                  <div key={g.cat} style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{g.cat}</div>
                    {g.items.map((it) => (
                      <div key={it} style={{ fontSize: 12, color: "#CBD5E1", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: it === "Mendi" ? "#A78BFA" : "#475569" }} />
                        {it}
                        {it === "Mendi" && <span style={{ marginLeft: "auto", fontSize: 9, color: "#A78BFA", fontWeight: 700 }}>FLAGSHIP</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* API + SDK panel */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Public API &amp; SDK</h3>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Build your own integration in any language · OpenAPI 3.1 spec · MIT-licensed SDK</p>
                </div>
                <button onClick={() => showToast("Opening API docs at /api/docs")} style={clinicianBtn}>View full API docs →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="demo-grid-2">
                {/* WebSocket sample */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #1E293B", background: "#0F172A" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Stream — WebSocket</span>
                    <span style={{ fontSize: 10, color: "#64748B" }}>JavaScript</span>
                  </div>
                  <pre style={{ margin: 0, padding: "14px 16px", fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#CBD5E1", lineHeight: 1.7, overflow: "auto" }}>
{`import { EEGBase } from "@eegbase/sdk";

const eb = new EEGBase({ apiKey: "..." });
const stream = eb.devices.stream("mendi");

stream.on("oxy", ({ left, right, t }) => {
  console.log(\`OxyHb L: \${left}, R: \${right}\`);
});

stream.on("artifact", ({ type }) => {
  // EMG, eyeBlink, motion
});`}
                  </pre>
                </div>
                {/* REST sample */}
                <div style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #1E293B", background: "#0F172A" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em" }}>REST — Create Session</span>
                    <span style={{ fontSize: 10, color: "#64748B" }}>cURL</span>
                  </div>
                  <pre style={{ margin: 0, padding: "14px 16px", fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#CBD5E1", lineHeight: 1.7, overflow: "auto" }}>
{`curl -X POST https://api.eegbase.io/v1/sessions \\
  -H "Authorization: Bearer $EEGBASE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "c_8f3a2",
    "device": "mendi",
    "protocol": "smr_cz",
    "duration_min": 30
  }'

# 201 Created
# { "session_id": "s_a1b2c3", ... }`}
                  </pre>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["GET /clients", "POST /sessions", "GET /sessions/:id", "GET /sessions/:id/eeg", "POST /protocols", "GET /reports/:id.pdf", "POST /webhooks", "GET /devices"].map((endpoint) => (
                  <span key={endpoint} style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", color: "#A5B4FC", background: "#1E293B", border: "1px solid #334155", padding: "3px 8px", borderRadius: 6 }}>{endpoint}</span>
                ))}
                <span style={{ fontSize: 10, color: "#64748B", padding: "3px 8px" }}>+ 47 more</span>
              </div>
            </div>

            {/* Webhooks + integrations */}
            <div style={{ ...card }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Webhooks &amp; Outbound Integrations</h3>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>Push events to any service — fire-and-forget HTTP POST with HMAC signing</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="demo-grid-3">
                {[
                  { event: "session.completed", desc: "After every session ends" },
                  { event: "client.threshold_crossed", desc: "When PHQ-9/GAD-7 hits target" },
                  { event: "device.connected", desc: "On any device pairing" },
                  { event: "ai.recommendation_generated", desc: "When AI flags stalled progress" },
                  { event: "report.generated", desc: "PDF ready for download" },
                  { event: "appointment.scheduled", desc: "New booking in any calendar" },
                ].map((w) => (
                  <div key={w.event} style={{ background: "#0A1320", border: "1px solid #1E293B", borderRadius: 8, padding: "10px 12px" }}>
                    <code style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#A5B4FC", fontWeight: 600 }}>{w.event}</code>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{w.desc}</div>
                  </div>
                ))}
              </div>
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
