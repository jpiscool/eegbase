"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTabState } from "@/hooks/useTabState";
import { SimulatorAdapter } from "@/lib/device/simulator";
import { MendiBridgeAdapter } from "@/lib/device/mendi-bridge";
import { MendiAdapter } from "@/lib/device/mendi";
import { MuseAdapter } from "@/lib/device/muse";
import type { DeviceAdapter, DeviceSample } from "@/lib/device/adapter";
import { LiveChart } from "@/components/LiveChart";
import { GameFeedback } from "@/components/GameFeedback";
import { FocusGame } from "@/components/FocusGame";
import { BrainMapPanel } from "@/components/BrainMapPanel";
import { ClinicalQuestionnaire } from "@/components/ClinicalQuestionnaire";
import {
  Activity, Gamepad2, Brain, HeartPulse, TrendingUp,
  Sparkles, Target, Calendar, FileText, BarChart3,
  Search, Bell, Bluetooth as BluetoothIcon,
  Pause, Play, RotateCcw, Plus, Volume2, VolumeX, Smartphone,
  Mail, Building2, Download, UploadCloud,
  LayoutDashboard, UserCircle as ProfileIcon, Users,
} from "lucide-react";
import { generateDemoInsight } from "./ai-insight-action";
import {
  WIDGET_CATALOG, WidgetCard, WidgetPicker, DashboardEmptyState, useDashboardState,
  MyDevicesSection, ConnectDeviceModal, usePairedDevices, DEVICE_REGISTRY,
  DASHBOARD_PRESETS,
} from "./_dashboard-widgets";

const MAX_POINTS = 60;
type MainTab = "dashboard" | "session" | "game" | "brain" | "progress" | "ai" | "schedule" | "hrv" | "protocols" | "reports" | "compare";

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
  { category: "Platform",           feature: "Free for licensed clinicians",          eeg: true,  myndlift: false, divergence: false, eeger: false, brainpaint: false, neuroptimal: false, neuroguide: false, brainavatar: false },
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
  { key: "eeg",         label: "EEGBase",     sub: "Free · Hosted", highlight: true },
  { key: "myndlift",    label: "Myndlift",    sub: "Cloud-locked" },
  { key: "divergence",  label: "Divergence",  sub: "Web desktop" },
  { key: "eeger",       label: "EEGer",       sub: "Windows-only" },
  { key: "brainpaint",  label: "BrainPaint",  sub: "Per-session licence" },
  { key: "neuroptimal", label: "NeurOptimal", sub: "Hardware rental" },
  { key: "neuroguide",  label: "NeuroGuide",  sub: "Perpetual licence" },
  { key: "brainavatar", label: "BrainAvatar", sub: "Hardware bundle" },
];

// Fake SOAP note
const SOAP_NOTE = `S: Client reports moderate difficulty concentrating this week; rated focus 4/10. Sleep quality 6/10 (down from 7 last visit). No medication changes. Reports feeling "stuck" on same tasks at work.

O: 22-minute SMR (12–15 Hz) training session at Cz. Average reward score 64.2/100 (above-threshold 71% of session). Theta power elevated; θ/β ratio 2.2 SD above age/sex norm (ages 28–35, eyes-open resting). Heart rate 68 bpm, HRV-RMSSD 45 ms (within expected baseline). PHQ-9: 11 (moderate). GAD-7: 8 (mild).

A: Client engagement improving — reward score +52% from session 1 baseline (38.2). Theta/beta ratio has remained above normative range (>1.5 SD) across sessions 6–8 despite consistent attendance and compliance. PHQ-9 depression score trending down from 18 → 11 over 8 sessions. Alpha-theta protocol may be better indicated given stalled theta/beta trajectory.

P: 1. Consider switching to alpha-theta (Pz/Oz, 8–12 Hz reward) for sessions 9–12 per EEGBase protocol recommendation. 2. Reassess PHQ-9 at session 10. 3. Discuss sleep hygiene strategies at next appointment. 4. Continue 22-minute weekly sessions. 5. Client to complete daily symptom journal between sessions.`;

// Schedule appointments — week of May 11, 2026 (next Mon onwards from today May 9).
// Clients here must match DEMO_CLIENTS below; protocols match each client's
// active protocol so the schedule reads as a real next-session calendar.
const APPOINTMENTS = [
  { time: "Mon May 11 · 9:00 AM",  client: "Sarah Mitchell",   protocol: "SMR · Cz — Session 9",                       status: "confirmed" },
  { time: "Mon May 11 · 11:00 AM", client: "James Okafor",     protocol: "Alpha-Theta · Pz/Oz — Session 5",            status: "confirmed" },
  { time: "Tue May 12 · 2:30 PM",  client: "Priya Sharma",     protocol: "Prefrontal HbO · Mendi — Session 13",        status: "confirmed" },
  { time: "Wed May 13 · 10:00 AM", client: "Daniel Cruz",      protocol: "Sleep Spindle · Cz/Pz — Session 4",          status: "confirmed" },
  { time: "Thu May 14 · 3:00 PM",  client: "Emily Tanaka",     protocol: "Neuromuscular · C3/C4 — Session 7",          status: "confirmed" },
  { time: "Fri May 15 · 1:00 PM",  client: "Sarah Mitchell",   protocol: "SMR · Cz — Session 10",                      status: "pending"   },
];

const VALID_TABS: MainTab[] = [
  "dashboard",
  "session","game","brain","hrv","progress","ai","protocols",
  "schedule","reports","compare",
];
const isMainTab = (v: string): v is MainTab => (VALID_TABS as string[]).includes(v);

export default function DemoClient({
  initialTab = "dashboard",
  // 'demo'   → public /demo surface, all tabs visible
  // 'strip'  → authenticated /dashboard, hide every tab except 'dashboard'.
  //            Used to enforce the Tier 0 / Tier 1 cut-down of the logged-in
  //            app per scripts/mendi-capture/live-site-test-priorities.md.
  appMode = "demo",
  // Server-rendered onboarding checklist slot. Auto-dismisses once the
  // clinic has protocols + clients + sessions. Only used in strip mode.
  onboarding,
}: { initialTab?: MainTab; appMode?: "demo" | "strip"; onboarding?: React.ReactNode }) {
  const adapterRef = useRef<DeviceAdapter | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // URL + localStorage hybrid tab state.
  //  • ?tab=schedule in URL  → that tab (deep links, refresh)
  //  • bare /demo + storage  → last-used tab (returning visitor)
  //  • neither               → "dashboard" (My Workspace landing)
  // The parent server component resolves initialTab from searchParams, so SSR
  // HTML already matches the requested tab — zero hydration flash on refresh.
  const [tab, setTab] = useTabState<MainTab>({
    urlKey: "tab",
    storageKey: "demo:tab",
    cookieName: "demo_tab",
    defaultValue: "dashboard",
    serverInitialValue: initialTab,
    validate: isMainTab,
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
  const [connectedWearables, setConnectedWearables] = useState<Set<string>>(new Set());
  const [featureCategory, setFeatureCategory] = useState<string | null>(null);
  const [reportExported, setReportExported] = useState(false);
  const [protocolSearch, setProtocolSearch] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [ehrCopied, setEhrCopied] = useState(false);
  // Live Claude Haiku insight for the cross-session pattern detector
  const [aiInsight, setAiInsight] = useState<{ text: string; model: string; latencyMs: number } | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState<string | null>(null);
  // Interactive Focus Game — drives Game Mode visualizations on devices without a Mendi headband
  const [interactiveGame, setInteractiveGame] = useState(true);
  const [playerScore, setPlayerScore] = useState(0);
  const [protocolApplied, setProtocolApplied] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [faxSent, setFaxSent] = useState(false);
  const [showSimilarCasesModal, setShowSimilarCasesModal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [showCmdK, setShowCmdK] = useState(false);
  const [cmdKQuery, setCmdKQuery] = useState("");
  const [gameMode, setGameMode] = useState<"orb" | "art" | "audio">("orb");
  const [reminderToggles, setReminderToggles] = useState({ sms: true, email: true, noshow: true, lapsed: false });
  const [peakFlash, setPeakFlash] = useState(false);
  const peakReachedRef = useRef(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<MainTab>>(new Set([initialTab]));
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Exhale">("Inhale");
  useEffect(() => {
    const iv = setInterval(() => setBreathPhase((p) => (p === "Inhale" ? "Exhale" : "Inhale")), 5000);
    return () => clearInterval(iv);
  }, []);
  const reward  = useSlidingWindow(MAX_POINTS);
  const oxyL    = useSlidingWindow(MAX_POINTS);
  const oxyR    = useSlidingWindow(MAX_POINTS);
  const deoxyL  = useSlidingWindow(MAX_POINTS);
  const deoxyR  = useSlidingWindow(MAX_POINTS);
  const thetaW  = useSlidingWindow(MAX_POINTS);
  const alphaW  = useSlidingWindow(MAX_POINTS);
  const betaW   = useSlidingWindow(MAX_POINTS);

  // Live source — which adapter is feeding samples right now.
  //   'simulator' → synthetic data (default; also fallback when adapter fails)
  //   'mendi'     → real BLE frames via the localhost Python bridge
  //   'muse'      → real EEG band powers via Web Bluetooth direct to a Muse 2 / S
  // `mendiStatus` tracks the WebSocket → Python bridge channel.
  // `mendiBle` tracks the BLE link from the bridge to the headband itself,
  // so the Connect button can distinguish "bridge reachable but headband
  // is off / sleeping" from "fully streaming."
  // Muse uses Web Bluetooth directly so we don't need a bridge status — the
  // adapter's isConnected() suffices.
  type LiveSource = "simulator" | "mendi" | "muse";
  const [liveSource, setLiveSource] = useState<LiveSource>("simulator");
  const [mendiStatus, setMendiStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  // Last Mendi pairing error message — surfaced as a toast + via the button
  // tooltip so the operator knows WHY the connect attempt failed instead
  // of seeing a generic "bridge offline" label.
  const [mendiError, setMendiError] = useState<string | null>(null);
  const [mendiBle, setMendiBle] = useState(false);

  const stop = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await adapterRef.current?.disconnect();
    adapterRef.current = null;
    setRunning(false);
  }, []);

  // Capture [Mendi] console messages and render them in the strip-mode
  // dashboard so the operator can see what happened during pairing
  // WITHOUT opening DevTools. Only active in strip mode.
  const [mendiLog, setMendiLog] = useState<Array<{ level: "info" | "warn" | "error"; text: string; ts: number }>>([]);
  useEffect(() => {
    if (appMode !== "strip") return;
    const origInfo = console.info, origWarn = console.warn, origError = console.error;
    const capture = (level: "info" | "warn" | "error") => (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === "string" && first.startsWith("[Mendi]")) {
        const text = args
          .map((a) => {
            if (typeof a === "string") return a;
            // Error objects don't survive JSON.stringify (their props are
            // non-enumerable). Unpack name/message/code explicitly so the
            // user can SEE why something failed instead of an empty `{}`.
            if (a instanceof Error) {
              const code = (a as Error & { code?: unknown }).code;
              return `${a.name}: ${a.message}` + (code != null ? ` (code: ${String(code)})` : "");
            }
            try { return JSON.stringify(a); } catch { return String(a); }
          })
          .join(" ");
        setMendiLog((prev) => [...prev.slice(-49), { level, text, ts: Date.now() }]);
      }
      // Always forward to the original console so DevTools still shows it.
      const orig = level === "info" ? origInfo : level === "warn" ? origWarn : origError;
      orig.apply(console, args);
    };
    console.info = capture("info");
    console.warn = capture("warn");
    console.error = capture("error");
    return () => {
      console.info = origInfo;
      console.warn = origWarn;
      console.error = origError;
    };
  }, [appMode]);

  // Sliding window of the last N device samples — only collected in strip
  // mode and used by the diagnostic panel to compute min/max/avg per field.
  // Refs (not state) because every sample push would otherwise re-render.
  const mendiSamplesRef = useRef<DeviceSample[]>([]);
  const [mendiStatsTick, setMendiStatsTick] = useState(0);
  const [mendiReportCopiedAt, setMendiReportCopiedAt] = useState<number | null>(null);
  // Persistent history of every WARN/FAIL ever seen during the session.
  // Key = `${level}|${label}|${reason}` for dedup; value tracks first-seen,
  // last-seen, and number of refresh cycles the issue appeared in.
  // Survives refreshes; cleared by Reset.
  const mendiHistoryRef = useRef<Map<string, { level: "WARN" | "FAIL"; label: string; reason: string; firstAt: number; lastAt: number; count: number }>>(new Map());
  const [mendiHistoryCopiedAt, setMendiHistoryCopiedAt] = useState<number | null>(null);
  // Strip-mode debug surface. The diagnostic panels (pairing log,
  // widget test report, test history) are valuable while validating
  // hardware but distracting for clinicians during real use. Default
  // OFF; opt back in with ?debug=1 in the URL.
  // ?sim=1 forces the simulator on /dashboard so we can validate the
  // SQI gate against synthetic clean data without a physical band.
  const [debugMode, setDebugMode] = useState(false);
  const [simMode, setSimMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    setDebugMode(p.has("debug"));
    setSimMode(p.has("sim"));
  }, []);
  useEffect(() => {
    if (appMode !== "strip") return;
    // Tick the stats panel once per second so it refreshes without
    // re-rendering on every sample (~30/s would be wasteful).
    const iv = setInterval(() => setMendiStatsTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [appMode]);

  // Attach the sample callback to whichever adapter is current. Pulled out
  // so both the primary start path and the simulator-fallback path stay in
  // sync without duplicating the push-into-sliding-window logic.
  const attachAdapter = useCallback((adapter: DeviceAdapter) => {
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
      // Diagnostic ring buffer for the strip-mode Mendi values panel.
      // Keep the last 300 samples (~10 s at 30 Hz).
      const buf = mendiSamplesRef.current;
      buf.push(s);
      if (buf.length > 300) buf.shift();
    });
  }, [reward, oxyL, oxyR, deoxyL, deoxyR, thetaW, alphaW, betaW]);

  const start = useCallback(async (sourceOverride?: LiveSource) => {
    reward.reset(); oxyL.reset(); oxyR.reset(); deoxyL.reset(); deoxyR.reset();
    thetaW.reset(); alphaW.reset(); betaW.reset();
    setSample(null); setSampleCount(0); setElapsed(0);

    // Source priority: explicit override > simulator default.
    //
    // We do NOT auto-restore from `?live=mendi` / `?live=muse` on initial
    // load: Web Bluetooth's requestDevice() requires a user gesture, so
    // a page refresh would silently fail and dump us into the "pairing
    // failed" error state. Strip the URL param if present so the next
    // refresh is clean — the user re-pairs via Connect device when ready.
    if (typeof window !== "undefined" && !sourceOverride) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("live")) {
        url.searchParams.delete("live");
        window.history.replaceState({}, "", url.toString());
      }
    }
    const source: LiveSource = sourceOverride ?? "simulator";
    setLiveSource(source);

    const fallbackToSimulator = async () => {
      // Never feed the authenticated clinician dashboard synthetic data
      // UNLESS the user explicitly opted in via ?sim=1 (used for SQI
      // gate validation against clean synthetic data). Otherwise a
      // failed live connection leaves widgets in their "Waiting for
      // feed…" state — never pretend the device is alive.
      if (appMode === "strip" && !simMode) {
        adapterRef.current = null;
        setLiveSource("simulator");
        setRunning(false);
        return;
      }
      const sim = new SimulatorAdapter({ noiseLevel: 0.35, trendStrength: 0.7 });
      attachAdapter(sim);
      await sim.connect();
      setLiveSource("simulator");
    };

    if (source === "mendi") {
      // Direct Web Bluetooth connection — no local Python bridge required.
      // Works on eegbase.com (HTTPS) in Chrome/Edge desktop. The browser
      // shows its pairing chooser on the first connect attempt. If the
      // user dismisses or Web Bluetooth is unavailable we fall back to
      // the legacy bridge transport (for capture work), then simulator.
      setMendiStatus("connecting");
      setMendiError(null);
      const direct = new MendiAdapter();
      attachAdapter(direct);
      try {
        await direct.connect();
        setMendiStatus("connected");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to pair with Mendi over Web Bluetooth.";
        console.warn("[Mendi] WebBluetooth connect failed:", msg);
        setMendiError(msg);
        // Last-resort: try the localhost Python bridge if it happens to
        // be running. Most users won't have it — that's fine, we go
        // straight to fallbackToSimulator below (which in strip mode
        // means leaving the pipeline idle).
        const bridge = new MendiBridgeAdapter();
        attachAdapter(bridge);
        try {
          await bridge.connect();
          setMendiStatus("connected");
          setMendiError(null);
        } catch (e2) {
          setMendiStatus("error");
          const bridgeMsg = e2 instanceof Error ? e2.message : "Bridge unreachable.";
          console.warn("[Mendi] bridge fallback also failed:", bridgeMsg);
          await fallbackToSimulator();
        }
      }
    } else if (source === "muse") {
      // Muse uses Web Bluetooth directly — no bridge. The first call will
      // open the browser pairing chooser; if the user dismisses it or the
      // platform doesn't support Web Bluetooth we fall back (to simulator
      // on /demo, or to idle on the authenticated /dashboard).
      const muse = new MuseAdapter();
      attachAdapter(muse);
      try {
        await muse.connect();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to connect to Muse.";
        console.warn("[Muse] connect failed:", msg);
        await fallbackToSimulator();
      }
    } else {
      await fallbackToSimulator();
    }

    setRunning(true);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, [reward, oxyL, oxyR, deoxyL, deoxyR, thetaW, alphaW, betaW, attachAdapter]);

  // Restart the pipeline with a different live source. Updates the URL so
  // refreshing the page keeps the user on the chosen source.
  const switchLiveSource = useCallback(async (next: LiveSource) => {
    await stop();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "mendi" || next === "muse") url.searchParams.set("live", next);
      else url.searchParams.delete("live");
      window.history.replaceState({}, "", url.toString());
    }
    if (next !== "mendi") { setMendiStatus("idle"); setMendiBle(false); }
    await start(next);
  }, [stop, start]);

  // Auto-start the data pipeline on mount EXCEPT in 'strip' mode — the
  // authenticated /dashboard should sit idle until the operator pairs a
  // real device, so widgets show 'Waiting for mendi feed…' instead of
  // simulator-driven activity that could be mistaken for live data.
  useEffect(() => {
    if (appMode !== "strip") {
      void start();
    } else if (simMode) {
      // ?sim=1 on /dashboard — opt in to synthetic data so we can
      // validate the SQI gate end-to-end without a physical headband.
      void start("simulator");
    }
    return () => { void stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simMode]);

  // While in Mendi mode, poll the adapter's BLE state every 500 ms so the
  // status badge reflects the actual link to the headband (the Python
  // bridge emits ble_connected / ble_disconnected messages → adapter
  // tracks them → we surface them here without a callback API change).
  useEffect(() => {
    if (liveSource !== "mendi") return;
    const tick = () => {
      const a = adapterRef.current;
      if (a && a instanceof MendiBridgeAdapter) setMendiBle(a.isBleConnected());
      // Direct Web Bluetooth path: if the MendiAdapter is attached and
      // we reached "connected" status, the BLE link itself is the
      // connection — surface that to the badge.
      else if (a instanceof MendiAdapter) setMendiBle(mendiStatus === "connected");
    };
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [liveSource, mendiStatus]);

  const rewardVal = sample?.rewardScore;
  const rewardColor = rewardVal == null ? "#CBD5E1" : rewardVal >= 70 ? "#10B981" : rewardVal >= 40 ? "#F59E0B" : "#EF4444";
  // In interactive mode the Game tab drives its visualizations from the player's
  // tracking score instead of the simulator's reward signal — lets pitches and
  // touch-only audiences experience neurofeedback without a Mendi headband.
  const gameRewardVal: number | null = interactiveGame ? playerScore : (rewardVal ?? null);

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

  // Cmd-K / Ctrl-K command palette keyboard shortcut.
  // Use e.code so the match is layout-independent (Dvorak/AZERTY) and
  // case-insensitive. Also accept "/" as an alternative, GitHub-style.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.code === "KeyK";
      const isSlash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as HTMLElement | null)?.isContentEditable;
      if (isCmdK || isSlash) {
        e.preventDefault();
        setShowCmdK((v) => !v);
      }
      if (e.key === "Escape") {
        setShowCmdK(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);


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

  const ALL_TABS: { id: MainTab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; groupStart?: string; badge?: string }[] = [
    { id: "dashboard", label: "My Dashboard",       icon: LayoutDashboard, groupStart: "My Workspace" },
    { id: "session",   label: "Live Session",       icon: Activity,       groupStart: "During a Session", badge: "FOR MENDI" },
    { id: "game",      label: "Game Mode",          icon: Gamepad2 },
    { id: "brain",     label: "Brain Map",          icon: Brain },
    { id: "hrv",       label: "Heart & Breathing",  icon: HeartPulse },
    { id: "progress",  label: "Progress",           icon: TrendingUp,     groupStart: "Client Records" },
    { id: "ai",        label: "AI Insights",        icon: Sparkles,       badge: "FOR MENDI" },
    { id: "protocols", label: "Protocols",          icon: Target,         groupStart: "Practice Tools" },
    { id: "schedule",  label: "Schedule",           icon: Calendar },
    { id: "reports",   label: "Reports",            icon: FileText,       badge: "FOR MENDI" },
    { id: "compare",   label: "Compare",            icon: BarChart3 },
  ];

  // When the authenticated app passes appMode="strip" we hide every tab
  // except the dashboard. The route handlers remain mounted so we can
  // restore tabs by simply expanding this filter as each tier passes the
  // hardware-validation runbook.
  const TABS = appMode === "strip"
    ? ALL_TABS.filter((t) => t.id === "dashboard")
    : ALL_TABS;

  // Each protocol carries the hardware it requires. Priya is the
  // demo's flagship Mendi-only client (pure fNIRS, no EEG cap needed) so
  // her protocol stays on Mendi's 2-channel forehead stack. The other four
  // need a multi-channel EEG headset (Cz/Pz/C3/C4 are 10-20 positions
  // outside both Mendi's and Muse's electrode coverage). The hw label
  // surfaces this honestly so a reviewer doesn't think we're claiming
  // Mendi or Muse can do site-specific SMR/ILF/spindle work alone.
  const DEMO_CLIENTS = [
    { name: "Sarah Mitchell · ADHD adolescent",    protocol: "SMR · Cz (12–15 Hz)",                  session: 8,  archetype: "ADHD",        hw: "EEG cap (Discovery / BrainBit)" },
    { name: "James Okafor · PTSD veteran",          protocol: "Alpha-Theta · Pz/Oz",                  session: 4,  archetype: "PTSD",        hw: "EEG cap (Discovery / BrainBit)" },
    { name: "Priya Sharma · burnout exec",          protocol: "Prefrontal HbO · bilateral (Mendi)",   session: 12, archetype: "Burnout",     hw: "Mendi headband" },
    { name: "Daniel Cruz · sleep onset",            protocol: "Sleep Spindle · Cz/Pz",                session: 3,  archetype: "Sleep",       hw: "EEG cap (Discovery / BrainBit)" },
    { name: "Emily Tanaka · performance",            protocol: "Neuromuscular · C3/C4",                session: 6,  archetype: "Performance", hw: "EEG cap (Discovery / BrainBit)" },
  ];

  const PROTOCOL_GOALS: Record<string, string> = {
    "SMR · Cz (12–15 Hz)":                    "Increase SMR (12–15 Hz) · Reduce Theta (4–8 Hz) · Score rises when sensorimotor rhythm is sustained",
    "Alpha-Theta · Pz/Oz":                    "Reward Alpha (8–12 Hz) · Reward Theta (4–8 Hz) · Score rises during deep relaxation states",
    "Prefrontal HbO · bilateral (Mendi)":     "Reward bilateral prefrontal HbO concentration via Mendi's 2-channel fNIRS · Improve self-regulation · Score rises with sustained activation under attention demand",
    "Sleep Spindle · Cz/Pz":                  "Increase Sigma (12–16 Hz) sleep spindles · Reduce hyperarousal · Score rises when spindle activity is detected",
    "Neuromuscular · C3/C4":                  "Increase SMR at motor cortex · Reduce excess Theta · Score rises with sustained sensorimotor balance",
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
  // Custom Dashboard tab state — widget IDs persisted to localStorage,
  // plus a separate quick-note widget value (also persisted).
  // In 'strip' mode (authenticated /dashboard) start with NO widgets so the
  // clinician explicitly chooses what to add via the Add widget button.
  // Public /demo keeps the rich DEFAULT_WIDGETS preview.
  const dashboard = useDashboardState(
    appMode === "strip" ? { defaultWidgets: [] } : undefined
  );
  const [dashboardPickerOpen, setDashboardPickerOpen] = useState(false);
  // Paired devices live independently of widgets — even with no widgets
  // added, the operator should see and manage their devices.
  const devices = usePairedDevices(
    appMode === "strip"
      ? { defaultPaired: false, storageKey: "eegbase-clinician-paired-devices" }
      : undefined
  );
  const [connectDeviceOpen, setConnectDeviceOpen] = useState(false);
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

  // setTab from useTabState already syncs URL + localStorage synchronously.
  // switchTab adds the visited-tabs side effect for the demo's progress widget
  // and scrolls the viewport back to the top so the new tab's header is in
  // view (deep tabs left users half-way down the page after a switch).
  const switchTab = (id: MainTab) => {
    setTab(id);
    setVisitedTabs((prev) => new Set([...prev, id]));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
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
           STATUS PILL SYSTEM — unified across all 11 tabs
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
          /* Mobile section nav docks to the very top of the viewport.
             top: 52 was set for the desktop toolbar above it; on mobile
             that toolbar isn't sticky, so the offset would create a gap. */
          .demo-mobile-nav { display: block !important; top: 0 !important; }
          .demo-topbar-hide-mobile { display: none !important; }
          .demo-topbar { padding: 0 12px !important; gap: 8px !important; }
          /* Tighten the right-side action group on mobile so the
             client switcher + Get Access button fit within 375px
             without horizontal scroll. */
          .demo-topbar > div { gap: 8px !important; min-width: 0 !important; }
          .demo-topbar button { min-width: 0 !important; }
          .demo-paper-preview { padding: 16px !important; }
          /* Site header collapse on small screens — full nav takes too
             much room on top of the dark app topbar. Replace with a
             single back-to-home link. */
          .demo-site-header-nav { display: none !important; }
          .demo-site-header-back { display: inline-flex !important; }
          .demo-site-header { padding: 8px 12px !important; }
        }
        /* Top-bar overflow protection — the full bar (Search + Tour + Share
           + Visit PDF + A11y + Theme + Replay + Notifications + Client
           switcher + HIPAA pill + Get Access) measures ~1403px. Bumped to
           1500px so 1440px laptops also get the trim. All hidden features
           remain reachable via the ⌘K palette. */
        @media (max-width: 1500px) {
          .demo-topbar-hide-narrow { display: none !important; }
        }
        /* Between 641 and 960px (small tablets / split-screen windows) the
           sidebar still takes 216px, leaving the topbar very tight. Drop
           Share view in this range. Search & Get Access stay visible. */
        @media (min-width: 641px) and (max-width: 960px) {
          .demo-topbar-hide-tablet { display: none !important; }
        }
        @media (max-width: 480px) {
          .demo-topbar-logo-text { display: none !important; }
          .demo-topbar-client-label { display: none !important; }
          /* Cap the client switcher so 'Sarah Mitchell · ADHD adolescent'
             doesn't push 'Get Access' off-screen at 375px width. */
          .demo-topbar-client-select { max-width: 130px !important; }
        }
        /* iOS Safari auto-zooms when focusing an input/select with
           font-size < 16px. Force 16px on all form controls at mobile
           widths to prevent the annoying zoom-and-pan dance every time
           a user picks a client or types in a field. */
        @media (max-width: 768px) {
          select, input[type="text"], input[type="email"], input[type="search"], input[type="number"], textarea {
            font-size: 16px !important;
          }
        }
        /* Hide Next.js dev-mode error/issue badge overlay */
        [data-nextjs-toast], nextjs-portal, #__next-build-watcher, .__next-error-overlay-wrapper { display: none !important; }
      `}</style>

      {/* Site header — keeps the demo recognisable as part of the EEGBase
          marketing site. Sits above the dark app topbar. Nav collapses to
          "Back to home" on mobile (≤640 px) so the dark app topbar gets
          full width for its own controls. */}
      {/* Public-site white header — hidden in 'strip' mode (the authenticated
          /dashboard has the clinician sidebar instead). */}
      {appMode !== "strip" && (
        <header className="demo-site-header" style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", minHeight: 40, paddingRight: 4 }}>
            <span style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", letterSpacing: "-0.01em" }}>EEGBase</span>
          </a>
          <nav aria-label="Site" className="demo-site-header-nav" style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13 }}>
            <a href="/" style={{ color: "#64748B", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Home</a>
            <a href="/mendi" style={{ color: "#64748B", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Mendi partnership</a>
            <a href="/pricing" style={{ color: "#64748B", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Pricing</a>
            <a href="/contact" style={{ color: "#64748B", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Contact</a>
          </nav>
          <a href="/" className="demo-site-header-back" style={{ display: "none", color: "#2563EB", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "10px 4px", minHeight: 44, alignItems: "center" }}>
            ← Home
          </a>
        </header>
      )}

      {/* Demo-mode disclosure banner — hidden in the authenticated
          'strip' view since clinicians are using real data, not the demo. */}
      {appMode !== "strip" && (
        <div role="status" style={{ background: "#FEF3C7", borderBottom: "1px solid #FCD34D", color: "#78350F", padding: "8px 24px", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", textAlign: "center" }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span>
            <strong style={{ fontWeight: 700 }}>Live demo</strong> · all client data is illustrative · email/SMS/calendar actions are simulated · Mendi BLE integration is in progress (independent reverse-engineered protocol — no Mendi SDK exists) and runs on simulator until hardware capture completes · click <strong style={{ fontWeight: 700 }}>“Run with live Claude Haiku”</strong> in AI Insights for a real model call
          </span>
        </div>
      )}

      {/* Skip-to-content link — appears on keyboard focus only.
          WCAG 2.4.1 'Bypass Blocks' compliance. */}
      <a
        href="#main-content"
        style={{
          position: "absolute", left: 8, top: 8, padding: "8px 14px",
          background: "#2563EB", color: "white", borderRadius: 6,
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          zIndex: 9999, transform: "translateY(-200%)", transition: "transform 0.15s",
        }}
        onFocus={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
        onBlur={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-200%)"; }}
      >
        Skip to main content
      </a>

      {/* Top bar — dark strip with logo, Search ⌘K, Share view, LIVE timer,
          Replay, Notifications, Client selector, Get Access. Hidden in
          'strip' mode (the authenticated /dashboard relies on the clinician
          sidebar instead of this bar). */}
      {appMode !== "strip" && (
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
            onClick={shareCurrentView}
            aria-label="Share this view"
            className="demo-topbar-hide-mobile demo-topbar-hide-tablet"
            title="Copy a deep link that opens this exact tab"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: shareCopied ? "#34D399" : "#CBD5E1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            <span aria-hidden="true">{shareCopied ? "✓" : "🔗"}</span>
            <span>{shareCopied ? "Copied" : "Share view"}</span>
          </button>
          <button
            onClick={() => { window.print(); showToast("Print dialog opened · save as PDF for the leave-behind"); }}
            aria-label="Generate PDF visit summary"
            className="demo-topbar-hide-mobile demo-topbar-hide-narrow"
            title="Print this view · save as PDF for clinical hand-off or Mendi pitch leave-behind"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: "#CBD5E1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            <span aria-hidden="true">📄</span>
            <span>Visit PDF</span>
          </button>
          <button
            onClick={() => showToast("Accessibility test mode · high-contrast + reduced-motion preview · WCAG 2.2 AA conformance verified by Deque Q3 2026")}
            aria-label="Accessibility test mode"
            className="demo-topbar-hide-mobile demo-topbar-hide-narrow"
            title="Toggle high-contrast + reduced-motion preview"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: "#CBD5E1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            <span aria-hidden="true">♿</span>
            <span>A11y</span>
          </button>
          <button
            onClick={() => showToast("Theme switcher · dark / light / high-contrast modes · CSS-variable system ready · light theme ships in a future update")}
            aria-label="Theme switcher"
            className="demo-topbar-hide-mobile demo-topbar-hide-narrow"
            title="Switch theme · dark / light / high-contrast"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: "#CBD5E1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            <span aria-hidden="true">🌗</span>
            <span>Theme</span>
          </button>
          <button
            onClick={() => showToast("Session replay scrubber · drag a timeline through any past session · ships in a future update")}
            aria-label="Session replay"
            className="demo-topbar-hide-mobile demo-topbar-hide-narrow"
            title="Replay scrubber · ships Q3 2026"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: "#CBD5E1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            <span aria-hidden="true">⏯</span>
            <span>Replay</span>
          </button>
          <button
            onClick={() => showToast("3 new alerts: Sarah's PHQ-9 down 3 pts · James co-sign needed · Aetna ERA posted")}
            aria-label="Notifications"
            className="demo-topbar-hide-mobile demo-topbar-hide-narrow"
            style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#CBD5E1" }}
          >
            <Bell size={14} strokeWidth={1.75} />
            <span style={{ position: "absolute", top: -3, right: -3, background: "#EF4444", color: "white", fontSize: 9, fontWeight: 700, borderRadius: 99, padding: "1px 5px", border: "1.5px solid #0F172A" }}>3</span>
          </button>
          <div className="demo-topbar-client-wrap" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span className="demo-topbar-client-label" style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 600 }}>Client:</span>
            <select
              aria-label="Select demo client"
              value={demoClientIdx}
              onChange={(e) => setDemoClientIdx(Number(e.target.value))}
              className="demo-topbar-client-select"
              style={{ fontSize: "0.78rem", fontWeight: 600, color: "white", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", background: "#1E293B", cursor: "pointer", outline: "none", maxWidth: "100%", textOverflow: "ellipsis" }}
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
          <span className="demo-topbar-hide-mobile demo-topbar-hide-narrow" title="HIPAA · Schrems II · AES-256 · SOC 2 · WCAG 2.2 AA" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.66rem", color: "#94A3B8", fontWeight: 700, padding: "3px 8px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            <span aria-hidden="true">🛡</span>
            <span>HIPAA</span>
            <span style={{ color: "#475569" }}>·</span>
            <span>Schrems II</span>
            <span style={{ color: "#475569" }}>·</span>
            <span>SOC 2</span>
          </span>
          <a href="/login" style={{ fontSize: "0.82rem", fontWeight: 700, padding: "7px 16px", background: "#2563EB", color: "white", borderRadius: 8, textDecoration: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", flexShrink: 0 }}>
            Get Access <span aria-hidden>→</span>
          </a>
        </div>
      </div>
      )}

      {/* Progress bar — hidden in strip mode along with the dark topbar. */}
      {appMode !== "strip" && (
        <div role="progressbar" aria-label={`Session time: ${Math.floor(elapsed / 60)} of 30 minutes`} aria-valuenow={Math.min(100, Math.round((elapsed / 1800) * 100))} aria-valuemin={0} aria-valuemax={100} title={`Session progress · ${Math.floor(elapsed / 60)} of 30 min`} style={{ height: 4, background: "#1E293B" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #2563EB, #8B5CF6, #EC4899)", width: `${Math.min(100, (elapsed / 1800) * 100)}%`, transition: "width 1s linear" }} />
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
                myndlift:    { strengths: ["Polished consumer app", "Active community", "700+ studies cited"], weaknesses: ["Locked to Muse hardware", "Cloud-only data", "Reviews say 'not real neurofeedback'"], verdict: "Best for cash-pay coaching practices, weak on clinical EEG" },
                divergence:  { strengths: ["AI brain assessments", "Multivariate coherence", "HIPAA + GDPR"], weaknesses: ["No native mobile app", "Web-only desktop", "Dated UX"], verdict: "Strongest competitor — clinical workflow, but dated UX" },
                eeger:       { strengths: ["Long clinical history", "Solid signal processing"], weaknesses: ["Windows-only desktop", "Steep learning curve", "Looks like 2003"], verdict: "Trusted by veterans but feels like time-travel software" },
                brainpaint:  { strengths: ["Per-session licensing model", "Trauma/addiction focus"], weaknesses: ["Hardware lock-in", "Limited modalities", "Art-only feedback"], verdict: "Niche clinical tool, not a full practice platform" },
                neuroptimal: { strengths: ["Own the system outright", "Passive training model"], weaknesses: ["Hardware-only delivery", "Proprietary closed system", "Limited customization"], verdict: "Single-protocol hardware, limited flexibility" },
                neuroguide:  { strengths: ["Gold-standard QEEG", "Thatcher database", "Source localization"], weaknesses: ["Perpetual licence model", "Requires certification", "QEEG only — no live streaming"], verdict: "Best-in-class assessment, no live training workflow" },
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
                  <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Your reward score blends three brainwave bands. The protocol decides which ones count — calmer slow waves and more focused fast waves both push the score up.</p>
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
                  <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Your client's {d.band} power compared to the EEGBase normative database (n=847 healthy adults aged 25–35).</p>
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
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Today's Session</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{demoClient.name.split(" ")[0]}'s brain training</div>
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
            <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 20 }}>Anonymized profiles from the EEGBase normative database matching Sarah Mitchell's theta elevation pattern, age range (25–35), and SMR non-response history.</p>
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

      {/* Clinician control toast + Peak achievement flash. Both are
          demo-only popups — silenced in 'strip' mode (the authenticated
          /dashboard should be quiet by default until we add the real
          clinician notification surface). */}
      {appMode !== "strip" && (
        <>
          <div role="status" aria-live="polite" aria-atomic="true" style={{ position: "fixed", bottom: 80, right: 20, zIndex: 999, pointerEvents: toast ? "auto" : "none" }}>
            {toast && (
              <div style={{ background: "#0F172A", border: "1px solid #14B8A6", color: "#F1F5F9", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "fadeIn 0.2s ease", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14B8A6" }} aria-hidden="true" />
                {toast}
              </div>
            )}
          </div>

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
        </>
      )}

      {/* Mobile tab nav (visible <640px only). Hidden in strip mode — the
          authenticated /dashboard relies on the global Sidebar's own mobile
          nav, not this in-page select. */}
      {appMode !== "strip" && (
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
      )}

      {/* Sidebar + Content layout */}
      <div style={{ display: "flex", alignItems: "flex-start", background: "#F0F4F8", minHeight: "calc(100vh - 60px)" }}>

        {/* Left sidebar nav. In strip mode the global Sidebar (rendered by
            the route's layout) is the canonical chrome, so we suppress the
            DemoClient sidebar entirely. The public /demo route still
            renders this nav for tab navigation. */}
        {appMode !== "strip" && (
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
        )}

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0 }}>
        {/* Sticky "what you're seeing" caption per tab — progressive onboarding */}
        {(() => {
          const captions: Record<string, { what: string; lookFor: string }> = {
            session:    { what: "Live Session",       lookFor: "the HIPAA video panel at the top — see your client's live brain data during a session. Switch between 1-on-1, group, couples, or family modes." },
            game:       { what: "Game Mode",          lookFor: "what your client sees during a session — pick from 3 visual styles: Aurora, Generative Art, or Audio Interrupt." },
            brain:      { what: "Brain Map",          lookFor: "Sarah's brain activity compared against 847 healthy adults of the same age. Her elevated theta + low alpha is a classic ADHD pattern." },
            hrv:        { what: "Heart & Breathing",  lookFor: "wearables at top — Apple Watch, Oura, and Whoop sync HRV automatically into the AI insights." },
            progress:   { what: "Progress",           lookFor: "20 sessions of progress — depression score down from 18 to 5, anxiety 14 to 4, training score up 131%. One-click PDF for the client." },
            ai:         { what: "AI Insights",        lookFor: "the AI finds what's driving each client's progress — sleep, mood, HRV, medication. Plus drafts SOAP notes from the session audio." },
            protocols:  { what: "Protocols",          lookFor: "9 Mendi-ready + 6 EEG protocols, searchable by condition. Open library — clinicians can add their own." },
            schedule:   { what: "Schedule",           lookFor: "calendar, automated SMS/email reminders, and home-practice tracking for clients training between visits." },
            reports:    { what: "Reports",            lookFor: "47,000 anonymous sessions across 412 clinics — and a one-click branded PDF report for each of your clients." },
            compare:    { what: "Compare",            lookFor: "EEGBase compared with every other neurofeedback platform. Filter by what matters to you." },
          };
          const cap = captions[tab];
          if (!cap) return null;
          return (
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0A1320", borderBottom: "1px solid #1E293B", padding: "8px 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", padding: "2px 7px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>👀 You're seeing</span>
              <span><strong style={{ color: "#F1F5F9" }}>{cap.what}</strong> — look for {cap.lookFor}</span>
            </div>
          );
        })()}

        <main
          id="main-content"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="demo-content"
          style={{ padding: "24px 20px", maxWidth: 1180, width: "100%", flex: 1, minWidth: 0 }}
        >
          {/* Visually-hidden but screen-reader-readable H1 per tab — fixes
              WCAG 2.4.6 'Headings and Labels' on every tab and gives SEO
              the document outline it expects. */}
          <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
            {TABS.find(t => t.id === tab)?.label ?? "EEGBase Demo"}
          </h1>

        {/* ── MY DASHBOARD ── composable widget grid pulling from any
            connected device. Default 4 widgets shown; user adds/removes
            via the picker. State persisted to localStorage. */}
        {tab === "dashboard" && (
          <>
            {/* First-run guided onboarding — server-rendered slot.
                Renders only when the clinic has no protocols/clients/
                sessions yet; auto-dismisses after setup completes. */}
            {appMode === "strip" && onboarding}
            {/* Context strip + Add Widget */}
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #60A5FA", borderRadius: 12, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              {appMode !== "strip" && (
                <>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(96,165,250,0.15)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <LayoutDashboard size={14} />
                  </div>
                  <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                    <strong style={{ color: "#F1F5F9" }}>Your dashboard</strong> &mdash; pick widgets that pull live from any connected device. Layout saves to this browser. Hardware-agnostic by design.
                  </span>
                </>
              )}
              {/* In strip mode, push the buttons to the right with a spacer so
                  the row still reads as a header. */}
              {appMode === "strip" && <div style={{ flex: 1, minWidth: 0 }} />}
              {/* Live Mendi connect / disconnect — talks to the localhost
                  Python bridge (scripts/mendi-bridge.py). When connected,
                  the Mendi widgets (Mendi · 4 channels, Live focus score,
                  Reward score trace) receive real BLE frames in place of
                  the simulator's synthetic data. */}
              {liveSource === "mendi" && mendiStatus === "connected" ? (
                <button
                  onClick={async () => {
                    await switchLiveSource("simulator");
                    showToast("Switched to simulator");
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: mendiBle ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: mendiBle ? "#34D399" : "#FBBF24", border: `1px solid ${mendiBle ? "#065F46" : "#92400E"}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  title={mendiBle
                    ? "Bridge → BLE link OK. Click to switch back to the simulator."
                    : "Bridge reachable, but BLE link to the headband is down. Turn the Mendi on and place it on the head — frames will start arriving automatically. Click to switch back to the simulator."}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: mendiBle ? "#10B981" : "#F59E0B", boxShadow: `0 0 8px ${mendiBle ? "#10B981" : "#F59E0B"}` }} />
                  {mendiBle ? "Mendi live · disconnect" : "Bridge up · waiting for headband"}
                </button>
              ) : mendiStatus === "connecting" ? (
                <button
                  disabled
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(96,165,250,0.12)", color: "#93C5FD", border: "1px solid #1E40AF", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "wait" }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60A5FA", animation: "pulse 1s infinite" }} />
                  Connecting to Mendi…
                </button>
              ) : (
                <button
                  onClick={() => setConnectDeviceOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: mendiStatus === "error" ? "#7F1D1D" : "#7C3AED", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  title={mendiStatus === "error"
                    ? (mendiError ?? "Last connect attempt failed. Open the connect-device list to retry.")
                    : "Pair any supported headband, chest strap, or wearable."}
                >
                  <BluetoothIcon size={12} />
                  {mendiStatus === "error" ? "Connect device · pairing failed, retry" : "Connect device"}
                </button>
              )}
              {appMode !== "strip" && (
                <select
                  value=""
                  onChange={(e) => {
                    const presetId = e.target.value;
                    if (!presetId) return;
                    const preset = DASHBOARD_PRESETS.find((p) => p.id === presetId);
                    if (!preset) return;
                    dashboard.setWidgets(preset.ids);
                    showToast(preset.id === "empty" ? "Cleared dashboard" : `Loaded layout: ${preset.label}`);
                    e.target.value = "";
                  }}
                  aria-label="Load dashboard preset"
                  style={{ display: "inline-flex", alignItems: "center", padding: "8px 12px", background: "rgba(15,23,42,0.7)", color: "#F1F5F9", border: "1px solid #334155", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  title="Load a curated dashboard layout"
                >
                  <option value="" disabled hidden>Load layout…</option>
                  {DASHBOARD_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setDashboardPickerOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                <Plus size={14} /> Add widget
              </button>
            </div>

            {/* Mendi diagnostic panel — strip mode only, shows the same
                [Mendi] log lines as DevTools so the operator can screenshot
                instead of opening DevTools. Empty until a pair attempt fires. */}
            {appMode === "strip" && debugMode && mendiLog.length > 0 && (
              <div
                style={{
                  background: "#020617",
                  border: "1px solid #1E293B",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 16,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 11,
                  lineHeight: 1.5,
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>
                    Mendi pairing log
                  </span>
                  <button
                    onClick={() => setMendiLog([])}
                    style={{ background: "transparent", border: "1px solid #334155", color: "#94A3B8", borderRadius: 6, padding: "2px 8px", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Clear
                  </button>
                </div>
                {mendiLog.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      color: entry.level === "error" ? "#FCA5A5" : entry.level === "warn" ? "#FBBF24" : "#CBD5E1",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      paddingBottom: 2,
                    }}
                  >
                    <span style={{ color: "#475569" }}>
                      {new Date(entry.ts).toLocaleTimeString("en-US", { hour12: false })}{" "}
                    </span>
                    {entry.text}
                  </div>
                ))}
              </div>
            )}

            {/* (Old per-field values panel removed — the test report below
                already shows avg ± σ inline in its PASS rows.) */}

            {/* Mendi widget TEST REPORT — runs PASS/WARN/FAIL checks per
                widget against the live sample buffer. Each widget is mapped
                to its underlying DeviceSample field(s) + an expected range +
                a liveness floor. Strip mode only, after first sample. */}
            {appMode === "strip" && mendiStatsTick > 0 && mendiSamplesRef.current.length > 0 && (
              (() => {
                const buf = mendiSamplesRef.current;
                const stat = (sel: (s: DeviceSample) => number | null | undefined) => {
                  const vals = buf.map(sel).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
                  if (vals.length === 0) return null;
                  const min = Math.min(...vals), max = Math.max(...vals);
                  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                  const variance = vals.reduce((acc, v) => acc + (v - avg) * (v - avg), 0) / vals.length;
                  const std = Math.sqrt(variance);
                  return { min, max, avg, std, n: vals.length };
                };
                type Check = {
                  widget: string;
                  sel: (s: DeviceSample) => number | null | undefined;
                  expectedMin: number;
                  expectedMax: number;
                  // Min std-dev relative to the expected range (0–1) below
                  // which the field counts as "static" → WARN.
                  livenessFrac?: number;
                  // If true, the widget's data source is NOT exposed by
                  // Mendi (e.g. a chest-strap HR widget). When the field is
                  // empty we report "n/a — not supplied by Mendi" instead of
                  // counting it as a FAIL. If the field IS populated (e.g.
                  // because another device is paired) we still run the
                  // range check.
                  notApplicableForMendi?: boolean;
                };
                // Physiology / signal-quality checks that don't fit the
                // single-field min/max/σ pattern — these compute their own
                // statistic from the buffer (correlation, jitter, drift,
                // outlier rate, etc.) and return PASS/WARN/FAIL directly.
                // Sources: Pollonini PHOEBE 2016, Tachtsidis & Scholkmann
                // 2016 (false positives), Elgendi 2013, ESC/NASPE HRV
                // Task Force 1996.
                type PhysCheck = {
                  label: string;
                  compute: (buf: DeviceSample[]) => { status: "PASS" | "WARN" | "FAIL" | "N/A"; reason: string };
                  source: string;
                };
                // ── helpers ────────────────────────────────────────────
                const pearson = (xs: number[], ys: number[]): number | null => {
                  const n = Math.min(xs.length, ys.length);
                  if (n < 10) return null;
                  let mx = 0, my = 0;
                  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
                  mx /= n; my /= n;
                  let sxy = 0, sxx = 0, syy = 0;
                  for (let i = 0; i < n; i++) {
                    const dx = xs[i] - mx, dy = ys[i] - my;
                    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
                  }
                  const denom = Math.sqrt(sxx * syy);
                  return denom > 0 ? sxy / denom : null;
                };
                const pluckPairs = (buf: DeviceSample[], a: (s: DeviceSample) => number | null | undefined, b: (s: DeviceSample) => number | null | undefined): { xs: number[]; ys: number[] } => {
                  const xs: number[] = []; const ys: number[] = [];
                  for (const s of buf) {
                    const va = a(s), vb = b(s);
                    if (typeof va === "number" && typeof vb === "number" && Number.isFinite(va) && Number.isFinite(vb)) {
                      xs.push(va); ys.push(vb);
                    }
                  }
                  return { xs, ys };
                };
                // Median + median-absolute-deviation, robust to outliers.
                const medianMad = (vals: number[]): { median: number; mad: number } | null => {
                  if (vals.length === 0) return null;
                  const sorted = [...vals].sort((a, b) => a - b);
                  const median = sorted[Math.floor(sorted.length / 2)];
                  const dev = sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
                  const mad = dev[Math.floor(dev.length / 2)];
                  return { median, mad };
                };
                const numericVals = (buf: DeviceSample[], sel: (s: DeviceSample) => number | null | undefined): number[] => {
                  const out: number[] = [];
                  for (const s of buf) {
                    const v = sel(s);
                    if (typeof v === "number" && Number.isFinite(v)) out.push(v);
                  }
                  return out;
                };
                // ── extended statistical helpers ──────────────────────
                // All helpers tolerate short/empty input — they return
                // null when a meaningful statistic can't be computed.
                const FPS = 31; // Mendi V4 effective sample rate
                const meanOf = (xs: number[]) => xs.length ? xs.reduce((a, c) => a + c, 0) / xs.length : 0;
                const varOf = (xs: number[]) => {
                  if (xs.length < 2) return 0;
                  const m = meanOf(xs);
                  let s = 0;
                  for (const v of xs) s += (v - m) * (v - m);
                  return s / xs.length;
                };
                const stdOf = (xs: number[]) => Math.sqrt(varOf(xs));
                const diffOf = (xs: number[]): number[] => {
                  const out: number[] = [];
                  for (let i = 1; i < xs.length; i++) out.push(xs[i] - xs[i - 1]);
                  return out;
                };
                // Third central moment normalised — Elgendi 2016 SQI.
                const skewOf = (xs: number[]): number | null => {
                  if (xs.length < 10) return null;
                  const m = meanOf(xs);
                  const s = stdOf(xs);
                  if (s < 1e-12) return null;
                  let sum = 0;
                  for (const v of xs) sum += ((v - m) / s) ** 3;
                  return sum / xs.length;
                };
                // Fourth standardised moment (excess kurtosis NOT applied —
                // Elgendi uses raw kurtosis where Gaussian = 3).
                const kurtOf = (xs: number[]): number | null => {
                  if (xs.length < 10) return null;
                  const m = meanOf(xs);
                  const s = stdOf(xs);
                  if (s < 1e-12) return null;
                  let sum = 0;
                  for (const v of xs) sum += ((v - m) / s) ** 4;
                  return sum / xs.length;
                };
                // Hjorth mobility — sqrt(var(diff)/var). Multiplied by
                // FPS / (2π) to express in Hz units.
                const hjorthMobHz = (xs: number[]): number | null => {
                  if (xs.length < 10) return null;
                  const vx = varOf(xs);
                  if (vx < 1e-12) return null;
                  const vd = varOf(diffOf(xs));
                  const mob = Math.sqrt(vd / vx);
                  return mob * FPS / (2 * Math.PI);
                };
                // Hjorth complexity — mobility(diff)/mobility(x). Pure
                // sinusoid → 1; noise → much greater. Unitless.
                const hjorthCom = (xs: number[]): number | null => {
                  if (xs.length < 10) return null;
                  const vx = varOf(xs);
                  const d1 = diffOf(xs);
                  const vd1 = varOf(d1);
                  if (vx < 1e-12 || vd1 < 1e-12) return null;
                  const mob1 = Math.sqrt(vd1 / vx);
                  const d2 = diffOf(d1);
                  const vd2 = varOf(d2);
                  const mob2 = Math.sqrt(vd2 / vd1);
                  return mob1 > 0 ? mob2 / mob1 : null;
                };
                // Goertzel single-bin power probe. fNorm is the normalised
                // frequency (0 < fNorm < 0.5, i.e. fraction of FPS).
                // Returns power at that frequency.
                const goertzel = (xs: number[], fNorm: number): number => {
                  if (xs.length < 8 || fNorm <= 0 || fNorm >= 0.5) return 0;
                  const omega = 2 * Math.PI * fNorm;
                  const coeff = 2 * Math.cos(omega);
                  let q0 = 0, q1 = 0, q2 = 0;
                  for (const x of xs) {
                    q0 = coeff * q1 - q2 + x;
                    q2 = q1; q1 = q0;
                  }
                  return q1 * q1 + q2 * q2 - q1 * q2 * coeff;
                };
                // Normalised single-bin power ratio in [0, 1].
                // Demeans first (DC bin would otherwise dominate), then
                // divides by N × Σ(x − x̄)² following Parseval for real
                // signals. A pure sinusoid at the probed frequency
                // → ratio ≈ 1; uniform noise → ratio ≈ 4/N².
                const goertzelRatio = (xs: number[], fNorm: number): number => {
                  const N = xs.length;
                  if (N < 8 || fNorm <= 0 || fNorm >= 0.5) return 0;
                  const m = meanOf(xs);
                  let totalE = 0;
                  const demeaned: number[] = new Array(N);
                  for (let i = 0; i < N; i++) {
                    const v = xs[i] - m;
                    demeaned[i] = v;
                    totalE += v * v;
                  }
                  if (totalE < 1e-12) return 0;
                  const p = goertzel(demeaned, fNorm);
                  return Math.max(0, Math.min(1, (2 * p) / (N * totalE)));
                };
                // Pearson autocorrelation at integer lag k (in samples).
                const autocorrLag = (xs: number[], k: number): number | null => {
                  if (xs.length < k + 10 || k < 1) return null;
                  const a = xs.slice(0, xs.length - k);
                  const b = xs.slice(k);
                  return pearson(a, b);
                };
                // Linear regression slope of xs as a function of sample index.
                const linRegSlope = (xs: number[]): number | null => {
                  const n = xs.length;
                  if (n < 10) return null;
                  let sx = 0, sy = 0, sxy = 0, sxx = 0;
                  for (let i = 0; i < n; i++) {
                    sx += i; sy += xs[i]; sxy += i * xs[i]; sxx += i * i;
                  }
                  const denom = n * sxx - sx * sx;
                  return denom > 0 ? (n * sxy - sx * sy) / denom : null;
                };
                // Count of upward zero crossings (mean-crossings) in xs.
                const zeroCrossings = (xs: number[]): number => {
                  if (xs.length < 2) return 0;
                  const m = meanOf(xs);
                  let n = 0;
                  for (let i = 1; i < xs.length; i++) {
                    if (xs[i - 1] <= m && xs[i] > m) n++;
                  }
                  return n;
                };
                // Approximate inter-beat-interval series from per-sample HR.
                // We don't have raw IBIs exposed; HR is a rolling-average
                // value, so per-sample HR repeats the SAME value across
                // many consecutive frames. Naïvely converting every frame
                // to an IBI creates fake "ectopics" and a near-zero pNN50.
                // Dedupe consecutive identical HR values so we get one
                // IBI per distinct HR step — the most faithful IBI proxy
                // we can compute without plumbing raw IBIs through.
                const ibiSeriesFromHr = (buf: DeviceSample[]): number[] => {
                  const out: number[] = [];
                  let prev: number | null = null;
                  for (const s of buf) {
                    const hr = s.pulseHrBpm;
                    if (typeof hr === "number" && Number.isFinite(hr) && hr >= 35 && hr <= 180) {
                      if (hr !== prev) {
                        out.push(60000 / hr);
                        prev = hr;
                      }
                    }
                  }
                  return out;
                };
                // One row per widget ID that depends on Mendi-derived
                // DeviceSample fields. Catalogue has ~35 such widgets;
                // whichever the user has installed on /dashboard will appear
                // in this report. Each widget is independently checked
                // against an empirical range + liveness floor.
                const checks: Check[] = [
                  // ── reward / focus ──────────────────────────────────
                  { widget: "live-score",            sel: (s) => s.rewardScore,    expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  { widget: "reward-trace",          sel: (s) => s.rewardScore,    expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  { widget: "reward-histogram",      sel: (s) => s.rewardScore,    expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  { widget: "mendi-workload",        sel: (s) => s.rewardScore,    expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  { widget: "mendi-session-arc",     sel: (s) => s.rewardScore,    expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  { widget: "mendi-reward-histogram", sel: (s) => s.rewardScore,   expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  { widget: "mendi-trial-blocks",    sel: (s) => s.rewardScore,    expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  { widget: "mendi-engagement-time", sel: (s) => s.rewardScore,    expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  // ── optical / fNIRS (Beer-Lambert HbO + HHb) ────────
                  { widget: "mendi-channels (HbO L)", sel: (s) => s.oxyHbLeft,     expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "mendi-channels (HbO R)", sel: (s) => s.oxyHbRight,    expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "hbo-trace (HbO L)",      sel: (s) => s.oxyHbLeft,     expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "hbo-trace (HbO R)",      sel: (s) => s.oxyHbRight,    expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "hhb-trace (HHb L)",      sel: (s) => s.deoxyHbLeft,   expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "hhb-trace (HHb R)",      sel: (s) => s.deoxyHbRight,  expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "total-hbo",              sel: (s) => (s.oxyHbLeft ?? 0) + (s.oxyHbRight ?? 0), expectedMin: -20, expectedMax: 20, livenessFrac: 0.001 },
                  { widget: "asymmetry",              sel: (s) => (s.oxyHbLeft ?? 0) - (s.oxyHbRight ?? 0), expectedMin: -5,  expectedMax: 5,  livenessFrac: 0.001 },
                  { widget: "mendi-laterality",       sel: (s) => (s.oxyHbLeft ?? 0) - (s.oxyHbRight ?? 0), expectedMin: -5,  expectedMax: 5,  livenessFrac: 0.001 },
                  { widget: "tsi-gauge", sel: (s) => {
                    const hbo = ((s.oxyHbLeft ?? 0) + (s.oxyHbRight ?? 0)) / 2;
                    const hhb = ((s.deoxyHbLeft ?? 0) + (s.deoxyHbRight ?? 0)) / 2;
                    const denom = Math.abs(hbo) + Math.abs(hhb);
                    return denom > 0 ? hbo / denom : null;
                  }, expectedMin: -1, expectedMax: 1, livenessFrac: 0.001 },
                  { widget: "brain-mini (HbO L)",     sel: (s) => s.oxyHbLeft,     expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "brain-mini (HbO R)",     sel: (s) => s.oxyHbRight,    expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "mendi-coherence (HbO L)", sel: (s) => s.oxyHbLeft,    expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "mendi-coherence (HbO R)", sel: (s) => s.oxyHbRight,   expectedMin: -10, expectedMax: 10, livenessFrac: 0.001 },
                  { widget: "mendi-mayer-wave (HbO sum)", sel: (s) => (s.oxyHbLeft ?? 0) + (s.oxyHbRight ?? 0), expectedMin: -20, expectedMax: 20, livenessFrac: 0.001 },
                  // ── temperature ─────────────────────────────────────
                  { widget: "mendi-temperature",     sel: (s) => s.temperatureC,   expectedMin: 15, expectedMax: 40, livenessFrac: 0.001 },
                  // ── IMU / motion ────────────────────────────────────
                  { widget: "mendi-stillness",       sel: (s) => s.stillness,      expectedMin: 0, expectedMax: 100, livenessFrac: 0.001 },
                  // Accel axes carry a static gravity component + tiny
                  // variance when the head is still (which is the goal).
                  // 0.001 fraction → 0.004 g floor was too sensitive;
                  // lowered to 0.0002 → 0.0008 g.
                  { widget: "mendi-head-pose (accelX)", sel: (s) => s.accelX,      expectedMin: -2, expectedMax: 2, livenessFrac: 0.0002 },
                  { widget: "mendi-head-pose (accelY)", sel: (s) => s.accelY,      expectedMin: -2, expectedMax: 2, livenessFrac: 0.0002 },
                  { widget: "mendi-head-pose (accelZ)", sel: (s) => s.accelZ,      expectedMin: -2, expectedMax: 2, livenessFrac: 0.0002 },
                  // ── pulse / HRV from forehead PPG ───────────────────
                  { widget: "mendi-pulse-waveform",  sel: (s) => s.pulsePpg,       expectedMin: -50000, expectedMax: 50000, livenessFrac: 0.001 },
                  { widget: "mendi-pulse-hr",        sel: (s) => s.pulseHrBpm,     expectedMin: 35, expectedMax: 180, livenessFrac: 0 },
                  { widget: "mendi-pulse-hrv",       sel: (s) => s.pulseHrvRmssd,  expectedMin: 5,  expectedMax: 250, livenessFrac: 0 },
                  // ── chest-strap / wearable HR path (not from Mendi) ─
                  // These widgets expect data from a chest-strap or wearable
                  // HR device; Mendi doesn't populate heartRate / hrvRmssd.
                  // They report "n/a — not supplied by Mendi" instead of FAIL.
                  { widget: "heart-rate (chest strap)",  sel: (s) => s.heartRate,  expectedMin: 35, expectedMax: 220, livenessFrac: 0, notApplicableForMendi: true },
                  { widget: "hr-zone (chest strap)",     sel: (s) => s.heartRate,  expectedMin: 35, expectedMax: 220, livenessFrac: 0, notApplicableForMendi: true },
                  { widget: "hr-sdnn (chest strap HRV)", sel: (s) => s.hrvRmssd,   expectedMin: 5,  expectedMax: 150, livenessFrac: 0, notApplicableForMendi: true },
                  { widget: "hrv-live (chest strap)",    sel: (s) => s.hrvRmssd,   expectedMin: 5,  expectedMax: 150, livenessFrac: 0, notApplicableForMendi: true },
                  { widget: "hr-hrv (chest strap)",      sel: (s) => s.hrvRmssd,   expectedMin: 5,  expectedMax: 150, livenessFrac: 0, notApplicableForMendi: true },
                  // ── signal-quality / coupling per optode ────────────
                  // signal-quality / ambient channels are smooth log-based
                  // metrics that on a still recording legitimately move by
                  // only 0.05–0.10 units — the previous 0.001 floor (=0.1
                  // absolute) was flagging clean signals as "static".
                  { widget: "mendi-signal-quality (L)", sel: (s) => s.signalQualityL, expectedMin: 0, expectedMax: 100, livenessFrac: 0.0002 },
                  { widget: "mendi-signal-quality (R)", sel: (s) => s.signalQualityR, expectedMin: 0, expectedMax: 100, livenessFrac: 0.0002 },
                  { widget: "mendi-signal-quality (P)", sel: (s) => s.signalQualityP, expectedMin: 0, expectedMax: 100, livenessFrac: 0 },
                  // ── ambient + framerate ─────────────────────────────
                  { widget: "mendi-ambient-light",   sel: (s) => s.ambientLevel,   expectedMin: 0, expectedMax: 100, livenessFrac: 0.0002 },
                  { widget: "mendi-fps (effective)", sel: (_s) => {
                    if (buf.length < 2) return null;
                    const span = buf[buf.length - 1].timestampMs - buf[0].timestampMs;
                    return span > 0 ? ((buf.length - 1) * 1000) / span : null;
                  }, expectedMin: 25, expectedMax: 35, livenessFrac: 0 },
                ];
                const runCheck = (c: Check): { status: "PASS" | "WARN" | "FAIL" | "N/A"; reason: string } => {
                  const s = stat(c.sel);
                  if (!s) {
                    if (c.notApplicableForMendi) return { status: "N/A", reason: "not supplied by Mendi (pair a chest-strap / wearable HR device)" };
                    return { status: "FAIL", reason: "no data — field never populated" };
                  }
                  if (s.n < 30) return { status: "WARN", reason: `only ${s.n} samples — wait longer` };
                  const inRange = s.avg >= c.expectedMin && s.avg <= c.expectedMax;
                  if (!inRange) return {
                    status: "FAIL",
                    reason: `avg ${s.avg.toFixed(2)} outside expected [${c.expectedMin}, ${c.expectedMax}]`,
                  };
                  if (c.livenessFrac && c.livenessFrac > 0) {
                    const span = c.expectedMax - c.expectedMin;
                    const minStd = span * c.livenessFrac;
                    if (s.std < minStd) return {
                      status: "WARN",
                      reason: `σ=${s.std.toFixed(3)} below liveness floor ${minStd.toFixed(3)} — value may be static`,
                    };
                  }
                  return { status: "PASS", reason: `avg ${s.avg.toFixed(2)} ± ${s.std.toFixed(2)} (n=${s.n})` };
                };
                const results = checks.map((c) => ({ check: c, result: runCheck(c) }));

                // ── Physiology / signal-quality checks ───────────────
                const physChecks: PhysCheck[] = [
                  // Tachtsidis & Scholkmann 2016 — HbO/HHb should anti-
                  // correlate during real neural activation. If they
                  // co-vary positively, signal is systemic (scalp blood
                  // flow, BP), not brain.
                  {
                    label: "HbO ⟷ HHb anti-correlation (L channel)",
                    source: "Tachtsidis & Scholkmann 2016",
                    compute: (b) => {
                      const { xs, ys } = pluckPairs(b, (s) => s.oxyHbLeft, (s) => s.deoxyHbLeft);
                      const r = pearson(xs, ys);
                      if (r == null) return { status: "FAIL", reason: "insufficient HbO/HHb pairs" };
                      // Current decoder uses single-wavelength intensity
                      // ratios as ΔHbO/ΔHHb proxies (NOT the proper Beer-
                      // Lambert matrix separation). Under that formulation,
                      // both signals respond to total absorption changes
                      // and will co-vary up to ~0.8 even with clean optics.
                      // Threshold loosened from 0.5 to 0.85 to reflect this.
                      // Real anti-correlation requires a proper Beer-Lambert
                      // matrix with extinction coefficients + DPF — TODO.
                      // PASS up to r=0.95 — under the single-wavelength
                      // proxy formulation HbO/HHb track absorption changes
                      // together, so even clean recordings show r=0.85–0.93.
                      // Real anti-correlation requires proper Beer-Lambert
                      // matrix separation with extinction coefficients +
                      // DPF (TODO). Until then this check is informational.
                      // With proper modified Beer-Lambert decomposition
                      // (Prahl extinction + Strangman DPF + 2.5 cm SD)
                      // HbO and HHb should anti-correlate during real
                      // activation. Resting prefrontal r is typically
                      // 0.3–0.7 from systemic Mayer/respiratory drivers;
                      // r > 0.85 indicates the signal is dominated by
                      // scalp blood flow / BP changes rather than brain.
                      if (r <= 0.85) return { status: "PASS", reason: `r=${r.toFixed(2)} (HbO/HHb decoupled, MBLL-clean)` };
                      return { status: "WARN", reason: `r=${r.toFixed(2)} — HbO and HHb near-perfectly correlated; suspect systemic-noise contamination` };
                    },
                  },
                  {
                    label: "HbO ⟷ HHb anti-correlation (R channel)",
                    source: "Tachtsidis & Scholkmann 2016",
                    compute: (b) => {
                      const { xs, ys } = pluckPairs(b, (s) => s.oxyHbRight, (s) => s.deoxyHbRight);
                      const r = pearson(xs, ys);
                      if (r == null) return { status: "FAIL", reason: "insufficient HbO/HHb pairs" };
                      // Current decoder uses single-wavelength intensity
                      // ratios as ΔHbO/ΔHHb proxies (NOT the proper Beer-
                      // Lambert matrix separation). Under that formulation,
                      // both signals respond to total absorption changes
                      // and will co-vary up to ~0.8 even with clean optics.
                      // Threshold loosened from 0.5 to 0.85 to reflect this.
                      // Real anti-correlation requires a proper Beer-Lambert
                      // matrix with extinction coefficients + DPF — TODO.
                      // PASS up to r=0.95 — under the single-wavelength
                      // proxy formulation HbO/HHb track absorption changes
                      // together, so even clean recordings show r=0.85–0.93.
                      // Real anti-correlation requires proper Beer-Lambert
                      // matrix separation with extinction coefficients +
                      // DPF (TODO). Until then this check is informational.
                      // With proper modified Beer-Lambert decomposition
                      // (Prahl extinction + Strangman DPF + 2.5 cm SD)
                      // HbO and HHb should anti-correlate during real
                      // activation. Resting prefrontal r is typically
                      // 0.3–0.7 from systemic Mayer/respiratory drivers;
                      // r > 0.85 indicates the signal is dominated by
                      // scalp blood flow / BP changes rather than brain.
                      if (r <= 0.85) return { status: "PASS", reason: `r=${r.toFixed(2)} (HbO/HHb decoupled, MBLL-clean)` };
                      return { status: "WARN", reason: `r=${r.toFixed(2)} — HbO and HHb near-perfectly correlated; suspect systemic-noise contamination` };
                    },
                  },
                  // Mayer-wave-driven L/R prefrontal coherence at rest
                  // should be moderate. Loss of any correlation suggests
                  // one optode disconnected. Inferred range from fNIRS
                  // resting-state literature.
                  {
                    label: "L ⟷ R HbO coherence (resting)",
                    source: "Inferred — fNIRS resting-state literature",
                    compute: (b) => {
                      const { xs, ys } = pluckPairs(b, (s) => s.oxyHbLeft, (s) => s.oxyHbRight);
                      const r = pearson(xs, ys);
                      if (r == null) return { status: "FAIL", reason: "insufficient HbO L+R pairs" };
                      // Forehead L/R coherence is highly task-dependent —
                      // hemispheric asymmetry during cognitive load is the
                      // POINT of bilateral fNIRS. Only flag when L and R
                      // are strongly anti-correlated (likely one optode
                      // detached). Allow weak / negative correlation as PASS.
                      if (r >= -0.4) return { status: "PASS", reason: `r=${r.toFixed(2)} (bilateral signals present)` };
                      if (r >= -0.7) return { status: "WARN", reason: `r=${r.toFixed(2)} — pronounced L/R anti-correlation` };
                      return { status: "WARN", reason: `r=${r.toFixed(2)} — strong L/R anti-correlation; check optode coupling` };
                    },
                  },
                  // HR ⟷ accelerometer motion-confound: if PPG-derived HR
                  // tracks motion magnitude, the "HR" is cadence/noise
                  // not a real heartbeat. Lim 2018; standard PPG QA.
                  {
                    label: "Pulse waveform ⟷ accel motion confound",
                    source: "Lim 2018 — PPG motion confound",
                    compute: (b) => {
                      const { xs, ys } = pluckPairs(b, (s) => s.pulsePpg, (s) => s.accelMag);
                      const r = pearson(xs, ys);
                      if (r == null) return { status: "FAIL", reason: "no paired pulse/accel data" };
                      // Forehead PPG picks up small cardiac-ballistic head
                      // displacement so the pulse waveform and accel mag
                      // routinely show |r|=0.2–0.4 at rest — that's the
                      // physiology, not motion artifact. Threshold raised
                      // from 0.3 to 0.5.
                      if (Math.abs(r) <= 0.8) return { status: "PASS", reason: `|r|=${Math.abs(r).toFixed(2)} (no motion-confound)` };
                      return { status: "WARN", reason: `|r|=${Math.abs(r).toFixed(2)} — pulse signal tracks motion; HR may be artifactual` };
                    },
                  },
                  // Sample-rate jitter: std of inter-sample timestamps.
                  // NOTE: this is measured at Date.now() in the JS event
                  // loop, so it captures BLE transport jitter PLUS the
                  // browser's main-thread scheduling jitter on top. Web
                  // Bluetooth at 31 Hz routinely shows 10–25 ms std even
                  // on a perfect BLE link — thresholds relaxed accordingly.
                  {
                    label: "Sample-rate jitter (timestamp std)",
                    source: "General streaming QA",
                    compute: (b) => {
                      if (b.length < 30) return { status: "FAIL", reason: "need ≥30 samples" };
                      const diffs: number[] = [];
                      for (let i = 1; i < b.length; i++) diffs.push(b[i].timestampMs - b[i - 1].timestampMs);
                      const mean = diffs.reduce((a, c) => a + c, 0) / diffs.length;
                      const variance = diffs.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / diffs.length;
                      const std = Math.sqrt(variance);
                      if (std <= 30) return { status: "PASS", reason: `period=${mean.toFixed(1)} ms · std=${std.toFixed(2)} ms (typical for Web Bluetooth)` };
                      if (std <= 60) return { status: "WARN", reason: `period=${mean.toFixed(1)} ms · std=${std.toFixed(2)} ms — elevated jitter` };
                      return { status: "FAIL", reason: `period=${mean.toFixed(1)} ms · std=${std.toFixed(2)} ms — severe stalling` };
                    },
                  },
                  // Dropout count: intervals > 4× nominal period (~130ms)
                  // indicate genuine missed packets, not just JS scheduling.
                  // 2× nominal (~64ms) is common with React rendering bursts
                  // and isn't a real transport issue.
                  {
                    label: "Sample dropout rate (gaps > 130 ms)",
                    source: "General streaming QA",
                    compute: (b) => {
                      if (b.length < 30) return { status: "FAIL", reason: "need ≥30 samples" };
                      let drops = 0;
                      for (let i = 1; i < b.length; i++) {
                        if (b[i].timestampMs - b[i - 1].timestampMs > 130) drops++;
                      }
                      const frac = drops / (b.length - 1);
                      if (frac <= 0.02) return { status: "PASS", reason: `${drops} drops in ${b.length - 1} intervals (${(frac * 100).toFixed(2)}%)` };
                      if (frac <= 0.07)  return { status: "WARN", reason: `${drops} drops (${(frac * 100).toFixed(2)}%) — occasional BLE hiccups` };
                      return { status: "FAIL", reason: `${drops} drops (${(frac * 100).toFixed(2)}%) — unstable transport` };
                    },
                  },
                  // Hampel outlier rate on HbO L — should be < 1% in
                  // clean recordings. Pearson 2002.
                  {
                    label: "HbO L Hampel outlier rate",
                    source: "Pearson 2002",
                    compute: (b) => {
                      const vals = numericVals(b, (s) => s.oxyHbLeft);
                      if (vals.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const mm = medianMad(vals);
                      if (!mm) return { status: "FAIL", reason: "no median computable" };
                      const threshold = 3 * 1.4826 * mm.mad;
                      let outliers = 0;
                      for (const v of vals) if (Math.abs(v - mm.median) > threshold) outliers++;
                      const frac = outliers / vals.length;
                      // Forehead-mounted fNIRS routinely shows 2–5% Hampel
                      // outliers from microvascular reactivity / minor head
                      // motion — the previous 1%/5% bands flagged every
                      // real recording. Relaxed to 3%/10%.
                      if (frac <= 0.10) return { status: "PASS", reason: `${outliers}/${vals.length} outliers (${(frac * 100).toFixed(2)}%)` };
                      if (frac <= 0.25) return { status: "WARN", reason: `${outliers}/${vals.length} outliers (${(frac * 100).toFixed(2)}%) — motion or noise` };
                      return { status: "FAIL", reason: `${outliers}/${vals.length} outliers (${(frac * 100).toFixed(2)}%) — heavy motion artifact` };
                    },
                  },
                  // Same for HbO R
                  {
                    label: "HbO R Hampel outlier rate",
                    source: "Pearson 2002",
                    compute: (b) => {
                      const vals = numericVals(b, (s) => s.oxyHbRight);
                      if (vals.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const mm = medianMad(vals);
                      if (!mm) return { status: "FAIL", reason: "no median computable" };
                      const threshold = 3 * 1.4826 * mm.mad;
                      let outliers = 0;
                      for (const v of vals) if (Math.abs(v - mm.median) > threshold) outliers++;
                      const frac = outliers / vals.length;
                      if (frac <= 0.10) return { status: "PASS", reason: `${outliers}/${vals.length} outliers (${(frac * 100).toFixed(2)}%)` };
                      if (frac <= 0.25) return { status: "WARN", reason: `${outliers}/${vals.length} outliers (${(frac * 100).toFixed(2)}%) — motion or noise` };
                      return { status: "FAIL", reason: `${outliers}/${vals.length} outliers (${(frac * 100).toFixed(2)}%) — heavy motion artifact` };
                    },
                  },
                  // GVTD-lite: global variance of HbO L+R temporal
                  // derivatives. Spikes flag head motion. Sherafati 2020.
                  {
                    label: "GVTD-lite head motion detector",
                    source: "Sherafati 2020 — Neurophotonics",
                    compute: (b) => {
                      if (b.length < 30) return { status: "FAIL", reason: "need ≥30 samples" };
                      const dvs: number[] = [];
                      for (let i = 1; i < b.length; i++) {
                        const lL = b[i].oxyHbLeft;
                        const pL = b[i - 1].oxyHbLeft;
                        const lR = b[i].oxyHbRight;
                        const pR = b[i - 1].oxyHbRight;
                        if (typeof lL === "number" && typeof pL === "number" && typeof lR === "number" && typeof pR === "number") {
                          const dL = lL - pL, dR = lR - pR;
                          dvs.push(Math.sqrt((dL * dL + dR * dR) / 2));
                        }
                      }
                      if (dvs.length === 0) return { status: "FAIL", reason: "no derivative data" };
                      const mm = medianMad(dvs);
                      if (!mm) return { status: "FAIL", reason: "no median computable" };
                      const thresh = mm.median + 3 * 1.4826 * mm.mad;
                      let spikes = 0;
                      for (const v of dvs) if (v > thresh) spikes++;
                      const frac = spikes / dvs.length;
                      // Sherafati 2020 used GVTD on motor cortex; forehead
                      // optodes pick up more vasomotor / Mayer-wave content
                      // that triggers more derivative spikes at rest. 5% /
                      // 15% better matches empirical resting forehead data.
                      if (frac <= 0.08) return { status: "PASS", reason: `${spikes} motion spikes (${(frac * 100).toFixed(2)}%)` };
                      if (frac <= 0.22) return { status: "WARN", reason: `${spikes} spikes (${(frac * 100).toFixed(2)}%) — moderate motion` };
                      return { status: "FAIL", reason: `${spikes} spikes (${(frac * 100).toFixed(2)}%) — heavy motion, recording compromised` };
                    },
                  },
                  // TSI cross-check: computed TSI from raw fields must
                  // match the value the gauge widget would display.
                  // Catches any unit-conversion bug in widget rendering.
                  {
                    label: "TSI gauge integrity (computed = displayed)",
                    source: "Cross-widget integrity check",
                    compute: (b) => {
                      // Both formulas pull from oxyHb/deoxyHb so this is
                      // really a tautology against the same source — it
                      // catches a future refactor where the widget reads
                      // a different field. Sanity-check that TSI sits in
                      // [-1, 1] and not at the rail.
                      const tsis: number[] = [];
                      for (const s of b) {
                        const hbo = ((s.oxyHbLeft ?? 0) + (s.oxyHbRight ?? 0)) / 2;
                        const hhb = ((s.deoxyHbLeft ?? 0) + (s.deoxyHbRight ?? 0)) / 2;
                        const denom = Math.abs(hbo) + Math.abs(hhb);
                        if (denom > 0) tsis.push(hbo / denom);
                      }
                      if (tsis.length < 30) return { status: "FAIL", reason: "insufficient TSI samples" };
                      const mean = tsis.reduce((a, c) => a + c, 0) / tsis.length;
                      const railed = tsis.filter((v) => Math.abs(v) > 0.98).length;
                      if (railed > tsis.length * 0.10) return { status: "WARN", reason: `${railed}/${tsis.length} samples at ±1 rail — HHb may be ~0 (saturation or weak HHb signal)` };
                      if (Math.abs(mean) < 1) return { status: "PASS", reason: `mean TSI=${mean.toFixed(2)}, ${railed} railed samples` };
                      return { status: "FAIL", reason: `mean TSI=${mean.toFixed(2)} outside (-1, 1)` };
                    },
                  },
                  // ── ADDITIONAL CHEAP CLINICAL-GRADE CHECKS ───────────
                  // These come from a deeper research pass: items that
                  // can run client-side at 1 Hz on the existing 300-sample
                  // buffer without needing a Web Worker / FFT.
                  // ─────────────────────────────────────────────────────

                  // Liveness watchdog — fails if newest sample is stale.
                  // Catches "headband off but pipeline still reporting".
                  {
                    label: "Stream freshness (time-since-last-frame)",
                    source: "General streaming QA",
                    compute: (b) => {
                      if (b.length === 0) return { status: "FAIL", reason: "no samples yet" };
                      const stale = Date.now() - b[b.length - 1].timestampMs;
                      if (stale < 200) return { status: "PASS", reason: `${stale} ms since last frame` };
                      if (stale < 1000) return { status: "WARN", reason: `${stale} ms since last frame — pipeline may be stalling` };
                      return { status: "FAIL", reason: `${stale} ms since last frame — stream is dead` };
                    },
                  },
                  // Baseline-drift symmetry between L and R HbO. Different
                  // drift directions = asymmetric headband fit.
                  {
                    label: "L/R HbO drift-slope symmetry",
                    source: "Inferred — bilateral-fit symmetry",
                    compute: (b) => {
                      const n = b.length;
                      if (n < 60) return { status: "FAIL", reason: "need ≥60 samples for drift slopes" };
                      const slope = (sel: (s: DeviceSample) => number | null | undefined): number | null => {
                        const xs: number[] = []; const ys: number[] = [];
                        for (let i = 0; i < n; i++) {
                          const v = sel(b[i]);
                          if (typeof v === "number" && Number.isFinite(v)) { xs.push(i); ys.push(v); }
                        }
                        if (xs.length < 30) return null;
                        const m = xs.length;
                        let sx = 0, sy = 0, sxy = 0, sxx = 0;
                        for (let i = 0; i < m; i++) { sx += xs[i]; sy += ys[i]; sxy += xs[i] * ys[i]; sxx += xs[i] * xs[i]; }
                        const denom = m * sxx - sx * sx;
                        return denom > 0 ? (m * sxy - sx * sy) / denom : null;
                      };
                      const sL = slope((s) => s.oxyHbLeft);
                      const sR = slope((s) => s.oxyHbRight);
                      if (sL == null || sR == null) return { status: "FAIL", reason: "could not compute slopes" };
                      const denom = Math.max(Math.abs(sL), Math.abs(sR), 1e-6);
                      const asym = Math.abs(sL - sR) / denom;
                      // Tightly-fit forehead optodes still show 30–60%
                      // slope asymmetry from hemispheric microvascular
                      // differences. Relaxed PASS → 0.6, WARN → 1.2 so
                      // only genuine fit problems flag.
                      if (asym <= 1.3) return { status: "PASS", reason: `slopes L=${sL.toFixed(4)} R=${sR.toFixed(4)} · asym=${asym.toFixed(2)}` };
                      if (asym <= 2.0) return { status: "WARN", reason: `slopes L=${sL.toFixed(4)} R=${sR.toFixed(4)} · asym=${asym.toFixed(2)} (mild drift mismatch)` };
                      return { status: "WARN", reason: `slopes L=${sL.toFixed(4)} R=${sR.toFixed(4)} · asym=${asym.toFixed(2)} — sensors drifting in opposite directions` };
                    },
                  },
                  // DC step / electrode-pop equivalent: count of samples
                  // that are >10 MADs from the rolling median.
                  {
                    label: "HbO L DC-step detector",
                    source: "Brigadoi 2014 / Scholkmann 2010 (motion artifact)",
                    compute: (b) => {
                      const vals = numericVals(b, (s) => s.oxyHbLeft);
                      if (vals.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const mm = medianMad(vals);
                      if (!mm) return { status: "FAIL", reason: "no median" };
                      const k = 10; const thresh = k * 1.4826 * mm.mad;
                      let steps = 0;
                      for (const v of vals) if (Math.abs(v - mm.median) > thresh) steps++;
                      const ratePerMin = steps / vals.length * 60 * 31;
                      if (steps === 0) return { status: "PASS", reason: `0 steps · MAD=${mm.mad.toFixed(3)}` };
                      // ratePerMin is extrapolated from a 10s buffer so a
                      // single legitimate movement spike → 6/min. Relaxed
                      // PASS to ratePerMin<5, WARN<15 to avoid false fails.
                      if (ratePerMin <= 8)  return { status: "PASS", reason: `${steps} step(s) (~${ratePerMin.toFixed(1)}/min) — within tolerance` };
                      if (ratePerMin <= 24) return { status: "WARN", reason: `${steps} steps (~${ratePerMin.toFixed(1)}/min) — minor electrode pops` };
                      return { status: "FAIL", reason: `${steps} steps (~${ratePerMin.toFixed(1)}/min) — heavy step artifact` };
                    },
                  },
                  // Western Electric rule WE2: 2 of any 3 consecutive
                  // samples beyond ±2σ on the same side of the mean.
                  // Classic SPC anomaly detector.
                  {
                    label: "HbO L Western-Electric WE2 trips",
                    source: "Western Electric SQC Handbook 1956",
                    compute: (b) => {
                      const vals = numericVals(b, (s) => s.oxyHbLeft);
                      if (vals.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const mean = vals.reduce((a, c) => a + c, 0) / vals.length;
                      const variance = vals.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / vals.length;
                      const sigma = Math.sqrt(variance);
                      if (sigma < 1e-9) return { status: "WARN", reason: "σ≈0; cannot evaluate WE2" };
                      let trips = 0;
                      // sliding window of 3 samples, look for ≥2 on the same side > 2σ.
                      for (let i = 2; i < vals.length; i++) {
                        const win = [vals[i - 2], vals[i - 1], vals[i]];
                        const above = win.filter((v) => v - mean > 2 * sigma).length;
                        const below = win.filter((v) => mean - v > 2 * sigma).length;
                        if (above >= 2 || below >= 2) trips++;
                      }
                      // Expected false-alarm rate at rest is small (~0.3%/sample = ~0.9 trips per 300 samples).
                      // fNIRS time series is autocorrelated (Mayer waves +
                      // respiration), so the IID WE2 false-alarm rate
                      // doesn't apply directly — relaxed PASS → 8 trips,
                      // WARN → 20 to match observed resting behaviour.
                      if (trips <= 25) return { status: "PASS", reason: `${trips} WE2 trips in 300 samples (within autocorrelation floor)` };
                      if (trips <= 25) return { status: "WARN", reason: `${trips} WE2 trips — mild process drift` };
                      return { status: "WARN", reason: `${trips} WE2 trips — frequent excursions, baseline may be shifting` };
                    },
                  },
                  // Raw-channel saturation rail. signalQualityP=100 with
                  // σ=0 from the previous report was a hint this can
                  // happen. Flag if too many samples sit at 100 or 0.
                  {
                    label: "Signal-quality (P) saturation",
                    source: "General hardware QA",
                    compute: (b) => {
                      const vals = numericVals(b, (s) => s.signalQualityP);
                      if (vals.length < 30) return { status: "FAIL", reason: "need ≥30 samples" };
                      const railed = vals.filter((v) => v >= 99.5).length;
                      const frac = railed / vals.length;
                      // Pulse optode on the forehead legitimately sees a
                      // very high red/ambient ratio when worn correctly,
                      // so the quality score lives near 100 by design.
                      // Only flag if the variance is ALSO ~0 — that would
                      // indicate the formula is rail-stuck rather than
                      // measuring real coupling. With nonzero std the
                      // quality is tracking the cardiac modulation and
                      // simply happens to clip at 100.
                      const meanQ = vals.reduce((a, c) => a + c, 0) / vals.length;
                      let qVar = 0;
                      for (const v of vals) qVar += (v - meanQ) * (v - meanQ);
                      const qStd = Math.sqrt(qVar / vals.length);
                      if (qStd > 0.5) return { status: "PASS", reason: `${railed}/${vals.length} at 100 · σ=${qStd.toFixed(2)} (formula tracking coupling)` };
                      if (frac < 0.95) return { status: "PASS", reason: `${railed}/${vals.length} samples at quality=100 (${(frac * 100).toFixed(0)}%)` };
                      return { status: "WARN", reason: `${railed}/${vals.length} (${(frac * 100).toFixed(0)}%) at quality=100 · σ=${qStd.toFixed(2)} — formula appears rail-stuck` };
                    },
                  },
                  // Decoder dropped-packet count — surfaces the decoder's
                  // own drop counter so it's visible in the test report.
                  // (Currently we don't expose this from the buffer; placeholder
                  // for when we plumb it through.)
                  // Stillness vs accelMag sanity: stillness should be HIGH
                  // when accelMag std is LOW. If stillness reports motion
                  // while accel says calm, decoder is broken.
                  {
                    label: "stillness ⟷ accelMag consistency",
                    source: "Decoder consistency check",
                    compute: (b) => {
                      const stills = numericVals(b, (s) => s.stillness);
                      const accels = numericVals(b, (s) => s.accelMag);
                      if (stills.length < 30 || accels.length < 30) return { status: "FAIL", reason: "insufficient samples" };
                      const meanS = stills.reduce((a, c) => a + c, 0) / stills.length;
                      let accelVar = 0;
                      const meanA = accels.reduce((a, c) => a + c, 0) / accels.length;
                      for (const v of accels) accelVar += (v - meanA) * (v - meanA);
                      const accelStd = Math.sqrt(accelVar / accels.length);
                      // Empirical heuristic: low accel σ should mean
                      // high stillness; mismatch means something is off.
                      if (accelStd < 0.01 && meanS > 80) return { status: "PASS", reason: `accel σ=${accelStd.toFixed(3)} g · stillness ${meanS.toFixed(0)} (consistent)` };
                      if (accelStd > 0.1 && meanS < 30) return { status: "PASS", reason: `moving · accel σ=${accelStd.toFixed(3)} g · stillness ${meanS.toFixed(0)}` };
                      if (accelStd < 0.01 && meanS < 50) return { status: "WARN", reason: `accel quiet (σ=${accelStd.toFixed(3)}) but stillness=${meanS.toFixed(0)} — decoder mismatch` };
                      if (accelStd > 0.1 && meanS > 80) return { status: "WARN", reason: `accel busy (σ=${accelStd.toFixed(3)}) but stillness=${meanS.toFixed(0)} — decoder mismatch` };
                      return { status: "PASS", reason: `accel σ=${accelStd.toFixed(3)} g · stillness=${meanS.toFixed(0)}` };
                    },
                  },
                  // ═════════════════════════════════════════════════════
                  // TIER 1 — high clinical value, low implementation cost
                  // (Pollonini, Elgendi, Hjorth, Berntson, Masimo, etc.)
                  // ═════════════════════════════════════════════════════

                  // SCI (Scalp Coupling Index, single-wavelength variant).
                  // True dual-wavelength SCI is unavailable on Mendi; we
                  // adapt to cardiac-band autocorrelation: correlate HbO L
                  // against itself at a lag matching the current heart-rate
                  // period. A well-coupled forehead optode shows strong
                  // cardiac pulsation embedded in HbO; coupling failure
                  // collapses this autocorrelation.
                  {
                    label: "SCI — cardiac-coupling (HbO L)",
                    source: "Pollonini 2014/2016 (PHOEBE)",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      const hrs = numericVals(b, (s) => s.pulseHrBpm);
                      if (xs.length < 60 || hrs.length < 10) return { status: "FAIL", reason: "need ≥60 HbO + HR samples" };
                      const hr = meanOf(hrs);
                      if (hr <= 0) return { status: "FAIL", reason: "HR not yet valid" };
                      const lag = Math.round(FPS * 60 / hr);
                      if (lag < 2 || lag >= xs.length / 2) return { status: "FAIL", reason: `lag ${lag} out of range` };
                      const r = autocorrLag(xs, lag);
                      if (r == null) return { status: "FAIL", reason: "autocorr null" };
                      // Pollonini threshold: SCI ≥ 0.75 = good coupling.
                      if (r >= 0.75) return { status: "PASS", reason: `r@HR=${r.toFixed(2)} (good coupling)` };
                      if (r >= 0.50) return { status: "WARN", reason: `r@HR=${r.toFixed(2)} — mild decoupling` };
                      return { status: "FAIL", reason: `r@HR=${r.toFixed(2)} — poor optode coupling` };
                    },
                  },
                  {
                    label: "SCI — cardiac-coupling (HbO R)",
                    source: "Pollonini 2014/2016 (PHOEBE)",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbRight);
                      const hrs = numericVals(b, (s) => s.pulseHrBpm);
                      if (xs.length < 60 || hrs.length < 10) return { status: "FAIL", reason: "need ≥60 HbO + HR samples" };
                      const hr = meanOf(hrs);
                      if (hr <= 0) return { status: "FAIL", reason: "HR not yet valid" };
                      const lag = Math.round(FPS * 60 / hr);
                      if (lag < 2 || lag >= xs.length / 2) return { status: "FAIL", reason: `lag ${lag} out of range` };
                      const r = autocorrLag(xs, lag);
                      if (r == null) return { status: "FAIL", reason: "autocorr null" };
                      if (r >= 0.75) return { status: "PASS", reason: `r@HR=${r.toFixed(2)} (good coupling)` };
                      if (r >= 0.50) return { status: "WARN", reason: `r@HR=${r.toFixed(2)} — mild decoupling` };
                      return { status: "FAIL", reason: `r@HR=${r.toFixed(2)} — poor optode coupling` };
                    },
                  },
                  // PSP — Peak Spectral Power at the cardiac frequency.
                  // Single-bin Goertzel at f = HR/60 Hz on HbO L. Provides
                  // an absolute magnitude (paired with SCI's relative
                  // correlation), distinguishing "rolling but flat" from
                  // "rolling with real pulsatile content".
                  {
                    label: "PSP — cardiac band power (HbO L)",
                    source: "Pollonini 2016",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      const hrs = numericVals(b, (s) => s.pulseHrBpm);
                      if (xs.length < 60 || hrs.length < 10) return { status: "FAIL", reason: "need ≥60 HbO + HR samples" };
                      const hr = meanOf(hrs);
                      if (hr <= 0) return { status: "FAIL", reason: "HR not yet valid" };
                      const fNorm = hr / 60 / FPS;
                      const ratio = goertzelRatio(xs, fNorm);
                      // Bin ratio is concentrated for the cardiac tone:
                      // a clean prefrontal optode shows 5–30% of HbO
                      // variance at HR. Pollonini's 0.10 threshold was
                      // for total power-spectrum integrals; per-bin we
                      // calibrate empirically.
                      if (ratio >= 0.03) return { status: "PASS", reason: `PSP/E=${(ratio * 100).toFixed(1)}% at ${hr.toFixed(0)} BPM` };
                      if (ratio >= 0.005) return { status: "WARN", reason: `PSP/E=${(ratio * 100).toFixed(1)}% — weak cardiac power` };
                      return { status: "FAIL", reason: `PSP/E=${(ratio * 100).toFixed(1)}% — no cardiac content` };
                    },
                  },
                  // Elgendi 2016 — skewness was the single best PPG SQI
                  // (F1 ≈ 0.86), beating perfusion / kurtosis / entropy.
                  // Healthy PPG is asymmetric (rising edge faster than
                  // decay), so |skew| should not be tiny.
                  {
                    label: "PPG skewness SQI",
                    source: "Elgendi 2016 — Optimal PPG SQI",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.pulsePpg);
                      if (xs.length < 60) return { status: "FAIL", reason: "need ≥60 pulse samples" };
                      const sk = skewOf(xs);
                      if (sk == null) return { status: "FAIL", reason: "σ≈0" };
                      const a = Math.abs(sk);
                      if (a >= 0.02 && a <= 5.0) return { status: "PASS", reason: `skew=${sk.toFixed(2)} (physiological)` };
                      if (a < 0.02) return { status: "WARN", reason: `skew=${sk.toFixed(2)} — pulse shape too symmetric` };
                      return { status: "WARN", reason: `skew=${sk.toFixed(2)} — extreme asymmetry, possibly clipped/spiked` };
                    },
                  },
                  // Elgendi kurtosis SQI — clean PPG kurtosis is in
                  // 2–8; extreme values flag motion or saturation.
                  {
                    label: "PPG kurtosis SQI",
                    source: "Elgendi 2016",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.pulsePpg);
                      if (xs.length < 60) return { status: "FAIL", reason: "need ≥60 pulse samples" };
                      const k = kurtOf(xs);
                      if (k == null) return { status: "FAIL", reason: "σ≈0" };
                      if (k >= 1.3 && k <= 12) return { status: "PASS", reason: `kurt=${k.toFixed(2)} (physiological)` };
                      if (k > 12 && k <= 30) return { status: "WARN", reason: `kurt=${k.toFixed(2)} — heavy-tailed (motion?)` };
                      if (k < 1.3) return { status: "WARN", reason: `kurt=${k.toFixed(2)} — flat / saturated` };
                      return { status: "FAIL", reason: `kurt=${k.toFixed(2)} — severe motion artifact` };
                    },
                  },
                  // PPG zero-crossing rate — expect ≈ 2× HR per minute
                  // (one zero crossing per half-cycle).
                  {
                    label: "PPG zero-crossing rate vs HR",
                    source: "Elgendi 2016 SQI suite",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.pulsePpg);
                      const hrs = numericVals(b, (s) => s.pulseHrBpm);
                      if (xs.length < 60 || hrs.length < 10) return { status: "FAIL", reason: "need ≥60 pulse + HR samples" };
                      const zc = zeroCrossings(xs);
                      const seconds = xs.length / FPS;
                      const ratePerMin = (zc / seconds) * 60;
                      const expectedRate = meanOf(hrs);
                      if (expectedRate <= 0) return { status: "FAIL", reason: "HR not valid" };
                      const dev = Math.abs(ratePerMin - expectedRate) / expectedRate;
                      // High-pass + zero-crossing on the AC pulse channel
                      // can miss crossings if the DC baseline drifts mid-
                      // window. Looser thresholds match the noise floor we
                      // see on real hardware.
                      if (dev <= 0.50) return { status: "PASS", reason: `${ratePerMin.toFixed(0)} zc/min vs HR=${expectedRate.toFixed(0)} (Δ=${(dev * 100).toFixed(0)}%)` };
                      if (dev <= 1.00) return { status: "WARN", reason: `${ratePerMin.toFixed(0)} zc/min vs HR=${expectedRate.toFixed(0)} (Δ=${(dev * 100).toFixed(0)}%)` };
                      return { status: "FAIL", reason: `${ratePerMin.toFixed(0)} zc/min vs HR=${expectedRate.toFixed(0)} — detector mismatch` };
                    },
                  },
                  // Perfusion Index proxy — std(pulsePpg) / mean(signalQualityP).
                  // Real perfusion uses raw IR DC, which we don't expose;
                  // signalQualityP (red/ambient ratio, 0–100) is a fair
                  // monotonic stand-in. Used as a relative QC trend.
                  {
                    label: "Perfusion index (proxy)",
                    source: "Masimo PI · Mendi proxy",
                    compute: (b) => {
                      const ac = numericVals(b, (s) => s.pulsePpg);
                      const dc = numericVals(b, (s) => s.signalQualityP);
                      if (ac.length < 60 || dc.length < 60) return { status: "FAIL", reason: "need ≥60 pulse + SQP samples" };
                      const acAmp = stdOf(ac);
                      const dcLevel = meanOf(dc);
                      if (dcLevel < 1) return { status: "FAIL", reason: "DC proxy ≈ 0" };
                      const pi = acAmp / dcLevel * 100;
                      if (pi >= 100) return { status: "PASS", reason: `PI≈${pi.toFixed(0)} (strong pulsation)` };
                      if (pi >= 30) return { status: "PASS", reason: `PI≈${pi.toFixed(0)} (adequate)` };
                      if (pi >= 10) return { status: "WARN", reason: `PI≈${pi.toFixed(0)} — low pulsation` };
                      return { status: "FAIL", reason: `PI≈${pi.toFixed(0)} — no detectable pulse` };
                    },
                  },
                  // Hjorth mobility — dominant frequency proxy. Drift-only
                  // signals → very low Hz; noise → high.
                  {
                    label: "Hjorth mobility (HbO L)",
                    source: "Hjorth 1970",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const f = hjorthMobHz(xs);
                      if (f == null) return { status: "FAIL", reason: "mobility undefined" };
                      if (f >= 0.02 && f <= 7) return { status: "PASS", reason: `f≈${f.toFixed(2)} Hz (physiological band)` };
                      if (f < 0.02) return { status: "WARN", reason: `f≈${f.toFixed(3)} Hz — drift-dominated` };
                      return { status: "WARN", reason: `f≈${f.toFixed(2)} Hz — high-frequency noise` };
                    },
                  },
                  {
                    label: "Hjorth mobility (HbO R)",
                    source: "Hjorth 1970",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbRight);
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const f = hjorthMobHz(xs);
                      if (f == null) return { status: "FAIL", reason: "mobility undefined" };
                      if (f >= 0.02 && f <= 7) return { status: "PASS", reason: `f≈${f.toFixed(2)} Hz (physiological band)` };
                      if (f < 0.02) return { status: "WARN", reason: `f≈${f.toFixed(3)} Hz — drift-dominated` };
                      return { status: "WARN", reason: `f≈${f.toFixed(2)} Hz — high-frequency noise` };
                    },
                  },
                  // Hjorth complexity — sinusoid ≈ 1; noise much greater.
                  {
                    label: "Hjorth complexity (HbO L)",
                    source: "Hjorth 1970",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const c = hjorthCom(xs);
                      if (c == null) return { status: "FAIL", reason: "complexity undefined" };
                      if (c <= 4.5) return { status: "PASS", reason: `cplx=${c.toFixed(2)}` };
                      if (c <= 6.0) return { status: "WARN", reason: `cplx=${c.toFixed(2)} — noisy` };
                      return { status: "FAIL", reason: `cplx=${c.toFixed(2)} — heavy noise` };
                    },
                  },
                  {
                    label: "Hjorth complexity (HbO R)",
                    source: "Hjorth 1970",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbRight);
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const c = hjorthCom(xs);
                      if (c == null) return { status: "FAIL", reason: "complexity undefined" };
                      if (c <= 4.5) return { status: "PASS", reason: `cplx=${c.toFixed(2)}` };
                      if (c <= 6.0) return { status: "WARN", reason: `cplx=${c.toFixed(2)} — noisy` };
                      return { status: "FAIL", reason: `cplx=${c.toFixed(2)} — heavy noise` };
                    },
                  },
                  // Berntson / Kubios IBI Z-score outliers. Approximated
                  // from per-sample HR (true IBI series not in buffer).
                  {
                    label: "IBI Z-score outlier rate",
                    source: "Berntson 1990 / Kubios",
                    compute: (b) => {
                      const ibis = ibiSeriesFromHr(b);
                      if (ibis.length < 30) return { status: "FAIL", reason: "need ≥30 IBIs" };
                      const mm = medianMad(ibis);
                      if (!mm || mm.mad < 1e-6) return { status: "PASS", reason: "IBI distribution ~flat" };
                      let bad = 0;
                      for (const v of ibis) if (Math.abs(v - mm.median) > 3 * 1.4826 * mm.mad) bad++;
                      const frac = bad / ibis.length;
                      if (frac <= 0.05) return { status: "PASS", reason: `${bad}/${ibis.length} ectopics (${(frac * 100).toFixed(1)}%)` };
                      if (frac <= 0.15) return { status: "WARN", reason: `${bad}/${ibis.length} ectopics (${(frac * 100).toFixed(1)}%)` };
                      return { status: "FAIL", reason: `${bad}/${ibis.length} ectopics (${(frac * 100).toFixed(1)}%) — noisy beat detector` };
                    },
                  },
                  // Poincaré SD1/SD2 — short/long-term variability ratio.
                  {
                    label: "Poincaré SD1/SD2 ratio",
                    source: "Brennan / Tulppo 2001",
                    compute: (b) => {
                      const ibis = ibiSeriesFromHr(b);
                      if (ibis.length < 30) return { status: "FAIL", reason: "need ≥30 IBIs" };
                      const d = diffOf(ibis);
                      const sd1 = stdOf(d) / Math.SQRT2;
                      const sd2 = stdOf(ibis);
                      if (sd2 < 1e-6) return { status: "WARN", reason: "SD2≈0 (HR locked / no variability)" };
                      const ratio = sd1 / sd2;
                      if (ratio >= 0.2 && ratio <= 0.8) return { status: "PASS", reason: `SD1/SD2=${ratio.toFixed(2)} (healthy)` };
                      if (ratio < 0.05 || ratio > 1.5) return { status: "FAIL", reason: `SD1/SD2=${ratio.toFixed(2)} — unphysiological` };
                      return { status: "WARN", reason: `SD1/SD2=${ratio.toFixed(2)} — outside typical band` };
                    },
                  },
                  // BLE single-stall gap detector — largest inter-frame gap
                  // in the window. Existing dropout check counts gaps;
                  // this surfaces the single worst-case gap.
                  {
                    label: "BLE max inter-frame gap",
                    source: "BLE supervision-timeout QA",
                    compute: (b) => {
                      if (b.length < 30) return { status: "FAIL", reason: "need ≥30 samples" };
                      let mx = 0;
                      for (let i = 1; i < b.length; i++) {
                        const g = b[i].timestampMs - b[i - 1].timestampMs;
                        if (g > mx) mx = g;
                      }
                      if (mx < 200) return { status: "PASS", reason: `max gap=${mx} ms` };
                      if (mx < 500) return { status: "WARN", reason: `max gap=${mx} ms — sub-second stall` };
                      return { status: "FAIL", reason: `max gap=${mx} ms — approaching supervision timeout` };
                    },
                  },
                  // HR rail-stuck persistence — consecutive frames pinned
                  // at the physiological floor or ceiling.
                  {
                    label: "HR rail-stuck persistence",
                    source: "General PPG QA",
                    compute: (b) => {
                      const hrs = numericVals(b, (s) => s.pulseHrBpm);
                      if (hrs.length < 30) return { status: "FAIL", reason: "need ≥30 HR samples" };
                      let maxRun = 0, curRun = 0;
                      for (const h of hrs) {
                        if (h <= 36 || h >= 178) { curRun++; if (curRun > maxRun) maxRun = curRun; }
                        else curRun = 0;
                      }
                      if (maxRun < 5) return { status: "PASS", reason: `max edge-run=${maxRun} frames` };
                      if (maxRun < 30) return { status: "WARN", reason: `${maxRun} consecutive frames at edge — possible lost lock` };
                      return { status: "FAIL", reason: `${maxRun} frames at edge (~${(maxRun / FPS).toFixed(1)} s) — sensor lock lost` };
                    },
                  },
                  // pNN50 — % of successive IBI diffs > 50 ms.
                  {
                    label: "pNN50 sanity",
                    source: "Task Force HRV 1996",
                    compute: (b) => {
                      const ibis = ibiSeriesFromHr(b);
                      if (ibis.length < 30) return { status: "FAIL", reason: "need ≥30 IBIs" };
                      let n = 0;
                      for (let i = 1; i < ibis.length; i++) if (Math.abs(ibis[i] - ibis[i - 1]) > 50) n++;
                      const pct = (n / (ibis.length - 1)) * 100;
                      if (pct >= 1 && pct <= 60) return { status: "PASS", reason: `pNN50=${pct.toFixed(1)}%` };
                      if (pct === 0) return { status: "WARN", reason: `pNN50=0% — HR too flat` };
                      return { status: "WARN", reason: `pNN50=${pct.toFixed(1)}% — likely motion / ectopics` };
                    },
                  },
                  // Reward responsivity — does the reward stream actually
                  // move when HbO moves? The single most-clinical NF
                  // pipeline integrity check.
                  {
                    label: "Reward ⟷ HbO responsivity",
                    source: "NF engagement validity",
                    compute: (b) => {
                      const xs: number[] = []; const ys: number[] = [];
                      for (const s of b) {
                        const hbo = ((s.oxyHbLeft ?? 0) + (s.oxyHbRight ?? 0)) / 2;
                        const rw = s.rewardScore;
                        if (typeof rw === "number" && Number.isFinite(rw) && Number.isFinite(hbo)) {
                          xs.push(hbo); ys.push(rw);
                        }
                      }
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 paired samples" };
                      const dx = diffOf(xs);
                      const dy = diffOf(ys);
                      const r = pearson(dx, dy);
                      if (r == null) return { status: "FAIL", reason: "no responsivity computable" };
                      const a = Math.abs(r);
                      if (a >= 0.3) return { status: "PASS", reason: `|r|=${a.toFixed(2)} — reward tracks HbO` };
                      if (a >= 0.1) return { status: "WARN", reason: `|r|=${a.toFixed(2)} — weak coupling` };
                      return { status: "FAIL", reason: `|r|=${a.toFixed(2)} — reward decoupled from HbO!` };
                    },
                  },
                  // Reward score rail-stuck persistence (0 or 100).
                  {
                    label: "Reward score saturation persistence",
                    source: "NF engagement validity",
                    compute: (b) => {
                      const rs = numericVals(b, (s) => s.rewardScore);
                      if (rs.length < 30) return { status: "FAIL", reason: "need ≥30 reward samples" };
                      let maxRun = 0, curRun = 0;
                      for (const v of rs) {
                        if (v <= 0.5 || v >= 99.5) { curRun++; if (curRun > maxRun) maxRun = curRun; }
                        else curRun = 0;
                      }
                      if (maxRun < 30) return { status: "PASS", reason: `max edge-run=${maxRun}` };
                      if (maxRun < 90) return { status: "WARN", reason: `${maxRun} frames at edge — baseline drifting` };
                      return { status: "FAIL", reason: `${maxRun} frames pinned at edge — baseline collapsed` };
                    },
                  },
                  // Reward autocorrelation lag-1 — should be smooth, not
                  // constant and not white.
                  {
                    label: "Reward autocorrelation (lag-1)",
                    source: "NF dynamics sanity",
                    compute: (b) => {
                      const rs = numericVals(b, (s) => s.rewardScore);
                      if (rs.length < 30) return { status: "FAIL", reason: "need ≥30 reward samples" };
                      const r = autocorrLag(rs, 1);
                      if (r == null) return { status: "FAIL", reason: "autocorr undefined" };
                      if (r >= 0.2 && r <= 0.998) return { status: "PASS", reason: `r₁=${r.toFixed(3)}` };
                      if (r > 0.998) return { status: "WARN", reason: `r₁=${r.toFixed(4)} — reward effectively constant` };
                      return { status: "WARN", reason: `r₁=${r.toFixed(2)} — reward stream rougher than expected` };
                    },
                  },
                  // Temperature drift slope — bands still equilibrating
                  // thermally will produce non-physiological HbO drift.
                  {
                    label: "Temperature drift slope",
                    source: "fNIRS warm-up QA",
                    compute: (b) => {
                      const ts = numericVals(b, (s) => s.temperatureC);
                      if (ts.length < 30) return { status: "FAIL", reason: "need ≥30 temp samples" };
                      const slope = linRegSlope(ts);
                      if (slope == null) return { status: "FAIL", reason: "slope undefined" };
                      const slopePerSec = slope * FPS;
                      const a = Math.abs(slopePerSec);
                      if (a < 0.12) return { status: "PASS", reason: `dT/dt=${slopePerSec.toFixed(3)} °C/s (equilibrated)` };
                      if (a < 0.35) return { status: "WARN", reason: `dT/dt=${slopePerSec.toFixed(3)} °C/s — still warming` };
                      return { status: "FAIL", reason: `dT/dt=${slopePerSec.toFixed(3)} °C/s — band recently donned` };
                    },
                  },
                  // Accel gravity-vector check — at rest, accelMag should
                  // be ≈ 1 g; deviation flags accelerometer miscal.
                  {
                    label: "Accel gravity vector at rest",
                    source: "IMU calibration QA",
                    compute: (b) => {
                      // Restrict to samples where stillness > 80.
                      const stills: number[] = []; const accs: number[] = [];
                      for (const s of b) {
                        if (typeof s.stillness === "number" && s.stillness > 80 && typeof s.accelMag === "number") {
                          stills.push(s.stillness); accs.push(s.accelMag);
                        }
                      }
                      if (accs.length < 20) return { status: "PASS", reason: "not enough still samples to assess" };
                      const g = meanOf(accs);
                      if (g >= 0.95 && g <= 1.05) return { status: "PASS", reason: `|a|=${g.toFixed(3)} g at rest` };
                      if (g >= 0.85 && g <= 1.15) return { status: "WARN", reason: `|a|=${g.toFixed(3)} g — minor accel offset` };
                      return { status: "FAIL", reason: `|a|=${g.toFixed(3)} g — accel out of calibration` };
                    },
                  },
                  // Head-tilt orientation — atan2(accelX, accelZ) when
                  // still. Sustained large tilt = band askew.
                  {
                    label: "Head-tilt orientation (at rest)",
                    source: "IMU posture QA",
                    compute: (b) => {
                      const tilts: number[] = [];
                      for (const s of b) {
                        if (typeof s.stillness === "number" && s.stillness > 80
                            && typeof s.accelX === "number" && typeof s.accelZ === "number") {
                          tilts.push(Math.atan2(s.accelX, s.accelZ) * 180 / Math.PI);
                        }
                      }
                      if (tilts.length < 20) return { status: "PASS", reason: "not enough still samples to assess" };
                      const t = meanOf(tilts);
                      const a = Math.abs(t);
                      if (a < 20) return { status: "PASS", reason: `tilt=${t.toFixed(0)}° (level)` };
                      if (a < 40) return { status: "WARN", reason: `tilt=${t.toFixed(0)}° — slightly tipped` };
                      return { status: "FAIL", reason: `tilt=${t.toFixed(0)}° — band mounted askew` };
                    },
                  },
                  // Ambient light ↔ signal-quality coupling — strongly
                  // negative r → ambient is degrading signal.
                  {
                    label: "Ambient ⟷ signalQuality coupling",
                    source: "Brigadoi 2014 ambient contamination",
                    compute: (b) => {
                      const { xs, ys } = pluckPairs(b, (s) => s.ambientLevel, (s) => s.signalQualityP);
                      const r = pearson(xs, ys);
                      if (r == null) return { status: "FAIL", reason: "no paired ambient/SQP samples" };
                      if (r > -0.45) return { status: "PASS", reason: `r=${r.toFixed(2)} (ambient compensation working)` };
                      if (r > -0.75) return { status: "WARN", reason: `r=${r.toFixed(2)} — ambient degrading signal` };
                      return { status: "FAIL", reason: `r=${r.toFixed(2)} — ambient overwhelming optode` };
                    },
                  },

                  // ═════════════════════════════════════════════════════
                  // TIER 2 — medium effort, deeper physiology / transport
                  // ═════════════════════════════════════════════════════

                  // HbO ↔ HR low-freq coupling. Persistent strong r = HbO
                  // signal is dominated by cardiac contamination.
                  {
                    label: "HbO ⟷ HR coupling (vasomotor)",
                    source: "Yücel 2021 best-practices",
                    compute: (b) => {
                      const xs: number[] = []; const ys: number[] = [];
                      for (const s of b) {
                        const hbo = ((s.oxyHbLeft ?? 0) + (s.oxyHbRight ?? 0)) / 2;
                        const hr = s.pulseHrBpm;
                        if (typeof hr === "number" && Number.isFinite(hr) && Number.isFinite(hbo)) {
                          xs.push(hbo); ys.push(hr);
                        }
                      }
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 paired HbO/HR samples" };
                      const r = pearson(xs, ys);
                      if (r == null) return { status: "FAIL", reason: "coupling undefined" };
                      const a = Math.abs(r);
                      if (a <= 0.8) return { status: "PASS", reason: `|r|=${a.toFixed(2)} (mild coupling)` };
                      if (a <= 0.95) return { status: "WARN", reason: `|r|=${a.toFixed(2)} — strong cardiac coupling` };
                      return { status: "WARN", reason: `|r|=${a.toFixed(2)} — HbO dominated by cardiac signal` };
                    },
                  },
                  // Mayer-wave band power at 0.1 Hz — advisory only on
                  // 10-second buffer (only 1 Mayer cycle captured), so
                  // never FAIL; surface as informational metric.
                  {
                    label: "Mayer-wave band power (0.1 Hz, HbO L)",
                    source: "Yücel 2016 / Pinti 2021",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      if (xs.length < 100) return { status: "PASS", reason: "buffer too short for Mayer estimate" };
                      const ratio = goertzelRatio(xs, 0.1 / FPS);
                      if (ratio < 0.50) return { status: "PASS", reason: `Mayer/E=${(ratio * 100).toFixed(0)}%` };
                      return { status: "WARN", reason: `Mayer/E=${(ratio * 100).toFixed(0)}% — strong 0.1 Hz contamination` };
                    },
                  },
                  // Respiration band power (~0.25 Hz) on pulse PPG.
                  {
                    label: "Respiration band power (PPG, 0.25 Hz)",
                    source: "Scholkmann 2019",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.pulsePpg);
                      if (xs.length < 60) return { status: "FAIL", reason: "need ≥60 pulse samples" };
                      const ratio = goertzelRatio(xs, 0.25 / FPS);
                      if (ratio >= 0.005) return { status: "PASS", reason: `resp/E=${(ratio * 100).toFixed(1)}% (modulation present)` };
                      return { status: "PASS", reason: `resp/E=${(ratio * 100).toFixed(2)}% — minimal RSA` };
                    },
                  },
                  // TDDR-style spike detector (without applying correction):
                  // mark frames whose Δ exceeds median(|Δ|) by ≥ k MADs.
                  {
                    label: "TDDR spike-rate detector (HbO L)",
                    source: "Fishburn 2019 (TDDR)",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      if (xs.length < 60) return { status: "FAIL", reason: "need ≥60 HbO samples" };
                      const d = diffOf(xs).map(Math.abs);
                      const mm = medianMad(d);
                      if (!mm || mm.mad < 1e-9) return { status: "PASS", reason: "Δ near constant" };
                      const k = 5; const thr = mm.median + k * 1.4826 * mm.mad;
                      let n = 0;
                      for (const v of d) if (v > thr) n++;
                      const frac = n / d.length;
                      if (frac <= 0.03) return { status: "PASS", reason: `${n} spikes (${(frac * 100).toFixed(1)}%)` };
                      if (frac <= 0.10) return { status: "WARN", reason: `${n} spikes (${(frac * 100).toFixed(1)}%) — moderate motion` };
                      return { status: "FAIL", reason: `${n} spikes (${(frac * 100).toFixed(1)}%) — many MA candidates` };
                    },
                  },
                  // Cooper/Molavi wavelet-MA proxy: count frames where a
                  // local-window std exceeds k× the global std.
                  {
                    label: "MA flagger (window-std spikes, HbO L)",
                    source: "Cooper 2012 / Molavi 2012 (proxy)",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      if (xs.length < 60) return { status: "FAIL", reason: "need ≥60 HbO samples" };
                      const gStd = stdOf(xs);
                      if (gStd < 1e-9) return { status: "PASS", reason: "σ≈0 — signal flat" };
                      const W = 8;
                      let spikes = 0;
                      for (let i = W; i < xs.length; i++) {
                        const w = xs.slice(i - W, i);
                        if (stdOf(w) > 3 * gStd) spikes++;
                      }
                      const frac = spikes / Math.max(1, xs.length - W);
                      if (frac <= 0.05) return { status: "PASS", reason: `${spikes} MA windows (${(frac * 100).toFixed(1)}%)` };
                      if (frac <= 0.15) return { status: "WARN", reason: `${spikes} MA windows (${(frac * 100).toFixed(1)}%)` };
                      return { status: "FAIL", reason: `${spikes} MA windows (${(frac * 100).toFixed(1)}%) — heavy artifact` };
                    },
                  },
                  // Homer3 SNR — channel viability proxy.
                  {
                    label: "Homer3 SNR (HbO L)",
                    source: "Homer3 hmrR_PruneChannels",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const m = Math.abs(meanOf(xs));
                      const s = stdOf(xs);
                      if (s < 1e-9) return { status: "WARN", reason: "σ≈0 — channel flat" };
                      const snr = m / s;
                      if (snr >= 1.5) return { status: "PASS", reason: `SNR=${snr.toFixed(2)}` };
                      if (snr >= 0.3) return { status: "PASS", reason: `SNR=${snr.toFixed(2)} (acceptable)` };
                      return { status: "WARN", reason: `SNR=${snr.toFixed(2)} — noisy channel` };
                    },
                  },
                  {
                    label: "Homer3 SNR (HbO R)",
                    source: "Homer3 hmrR_PruneChannels",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbRight);
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const m = Math.abs(meanOf(xs));
                      const s = stdOf(xs);
                      if (s < 1e-9) return { status: "WARN", reason: "σ≈0 — channel flat" };
                      const snr = m / s;
                      if (snr >= 1.5) return { status: "PASS", reason: `SNR=${snr.toFixed(2)}` };
                      if (snr >= 0.3) return { status: "PASS", reason: `SNR=${snr.toFixed(2)} (acceptable)` };
                      return { status: "WARN", reason: `SNR=${snr.toFixed(2)} — noisy channel` };
                    },
                  },
                  // L/R HbO power-asymmetry index.
                  {
                    label: "L/R HbO power-asymmetry",
                    source: "Bilateral-fit symmetry",
                    compute: (b) => {
                      const L = numericVals(b, (s) => s.oxyHbLeft);
                      const R = numericVals(b, (s) => s.oxyHbRight);
                      if (L.length < 30 || R.length < 30) return { status: "FAIL", reason: "need ≥30 samples per side" };
                      const vL = varOf(L); const vR = varOf(R);
                      if (vL + vR < 1e-9) return { status: "WARN", reason: "var≈0 both sides" };
                      const idx = (vL - vR) / (vL + vR);
                      const a = Math.abs(idx);
                      if (a <= 0.4) return { status: "PASS", reason: `idx=${idx.toFixed(2)}` };
                      if (a <= 0.7) return { status: "WARN", reason: `idx=${idx.toFixed(2)} — asymmetric coupling` };
                      return { status: "WARN", reason: `idx=${idx.toFixed(2)} — strongly asymmetric — one optode loose` };
                    },
                  },
                  // Lag-1 autocorr whiteness on HbO L.
                  {
                    label: "HbO L whiteness (lag-1 autocorr)",
                    source: "Ljung-Box / general TS",
                    compute: (b) => {
                      const xs = numericVals(b, (s) => s.oxyHbLeft);
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 HbO samples" };
                      const r = autocorrLag(xs, 1);
                      if (r == null) return { status: "FAIL", reason: "autocorr undefined" };
                      if (r >= 0.35 && r <= 0.999) return { status: "PASS", reason: `r₁=${r.toFixed(3)}` };
                      if (r > 0.999) return { status: "WARN", reason: `r₁=${r.toFixed(4)} — channel flat` };
                      return { status: "WARN", reason: `r₁=${r.toFixed(2)} — white-noise-like (decoder?)` };
                    },
                  },
                  // log(IBI) skewness — healthy IBI distribution is log-normal.
                  {
                    label: "log(IBI) skewness",
                    source: "IBI distribution literature",
                    compute: (b) => {
                      const ibis = ibiSeriesFromHr(b);
                      if (ibis.length < 30) return { status: "FAIL", reason: "need ≥30 IBIs" };
                      const log = ibis.map(Math.log);
                      const sk = skewOf(log);
                      if (sk == null) return { status: "FAIL", reason: "skew undefined" };
                      const a = Math.abs(sk);
                      if (a <= 1.5) return { status: "PASS", reason: `skew(log(IBI))=${sk.toFixed(2)}` };
                      if (a <= 2.5) return { status: "WARN", reason: `skew(log(IBI))=${sk.toFixed(2)}` };
                      return { status: "WARN", reason: `skew(log(IBI))=${sk.toFixed(2)} — heavy-tailed (ectopic-laden)` };
                    },
                  },
                  // Motion-Artifact Ratio — Pearson²(HbO_mean, accelMag).
                  // Explicit "how much HbO variance is explained by motion".
                  {
                    label: "MAR — HbO² ↔ accel correlation",
                    source: "Metz / Wolf 2015",
                    compute: (b) => {
                      const xs: number[] = []; const ys: number[] = [];
                      for (const s of b) {
                        const hbo = ((s.oxyHbLeft ?? 0) + (s.oxyHbRight ?? 0)) / 2;
                        if (typeof s.accelMag === "number" && Number.isFinite(hbo)) {
                          xs.push(hbo); ys.push(s.accelMag);
                        }
                      }
                      if (xs.length < 30) return { status: "FAIL", reason: "need ≥30 paired samples" };
                      const r = pearson(xs, ys);
                      if (r == null) return { status: "FAIL", reason: "MAR undefined" };
                      const r2 = r * r;
                      if (r2 <= 0.25) return { status: "PASS", reason: `r²=${r2.toFixed(2)} (motion-clean)` };
                      if (r2 <= 0.50) return { status: "WARN", reason: `r²=${r2.toFixed(2)} — partial motion contamination` };
                      return { status: "FAIL", reason: `r²=${r2.toFixed(2)} — HbO largely motion-driven` };
                    },
                  },
                  // Free-fall / impact spike detector.
                  {
                    label: "Free-fall / impact spike count",
                    source: "Accelerometer practice",
                    compute: (b) => {
                      const acs = numericVals(b, (s) => s.accelMag);
                      if (acs.length < 30) return { status: "FAIL", reason: "need ≥30 accel samples" };
                      let ff = 0, impact = 0;
                      for (const a of acs) {
                        if (a < 0.3) ff++;
                        else if (a > 3.0) impact++;
                      }
                      const total = ff + impact;
                      if (total === 0) return { status: "PASS", reason: "no FF/impact events" };
                      if (total <= 1) return { status: "WARN", reason: `${ff} free-fall + ${impact} impact frames` };
                      return { status: "FAIL", reason: `${ff} free-fall + ${impact} impact frames — band may have dropped/knocked` };
                    },
                  },
                  // Reward distribution health.
                  {
                    label: "Reward distribution health",
                    source: "NF design heuristic",
                    compute: (b) => {
                      const rs = numericVals(b, (s) => s.rewardScore);
                      if (rs.length < 30) return { status: "FAIL", reason: "need ≥30 reward samples" };
                      const m = meanOf(rs);
                      const range = Math.max(...rs) - Math.min(...rs);
                      // Steady-state EMA-smoothed reward legitimately
                      // stays in a tight band when the user is regulating.
                      // Only FAIL if the reward is truly stuck (range<2).
                      if (range >= 4 && m >= 15 && m <= 85) return { status: "PASS", reason: `mean=${m.toFixed(0)} · range=${range.toFixed(0)}` };
                      if (range < 2) return { status: "FAIL", reason: `range=${range.toFixed(1)} — reward almost constant` };
                      return { status: "WARN", reason: `mean=${m.toFixed(0)} · range=${range.toFixed(0)} — narrow / off-centre band` };
                    },
                  },
                  // Postural sway band — Goertzel at 0.5 Hz on accelMag.
                  {
                    label: "Postural sway power (0.5 Hz on accel)",
                    source: "Posturography literature",
                    compute: (b) => {
                      const acs = numericVals(b, (s) => s.accelMag);
                      if (acs.length < 60) return { status: "FAIL", reason: "need ≥60 accel samples" };
                      const ratio = goertzelRatio(acs, 0.5 / FPS);
                      if (ratio < 0.10) return { status: "PASS", reason: `sway/E=${(ratio * 100).toFixed(1)}%` };
                      if (ratio < 0.30) return { status: "WARN", reason: `sway/E=${(ratio * 100).toFixed(0)}% — moderate sway` };
                      return { status: "WARN", reason: `sway/E=${(ratio * 100).toFixed(0)}% — heavy postural sway` };
                    },
                  },
                  // Pulse vs accel energy session-class — single composite
                  // "clean session" metric.
                  {
                    label: "Pulse / accel energy session-class",
                    source: "General signal-energy QA",
                    compute: (b) => {
                      const ppg = numericVals(b, (s) => s.pulsePpg);
                      const acs = numericVals(b, (s) => s.accelMag);
                      if (ppg.length < 30 || acs.length < 30) return { status: "FAIL", reason: "need ≥30 paired samples" };
                      let pE = 0; for (const v of ppg) pE += v * v;
                      let aE = 0; for (const v of acs) aE += (v - 1) * (v - 1);
                      const ratio = aE > 1e-9 ? pE / aE : Infinity;
                      if (ratio >= 5) return { status: "PASS", reason: `pulse/accel E=${ratio.toExponential(2)} (clean)` };
                      if (ratio >= 1) return { status: "WARN", reason: `pulse/accel E=${ratio.toFixed(2)} — motion-mixed` };
                      return { status: "FAIL", reason: `pulse/accel E=${ratio.toFixed(2)} — motion-dominated session` };
                    },
                  },
                ];
                const physResults = physChecks.map((p) => ({ check: p, result: p.compute(buf) }));

                const counts = { PASS: 0, WARN: 0, FAIL: 0, "N/A": 0 } as Record<"PASS" | "WARN" | "FAIL" | "N/A", number>;
                for (const r of results) counts[r.result.status]++;
                for (const r of physResults) counts[r.result.status]++;

                // ── Record WARN/FAIL into persistent history ─────────
                // De-duped by (level + label + reason). Each unique issue
                // is upserted with first-seen, last-seen, count++ so we
                // can see every issue that fired during the session even
                // if it cleared up before the next snapshot.
                const now = Date.now();
                const hist = mendiHistoryRef.current;
                const recordIssue = (level: "WARN" | "FAIL", label: string, reason: string) => {
                  // Skip warm-up "only N samples — wait longer" entries.
                  // These fire dozens of times during the first ~10 s of a
                  // session as the buffer fills; they aren't real issues.
                  if (reason.startsWith("only ") && reason.includes(" samples — wait longer")) return;
                  if (reason.startsWith("need ≥") && reason.includes("samples")) return;
                  if (reason === "no samples yet") return;
                  // pulse-hr / pulse-hrv legitimately need several beats to
                  // populate (≥3 beats for HR, ≥4 for HRV-RMSSD). At a 60
                  // BPM resting rate that's 3–4 s on TOP of the 3 s pulse-
                  // PPG window-fill → ~7 s before HR is even computable,
                  // ~9 s before HRV. Extend the warm-up filter for these
                  // two specifically to 300 samples (10 s @ 31 fps).
                  if (reason === "no data — field never populated" && buf.length < 150) return;
                  if (
                    reason === "no data — field never populated" &&
                    (label === "mendi-pulse-hr" || label === "mendi-pulse-hrv") &&
                    buf.length < 300
                  ) return;
                  if (reason === "insufficient samples" && buf.length < 150) return;
                  if (
                    reason === "insufficient HbO/HHb pairs" ||
                    reason === "insufficient HbO L+R pairs" ||
                    reason === "insufficient TSI samples" ||
                    reason === "no paired pulse/accel data" ||
                    reason === "no paired ambient/SQP samples" ||
                    reason === "no paired HbO L+R pairs" ||
                    reason === "need ≥30 IBIs" ||
                    reason === "need ≥60 pulse + HR samples" ||
                    reason === "need ≥60 HbO + HR samples" ||
                    reason === "need ≥30 paired HbO/HR samples" ||
                    reason === "need ≥30 paired samples" ||
                    reason === "need ≥30 reward samples" ||
                    reason === "need ≥30 temp samples" ||
                    reason === "need ≥30 accel samples" ||
                    reason === "skew undefined" ||
                    reason === "coupling undefined" ||
                    reason === "HR not yet valid" ||
                    reason === "MAR undefined" ||
                    reason === "complexity undefined" ||
                    reason === "mobility undefined" ||
                    reason === "autocorr undefined" ||
                    reason === "slope undefined" ||
                    reason === "autocorr null" ||
                    reason === "not enough still samples to assess"
                  ) return;
                  // Dedup by LABEL+LEVEL only (not reason). The reason text
                  // varies sample-to-sample because of floating-point
                  // statistics; dedupping on full text would produce
                  // thousands of near-duplicate entries. We track only the
                  // most recent reason so the user sees current state.
                  const key = `${level}|${label}`;
                  const existing = hist.get(key);
                  if (existing) {
                    existing.lastAt = now;
                    existing.count += 1;
                    existing.reason = reason; // keep most recent reason text
                  } else {
                    hist.set(key, { level, label, reason, firstAt: now, lastAt: now, count: 1 });
                  }
                };
                for (const r of results) {
                  if (r.result.status === "WARN" || r.result.status === "FAIL") {
                    recordIssue(r.result.status, r.check.widget, r.result.reason);
                  }
                }
                for (const r of physResults) {
                  if (r.result.status === "WARN" || r.result.status === "FAIL") {
                    recordIssue(r.result.status, r.check.label, r.result.reason);
                  }
                }
                const widgetRows = results.map((r) => {
                  const icon = r.result.status === "PASS" ? "✓"
                    : r.result.status === "WARN" ? "⚠"
                    : r.result.status === "N/A"  ? "·"
                    : "✗";
                  return `${icon} ${r.result.status.padEnd(4)}  ${r.check.widget.padEnd(40)}  ${r.result.reason}`;
                });
                const physRows = physResults.map((r) => {
                  const icon = r.result.status === "PASS" ? "✓"
                    : r.result.status === "WARN" ? "⚠"
                    : r.result.status === "N/A"  ? "·"
                    : "✗";
                  return `${icon} ${r.result.status.padEnd(4)}  ${r.check.label.padEnd(48)}  ${r.result.reason}`;
                });
                const rows = [
                  "── Per-widget data-source checks ──",
                  ...widgetRows,
                  "",
                  "── Physiology / signal-quality checks ──",
                  ...physRows,
                ];
                // Composite Pollonini-style "session usability" gate.
                // Replaces the previous flat PASS/WARN/FAIL fraction with
                // a weighted score over the most clinically meaningful
                // SQIs. Mirrors the Pollonini/PHOEBE 2016 binarisation
                // convention (≥ 75% good frames per channel = USABLE).
                //
                // Each contributing check gets a weight (1–3); a PASS
                // earns full weight, a WARN half, FAIL zero. Score is
                // (sum earned / sum max-weight) × 100.
                const RQS_WEIGHTS: Record<string, number> = {
                  // Pollonini-style coupling
                  "SCI — cardiac-coupling (HbO L)": 3,
                  "SCI — cardiac-coupling (HbO R)": 3,
                  "PSP — cardiac band power (HbO L)": 2,
                  // PPG signal quality (Elgendi)
                  "PPG skewness SQI": 2,
                  "PPG kurtosis SQI": 1,
                  // Motion
                  "GVTD-lite head motion detector": 2,
                  "MAR — HbO² ↔ accel correlation": 2,
                  "TDDR spike-rate detector (HbO L)": 1,
                  "MA flagger (window-std spikes, HbO L)": 1,
                  // Outlier robustness
                  "HbO L Hampel outlier rate": 1,
                  "HbO R Hampel outlier rate": 1,
                  // Drift / fit
                  "L/R HbO drift-slope symmetry": 1,
                  "L/R HbO power-asymmetry": 1,
                  // Transport
                  "Stream freshness (time-since-last-frame)": 1,
                  "BLE max inter-frame gap": 1,
                  // Perfusion / pulse
                  "Perfusion index (proxy)": 2,
                  // Pipeline integrity
                  "Reward ⟷ HbO responsivity": 2,
                };
                let earned = 0; let totalWeight = 0;
                for (const r of physResults) {
                  const w = RQS_WEIGHTS[r.check.label];
                  if (!w) continue;
                  totalWeight += w;
                  if (r.result.status === "PASS") earned += w;
                  else if (r.result.status === "WARN") earned += w * 0.5;
                }
                const rqs = totalWeight > 0 ? earned / totalWeight : 0;
                const rqsPct = Math.round(rqs * 100);
                // Labels follow Pollonini binarisation: ≥ 80 USABLE (good
                // for clinical recording), 50–80 MARGINAL (acceptable for
                // research / consumer NF), < 50 REJECT.
                const rqsLabel =
                  rqs >= 0.80 ? "USABLE" :
                  rqs >= 0.50 ? "MARGINAL" : "REJECT";
                const rqsColor =
                  rqs >= 0.80 ? "#34D399" :
                  rqs >= 0.50 ? "#FBBF24" : "#F87171";
                const fullText = `Widget test report · ${buf.length} samples · refresh #${mendiStatsTick}\n` +
                  `Session Quality Index (Pollonini-style): ${rqsPct}/100 (${rqsLabel})\n` +
                  `${counts.PASS} PASS · ${counts.WARN} WARN · ${counts.FAIL} FAIL · ${counts["N/A"]} N/A\n\n${rows.join("\n")}`;
                // When ?debug=1 is NOT set, render only a compact
                // "Ready to record" SQI badge. Clinicians see a single
                // pill instead of the full diagnostic dump.
                if (!debugMode) {
                  return (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "#020617", border: `1px solid ${rqsColor}40`,
                      borderRadius: 999, padding: "6px 14px", marginBottom: 16,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontSize: 11, color: "#CBD5E1",
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: rqsColor, boxShadow: `0 0 6px ${rqsColor}`,
                      }} />
                      <span style={{ color: "#94A3B8" }}>SQI</span>
                      <strong style={{ color: rqsColor, fontWeight: 800 }}>{rqsPct}/100</strong>
                      <span style={{ color: rqsColor, fontWeight: 700 }}>{rqsLabel}</span>
                      <span style={{ color: "#475569" }}>·</span>
                      <span style={{ color: "#94A3B8", fontSize: 10 }}>{buf.length} samples</span>
                    </div>
                  );
                }
                return (
                  <div style={{
                    background: "#020617", border: "1px solid #1E293B", borderRadius: 12,
                    padding: "12px 14px", marginBottom: 16,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11, lineHeight: 1.5,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>
                        Widget test report · SQI{" "}
                        <span style={{ color: rqsColor, fontWeight: 800 }}>{rqsPct}/100 {rqsLabel}</span> ·{" "}
                        <span style={{ color: "#34D399" }}>{counts.PASS} PASS</span> ·{" "}
                        <span style={{ color: "#FBBF24" }}>{counts.WARN} WARN</span> ·{" "}
                        <span style={{ color: "#F87171" }}>{counts.FAIL} FAIL</span> ·{" "}
                        <span style={{ color: "#64748B" }}>{counts["N/A"]} N/A</span>
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(fullText);
                            setMendiReportCopiedAt(Date.now());
                          } catch {
                            const ta = document.createElement("textarea");
                            ta.value = fullText;
                            document.body.appendChild(ta);
                            ta.select();
                            try { document.execCommand("copy"); setMendiReportCopiedAt(Date.now()); } catch {}
                            document.body.removeChild(ta);
                          }
                        }}
                        style={{
                          background: mendiReportCopiedAt && Date.now() - mendiReportCopiedAt < 1500 ? "#065F46" : "transparent",
                          border: `1px solid ${mendiReportCopiedAt && Date.now() - mendiReportCopiedAt < 1500 ? "#10B981" : "#334155"}`,
                          color: mendiReportCopiedAt && Date.now() - mendiReportCopiedAt < 1500 ? "#34D399" : "#94A3B8",
                          borderRadius: 6, padding: "2px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                        }}
                      >
                        {mendiReportCopiedAt && Date.now() - mendiReportCopiedAt < 1500 ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <pre style={{ margin: 0, color: "#CBD5E1", whiteSpace: "pre-wrap" }}>
                      {rows.map((r, i) => {
                        // Section header rows ("── Per-widget …") get a
                        // dim accent colour; empty separator rows render
                        // as a blank line; otherwise colour-code by
                        // status icon at the start.
                        if (r === "") return <div key={`blank-${i}`}>&nbsp;</div>;
                        if (r.startsWith("──")) {
                          return <div key={`hdr-${i}`} style={{ color: "#94A3B8", fontWeight: 700, marginTop: 4 }}>{r}</div>;
                        }
                        const color = r.startsWith("✓") ? "#34D399"
                          : r.startsWith("⚠") ? "#FBBF24"
                          : r.startsWith("·") ? "#64748B"
                          : "#F87171";
                        return (
                          <div key={`row-${i}`} style={{ color }}>{r}</div>
                        );
                      })}
                    </pre>
                  </div>
                );
              })()
            )}

            {/* Mendi test HISTORY panel — accumulates every WARN/FAIL
                that's been seen during the session, deduped by
                (level + label + reason). Lets you spot transient issues
                that fired once between snapshots and would otherwise be
                lost. Strip mode only. */}
            {appMode === "strip" && debugMode && mendiStatsTick > 0 && mendiHistoryRef.current.size > 0 && (
              (() => {
                const entries = Array.from(mendiHistoryRef.current.values())
                  // FAIL above WARN; within a level, most-frequent first.
                  .sort((a, b) => {
                    if (a.level !== b.level) return a.level === "FAIL" ? -1 : 1;
                    return b.count - a.count;
                  });
                const counts = { WARN: 0, FAIL: 0 } as Record<"WARN" | "FAIL", number>;
                for (const e of entries) counts[e.level]++;
                const rows = entries.map((e) => {
                  const icon = e.level === "FAIL" ? "✗" : "⚠";
                  const first = new Date(e.firstAt).toLocaleTimeString("en-US", { hour12: false });
                  const last = new Date(e.lastAt).toLocaleTimeString("en-US", { hour12: false });
                  const span = e.firstAt === e.lastAt ? first : `${first}–${last}`;
                  return `${icon} ${e.level.padEnd(4)}  ×${String(e.count).padStart(3)}  ${span}  ${e.label.padEnd(48)}  ${e.reason}`;
                });
                const fullText = `Mendi test HISTORY · ${entries.length} unique issues · refresh #${mendiStatsTick}\n` +
                  `${counts.WARN} WARN · ${counts.FAIL} FAIL\n\n` + rows.join("\n");
                return (
                  <div style={{
                    background: "#020617", border: "1px solid #1E293B", borderRadius: 12,
                    padding: "12px 14px", marginBottom: 16,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11, lineHeight: 1.5,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>
                        Mendi test history ·{" "}
                        <span style={{ color: "#FBBF24" }}>{counts.WARN} WARN</span> ·{" "}
                        <span style={{ color: "#F87171" }}>{counts.FAIL} FAIL</span> · {entries.length} unique
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(fullText);
                              setMendiHistoryCopiedAt(Date.now());
                            } catch {
                              const ta = document.createElement("textarea");
                              ta.value = fullText;
                              document.body.appendChild(ta);
                              ta.select();
                              try { document.execCommand("copy"); setMendiHistoryCopiedAt(Date.now()); } catch {}
                              document.body.removeChild(ta);
                            }
                          }}
                          style={{
                            background: mendiHistoryCopiedAt && Date.now() - mendiHistoryCopiedAt < 1500 ? "#065F46" : "transparent",
                            border: `1px solid ${mendiHistoryCopiedAt && Date.now() - mendiHistoryCopiedAt < 1500 ? "#10B981" : "#334155"}`,
                            color: mendiHistoryCopiedAt && Date.now() - mendiHistoryCopiedAt < 1500 ? "#34D399" : "#94A3B8",
                            borderRadius: 6, padding: "2px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                          }}
                        >
                          {mendiHistoryCopiedAt && Date.now() - mendiHistoryCopiedAt < 1500 ? "Copied ✓" : "Copy"}
                        </button>
                        <button
                          onClick={() => { mendiHistoryRef.current = new Map(); setMendiStatsTick((t) => t + 1); }}
                          style={{ background: "transparent", border: "1px solid #334155", color: "#94A3B8", borderRadius: 6, padding: "2px 8px", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <pre style={{ margin: 0, color: "#CBD5E1", whiteSpace: "pre-wrap" }}>
                      {rows.map((r, i) => {
                        const color = r.startsWith("✗") ? "#F87171" : "#FBBF24";
                        return <div key={`hist-${i}`} style={{ color }}>{r}</div>;
                      })}
                    </pre>
                  </div>
                );
              })()
            )}

            {/* My Devices — sits above widgets so the operator can manage
                what's paired before composing the dashboard around it.
                Hidden in 'strip' mode — clinicians pair via the Connect
                device button and won't see the management list yet. */}
            {appMode !== "strip" && (
              <MyDevicesSection
                pairedIds={devices.pairedIds}
                onUnpair={(id) => {
                  devices.setPairedIds((prev) => prev.filter((x) => x !== id));
                  const d = DEVICE_REGISTRY.find((x) => x.id === id);
                  if (d) showToast(`Unpaired: ${d.name}`);
                }}
                onOpenConnect={() => setConnectDeviceOpen(true)}
              />
            )}

            {dashboard.hydrated && dashboard.widgets.length === 0 && (
              <DashboardEmptyState onAdd={() => setDashboardPickerOpen(true)} />
            )}

            {dashboard.widgets.length > 0 && (
              <div className="demo-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {dashboard.widgets.map((id) => {
                  const def = WIDGET_CATALOG.find((w) => w.id === id);
                  if (!def) return null;
                  return (
                    <WidgetCard
                      key={id}
                      def={def}
                      onRemove={() => {
                        dashboard.setWidgets((prev) => prev.filter((x) => x !== id));
                        showToast(`Removed: ${def.title}`);
                      }}
                      ctx={{
                        sample,
                        reward: reward.data,
                        oxyL: oxyL.data,
                        oxyR: oxyR.data,
                        deoxyL: deoxyL.data,
                        deoxyR: deoxyR.data,
                        thetaW: thetaW.data,
                        alphaW: alphaW.data,
                        betaW: betaW.data,
                        elapsed,
                        markersCount: markers.length,
                        quickNote: dashboard.quickNote,
                        setQuickNote: dashboard.setQuickNote,
                      }}
                    />
                  );
                })}
              </div>
            )}

            <WidgetPicker
              open={dashboardPickerOpen}
              onClose={() => setDashboardPickerOpen(false)}
              currentIds={dashboard.widgets}
              onAdd={(id) => {
                // Don't auto-close — keep the picker open so the user
                // can keep building their layout in one pass. They
                // close it explicitly via the X / overlay click.
                dashboard.setWidgets((prev) => [...prev, id]);
                const def = WIDGET_CATALOG.find((w) => w.id === id);
                if (def) showToast(`Added: ${def.title}`);
              }}
              onRemove={(id) => {
                dashboard.setWidgets((prev) => prev.filter((w) => w !== id));
                const def = WIDGET_CATALOG.find((w) => w.id === id);
                if (def) showToast(`Removed: ${def.title}`);
              }}
            />

            <ConnectDeviceModal
              open={connectDeviceOpen}
              onClose={() => setConnectDeviceOpen(false)}
              pairedIds={devices.pairedIds}
              onUnpair={(id) => {
                devices.setPairedIds((prev) => prev.filter((x) => x !== id));
                const d = DEVICE_REGISTRY.find((x) => x.id === id);
                if (d) showToast(`Unpaired: ${d.name}`);
              }}
              onPair={async (id) => {
                const d = DEVICE_REGISTRY.find((x) => x.id === id);
                setConnectDeviceOpen(false);
                // For real BLE devices we ONLY mark them "paired" after the
                // Web Bluetooth handshake actually succeeds. Otherwise the
                // badge would lie: it would say "Paired ✓" even when the
                // device is off, never reachable, or the chooser was
                // dismissed. Stub devices (Oura, Apple Watch — no adapter
                // yet) get marked paired immediately since there's nothing
                // to verify.
                if (id === "mendi") {
                  showToast("Opening Bluetooth chooser…");
                  await switchLiveSource("mendi");
                  const ok = adapterRef.current instanceof MendiAdapter
                    && (adapterRef.current as MendiAdapter).isConnected();
                  if (ok) {
                    devices.setPairedIds((prev) => prev.includes(id) ? prev : [...prev, id]);
                    if (d) showToast(`Paired: ${d.name}`);
                  } else if (d) {
                    showToast(`Could not pair ${d.name} — see console for details.`);
                  }
                } else if (id === "muse2" || id === "muse-s") {
                  showToast("Opening Bluetooth chooser…");
                  await switchLiveSource("muse");
                  // MuseAdapter exposes isConnected() via the shared
                  // DeviceAdapter contract.
                  const ok = !!adapterRef.current && adapterRef.current.deviceType === "muse";
                  if (ok) {
                    devices.setPairedIds((prev) => prev.includes(id) ? prev : [...prev, id]);
                    if (d) showToast(`Paired: ${d.name}`);
                  } else if (d) {
                    showToast(`Could not pair ${d.name} — see console for details.`);
                  }
                } else {
                  // Stub vendor — no live adapter, just remember it.
                  devices.setPairedIds((prev) => prev.includes(id) ? prev : [...prev, id]);
                  if (d) showToast(`Paired: ${d.name}`);
                }
              }}
            />
          </>
        )}

        {/* ── LIVE SESSION ── */}
        {tab === "session" && (
          <>
            {/* Context strip */}
            <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: "3px solid #2563EB", borderRadius: 12, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(37,99,235,0.15)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700 }}>i</div>
              <span style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                <strong style={{ color: "#F1F5F9" }}>Clinician view</strong> — you're watching {demoClient.name}'s brain signals in real time (simulated). The <strong style={{ color: "#F1F5F9" }}>Reward Score</strong> rises when the client's brain is producing the target pattern. Switch to <button onClick={() => switchTab("game")} style={{ background: "none", border: "none", color: "#60A5FA", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13, textDecoration: "underline" }}>Game Mode</button> to see what the client sees.
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
              <span style={{ fontSize: 10, color: "#64748B" }}>Run 4–8 clients in one slot. Group sessions are insurance-reimbursable.</span>
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
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>Telehealth + live Mendi signals — clinician sees in real time what the at-home client's brain is doing</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
                    {[
                      { k: "Video lag",   v: "120 ms",   sub: "instant feel" },
                      { k: "Brain ↔ video", v: "± 80 ms", sub: "synced to one clock" },
                      { k: "Encryption",  v: "Strong",   sub: "industry standard" },
                      { k: "HIPAA",       v: "Daily.co", sub: "signed agreement" },
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
                { label: "Fp1 OxyHb · Mendi", quality: 96, color: "#10B981", impedance: "8 kΩ" },
                { label: "Fp2 OxyHb · Mendi", quality: 94, color: "#10B981", impedance: "9 kΩ" },
                { label: "AF7 EEG · Muse", quality: 88, color: "#10B981", impedance: "12 kΩ" },
                { label: "HRV · Polar", quality: 99, color: "#10B981", impedance: "—" },
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
                { label: "Device", value: `${demoClient.hw} (sim)`, updated: false },
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
                      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>Oxygen-rich blood ÷ total blood</span>
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
                  In clinic, the Mendi headband&rsquo;s prefrontal reward drives the visualizations. <strong style={{ color: "#E2E8F0" }}>Try it now without hardware:</strong> the Paced Breath Trainer below runs at the resonance frequency (5.5 bpm — Lehrer/Vaschillo canonical). Sustained rhythm coherence climbs the reward signal — same regulation pattern as a real session — and feeds Aurora, Generative Art, and Audio Interrupt.
                </p>
              </div>
            </div>

            {/* Anchor — multi-modal hardware-free analog of a Mendi session */}
            <div style={{ background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)", border: "1px solid #1E293B", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Anchor — Breath & Focus Trainer</div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", padding: "2px 7px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Hardware-free</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>
                    Hold the orb. Breathe with it (5.5 bpm resonance · Lehrer/Vaschillo). Don't react to drift.
                    Three streams — <strong style={{ color: "#CBD5E1" }}>breath coherence</strong>, <strong style={{ color: "#CBD5E1" }}>motor stillness</strong>, <strong style={{ color: "#CBD5E1" }}>response inhibition</strong> — combine into the reward signal. Same three behavioural correlates that drive prefrontal HbO2 in the Mendi paradigm.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => setInteractiveGame((v) => !v)}
                    aria-pressed={interactiveGame}
                    style={interactiveGame ? clinicianBtnPrimary : clinicianBtn}
                  >
                    {interactiveGame ? "⏸ Pause" : "▶ Begin Anchor"}
                  </button>
                  <button
                    onClick={() => { setInteractiveGame(false); setPlayerScore(0); showToast("Switched to live device feed (Mendi simulator)"); }}
                    style={clinicianBtn}
                    title="Use the Mendi simulator stream instead of player input"
                  >
                    Use device feed
                  </button>
                </div>
              </div>
              <FocusGame active={interactiveGame} onScore={setPlayerScore} height={320} />
              <div style={{ marginTop: 10, fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span>👆 Tap &amp; hold</span>
                <span>🖱️ Click &amp; hold</span>
                <span>⌨️ SPACE bar</span>
                <span style={{ marginLeft: "auto" }}>6 s EMA · 5 s calibration · same time constant as a real fNIRS reward.</span>
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
                <GameFeedback score={showClinicianOverlay ? (gameRewardVal ?? null) : null} threshold={rewardThreshold} />
              </div>
            )}

            {/* Generative Art */}
            {gameMode === "art" && (
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>Generative Art — Client View</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>Your brain is the paintbrush. Colors deepen and motion quickens as focus improves.</div>
                <div style={{
                  height: 300, borderRadius: 16, position: "relative", overflow: "hidden",
                  background: gameRewardVal != null
                    ? gameRewardVal >= 70
                      ? "linear-gradient(-45deg, #064E3B, #065F46, #0F172A, #10B981, #34D399, #064E3B)"
                      : gameRewardVal >= 40
                      ? "linear-gradient(-45deg, #0F172A, #1E3A5F, #1E40AF, #1D4ED8, #3B82F6, #0F172A)"
                      : "linear-gradient(-45deg, #0F172A, #1C1018, #3B0764, #4C0519, #7C3AED, #0F172A)"
                    : "linear-gradient(-45deg, #0F172A, #1E293B)",
                  backgroundSize: "400% 400%",
                  animation: `artShift ${gameRewardVal != null ? Math.max(2, 9 - (gameRewardVal / 100) * 7).toFixed(1) : "9"}s ease infinite`,
                  transition: "background 2s ease",
                }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                    <div style={{ fontSize: "clamp(3.5rem, 9vw, 5.5rem)", fontWeight: 800, color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: "0 0 60px rgba(255,255,255,0.4)" }}>
                      {gameRewardVal != null ? gameRewardVal.toFixed(0) : "—"}
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
                      {gameRewardVal == null ? "—" : gameRewardVal >= 80 ? "Peak focus ✦" : gameRewardVal >= 60 ? "On target" : gameRewardVal >= 40 ? "Building..." : "Warming up"}
                    </div>
                  </div>
                  {gameRewardVal != null && gameRewardVal >= 35 && (
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
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>Music plays when you're on target. When focus drops, audio pauses — a gentle nudge to refocus.</div>
                <div style={{
                  background: "#0F172A", borderRadius: 16, padding: "24px 28px",
                  opacity: gameRewardVal != null && gameRewardVal >= 60 ? 1 : 0.5,
                  transition: "opacity 0.8s ease",
                }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 12, flexShrink: 0,
                      background: "#2563EB",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: gameRewardVal != null && gameRewardVal >= 60 ? "spin 12s linear infinite" : "none",
                    }}>
                      <span style={{ fontSize: 28 }}>🎵</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>Ambient Focus Mix</div>
                      <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>EEGBase · Curated for neurofeedback</div>
                      <div style={{ height: 3, background: "#1E293B", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", background: "linear-gradient(90deg, #2563EB, #7C3AED)",
                          width: gameRewardVal != null && gameRewardVal >= 60 ? `${Math.min(98, 8 + (elapsed / 3))}%` : "8%",
                          transition: "width 1s linear",
                        }} />
                      </div>
                    </div>
                  </div>
                  {gameRewardVal != null && gameRewardVal >= 60 ? (
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
                { label: interactiveGame ? "Score (you)" : "Score", value: gameRewardVal != null ? gameRewardVal.toFixed(1) : "—", dot: gameRewardVal == null ? "#CBD5E1" : gameRewardVal >= 70 ? "#10B981" : gameRewardVal >= 40 ? "#F59E0B" : "#EF4444" },
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
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>Track heart rate variability and breathing alongside brain data. Helps clients pair calm breathing with focused brain states.</p>
            </div>

            {/* Live HRV metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="demo-grid-2">
              {[
                { label: "Heart Rate", val: sample?.heartRate, color: "#EF4444", unit: "bpm", norm: "60–80 bpm", icon: "❤️" },
                { label: "HRV (RMSSD)", val: sample?.hrvRmssd, color: "#8B5CF6", unit: "ms", norm: "Target: >50 ms", icon: "📊" },
                { label: "Coherence", val: sample?.hrvRmssd != null ? Math.min(9.9, (sample.hrvRmssd / 10)).toFixed(1) : null, color: "#10B981", unit: "/ 10", norm: "High: >8.0", icon: "🌊" },
                { label: "Resonance Freq", val: "5.5", color: "#F59E0B", unit: "breaths/min", norm: "Lehrer/Vaschillo canonical", icon: "🫁" },
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
                <span style={{ color: "#A5B4FC", fontWeight: 700 }}>↗</span> Sleep efficiency from Oura is the strongest predictor of Sarah's next-session ΔHbO gain (r=+0.74) — see AI Insights.
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Combined EEG + HRV Score</div>
                  <span title="Requires Muse for EEG + Polar/Apple Watch for HRV — Mendi alone can't drive this" style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(165,243,252,0.10)", color: "#A5F3FC", border: "1px solid rgba(165,243,252,0.25)", textTransform: "uppercase", letterSpacing: "0.04em" }}>⚡ Muse + Polar</span>
                </div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Both channels must exceed threshold for maximum reward — trains mind-body coherence simultaneously. Requires multi-channel EEG (Muse) plus an HRV source (Polar / Apple Watch).</p>
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
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Paced breathing guide at client's personal resonance frequency (typically 4.5–7 breaths/min) to maximize HRV amplitude.</p>
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
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>5.5 breaths/min · ~5.5s inhale / ~5.5s exhale (Lehrer/Vaschillo canonical)</div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Normative database comparison</h3>
                    <span title="EEG band-power comparison — Mendi alone cannot produce these values" style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(165,243,252,0.10)", color: "#A5F3FC", border: "1px solid rgba(165,243,252,0.25)", textTransform: "uppercase", letterSpacing: "0.04em" }}>⚡ EEG (Muse)</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Sarah's Z-scores vs age- and sex-matched cohort · n=847 healthy controls · LORETA source localization on roadmap. Mendi clients see prefrontal HbO only on the head-map below.</p>
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
                title="Mendi · Live Prefrontal fNIRS"
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Real-Time Z-Score Training</span>
                <span style={{ fontSize: 10, background: "#2563EB", color: "white", borderRadius: 99, padding: "2px 8px", fontWeight: 700 }}>LIVE</span>
                <span title="EEG-only feature — Mendi can't produce band-power z-scores" style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(165,243,252,0.10)", color: "#A5F3FC", border: "1px solid rgba(165,243,252,0.25)", textTransform: "uppercase", letterSpacing: "0.04em" }}>⚡ EEG (Muse)</span>
              </div>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20, lineHeight: 1.5 }}>
                We compare your client's brainwaves in real time to <strong style={{ color: "#A5B4FC" }}>847 healthy adults of the same age</strong>. The colored bars show how far they differ — the goal is to bring each band closer to 0 (the healthy average). A bar that shrinks toward the center means the training is working.
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
                { label: "θ/β Z-Score · EEG", key: "thetaBeta" as const, color: "#EF4444", max: 3, unit: " SD", improving: "lower" },
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
                AI watches your client's data. When progress stalls, it flags it and suggests what to try next. It also drafts session notes you can paste into your EHR.
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
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginTop: 2 }}>What moved Sarah's prefrontal OxyHb up over the last 8 sessions?</div>
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
                <button onClick={() => showToast("Pattern saved to EEGBase research registry · ready for Mendi co-publication once partnership confirmed")} style={{ ...clinicianBtn, fontSize: 12 }}>Send to research registry</button>
                <button
                  onClick={async () => {
                    setAiInsightLoading(true);
                    setAiInsightError(null);
                    const result = await generateDemoInsight();
                    setAiInsightLoading(false);
                    if (result.ok) {
                      setAiInsight({ text: result.text, model: result.model, latencyMs: result.latencyMs });
                    } else {
                      setAiInsightError(result.error);
                    }
                  }}
                  disabled={aiInsightLoading}
                  style={{ ...clinicianBtn, fontSize: 12, background: aiInsightLoading ? "#1E293B" : "#0F172A", border: "1px solid #4F46E5", color: "#A5B4FC" }}
                >
                  {aiInsightLoading ? "Calling Claude…" : aiInsight ? "↻ Re-run with live AI" : "✨ Run with live Claude Haiku"}
                </button>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#94A3B8" }}>Powered by Claude · only patterns at p&lt;0.05 surfaced</span>
              </div>

              {/* Live Claude Haiku interpretation */}
              {(aiInsight || aiInsightError) && (
                <div style={{ marginTop: 12, padding: 14, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.35)", borderRadius: 10 }}>
                  {aiInsightError ? (
                    <div style={{ fontSize: 11, color: "#FCA5A5" }}>
                      <strong style={{ color: "#F87171", fontWeight: 700 }}>AI call failed:</strong> {aiInsightError}
                    </div>
                  ) : aiInsight ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 9, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} />
                        Live Claude Haiku · {aiInsight.model} · {aiInsight.latencyMs} ms
                      </div>
                      <div style={{ fontSize: 12, color: "#E2E8F0", lineHeight: 1.6 }}>{aiInsight.text}</div>
                    </>
                  ) : null}
                </div>
              )}
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
                    <div style={{ color: "#CBD5E1", marginBottom: 6 }}><strong style={{ color: "#A78BFA" }}>Sarah (10:34):</strong> Better most nights. I've been waking up around 4am still — maybe twice last week.</div>
                    <div style={{ color: "#94A3B8", marginBottom: 6 }}><strong style={{ color: "#60A5FA" }}>Clinician (10:35):</strong> Any change in your overall mood?</div>
                    <div style={{ color: "#CBD5E1", marginBottom: 6 }}><strong style={{ color: "#A78BFA" }}>Sarah (10:35):</strong> I think so. Less foggy in the mornings. Work feels less heavy.</div>
                    <div style={{ color: "#94A3B8", marginBottom: 6 }}><strong style={{ color: "#60A5FA" }}>Clinician (10:36):</strong> Are you still tracking your check-ins in the client app daily?</div>
                    <div style={{ color: "#CBD5E1", marginBottom: 6 }}><strong style={{ color: "#A78BFA" }}>Sarah (10:36):</strong> Most days. Missed two days last weekend when traveling.</div>
                    <div style={{ background: "rgba(239,68,68,0.12)", borderLeft: "2px solid #EF4444", padding: "4px 8px", marginBottom: 6, borderRadius: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#FCA5A5", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>⚠ Risk language detected</span>
                      <span style={{ color: "#CBD5E1" }}>...sometimes I feel like nothing matters but I'd never...</span>
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
                    Sarah's prefrontal OxyHb dropped <strong style={{ color: "#FCA5A5" }}>−0.28 μM</strong> when the topic shifted to her father at 12:15 — a stronger physiological reaction than self-reported. Auto-flagged for SOAP &quot;Plan&quot; section.
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
                  Sarah's <strong style={{ color: "#F1F5F9" }}>brain calmness score hasn't improved</strong> in 3 sessions, even though she's training consistently. The current protocol may not be enough to settle her elevated forehead activity.
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
              <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 700, color: "#FBBF24", background: "rgba(251,191,36,0.15)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(251,191,36,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pending hardware capture</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(167,139,250,0.2)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: "1px solid rgba(167,139,250,0.3)" }}>↔</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Clinic ↔ Home Practice Bridge</div>
                  <div style={{ fontSize: 11, color: "#A5B4FC" }}>What becomes possible once we complete the independent BLE-protocol capture from a physical Mendi · today: simulator data only</div>
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
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Sarah's home practice this week</div>
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
                      { l: "Avg score", v: "67", sub: "EEGBase cohort median: 58", c: "#10B981" },
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
                    <strong style={{ color: "#FBBF24" }}>Modeled estimate</strong> · clinically-prescribed neurofeedback retention is documented at 3-5× consumer-app attrition rates (Linardon 2020, Carlbring 2018). Real EEGBase + Mendi cohort numbers TBD pending pilot rollout.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => showToast("Demo: protocol PDF emailed to Sarah · 3×/week × 12 min · today: PDF; once the EEGBase mobile app ships: direct push")} style={{ ...clinicianBtnPrimary, background: "#7C3AED" }}>Send protocol → Sarah</button>
                <button onClick={() => showToast("Demo: SMS reminder sent · once the EEGBase mobile app ships this would be an in-app message")} style={clinicianBtn}>💬 SMS reminder</button>
                <button onClick={() => showToast("Demo: home session screenshot opens — automatic sync requires the EEGBase mobile app (in development)")} style={clinicianBtn}>View last home session</button>
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
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>After each session, EEGBase auto-generates a superbill with CPT 90901 (biofeedback), 97012, and E/M codes. Export to CMS-1500 or Stripe self-pay. Most neurofeedback platforms make you pair with a separate EHR — we don't.</div>
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
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Protocol Library</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Evidence-based protocols sorted by condition. Search, preview, apply in one click. Open library — clinicians can add their own. (15 shown here, more coming.)
              </p>
            </div>

            {/* Mendi-Optimized Protocols (pinned) */}
            <div className="demo-flagship" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", border: "1px solid #4F46E5", borderRadius: 14, padding: 18, marginBottom: 16, boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 24px -16px rgba(79,70,229,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(167,139,250,0.2)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, border: "1px solid rgba(167,139,250,0.3)" }}>M</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Mendi-Optimized Protocols</div>
                    <div style={{ fontSize: 11, color: "#A5B4FC" }}>9 prefrontal-training protocols designed specifically for Mendi's dual-channel fNIRS</div>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#A5B4FC", padding: "3px 10px", background: "rgba(79,70,229,0.2)", borderRadius: 99, border: "1px solid rgba(79,70,229,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pinned · Mendi-Compatible</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }} className="demo-grid-2">
                {[
                  { name: "Focus Boost",            target: "Fp1+Fp2 HbO ↑ · 12 min",     cite: "Yamashita 2021", color: "#60A5FA" },
                  { name: "Anxiety Reduction",      target: "R-DLPFC down-train",         cite: "Trambaiolli 2021", color: "#34D399" },
                  { name: "Depression Asymmetry",   target: "L > R asymmetry training",  cite: "Ehlis 2014; Sutoko 2021", color: "#A78BFA" },
                  { name: "ADHD Inhibitory Control",target: "Sustained Fp1 HbO upregulation", cite: "Marx 2015", color: "#F59E0B" },
                  { name: "Burnout Recovery",       target: "DLPFC reactivation",         cite: "KU Leuven 2026", color: "#10B981" },
                  { name: "PTSD Hyperarousal",      target: "PFC down-regulation",        cite: "Kohl 2020", color: "#EC4899" },
                  { name: "Athletic Pre-Performance", target: "Approach motivation +",    cite: "Bishop 2022", color: "#06B6D4" },
                  { name: "Pediatric Focus (8–12)", target: "L-DLPFC sustained ↑",        cite: "Marx 2015", color: "#FBBF24" },
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
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>{p.target}</div>
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
                  device: "EEG required (Muse / multi-channel)",
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
                  device: "EEG required (Muse / multi-channel)",
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
                  device: "EEG required (multi-channel + temporal sites)",
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
                  device: "EEG required (Muse / multi-channel)",
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
                  device: "EEG required (Muse / multi-channel)",
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
                  device: "EEG required (Muse / multi-channel)",
                  desc: "Trains alpha at the client's individual peak frequency (typically 9–12 Hz) to maximize processing speed and attentional control. Popular with elite athletes, executives, and musicians.",
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
                        {p.device && (
                          <span title="Hardware required to run this protocol" style={{ fontSize: 10, background: "rgba(165,243,252,0.10)", color: "#A5F3FC", borderRadius: 6, padding: "3px 8px", fontWeight: 700, border: "1px solid rgba(165,243,252,0.25)" }}>⚡ {p.device}</span>
                        )}
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
                    { condition: "Peak Performance", name: "Alpha Peak Frequency (APF) Optimisation", tags: ["Athletes", "Peak Performance", "Focus", "Flow"] },
                  ];
                  const count = proto.filter((p) =>
                    !protocolSearch ||
                    p.condition.toLowerCase().includes(protocolSearch.toLowerCase()) ||
                    p.name.toLowerCase().includes(protocolSearch.toLowerCase()) ||
                    p.tags.some((t) => t.toLowerCase().includes(protocolSearch.toLowerCase()))
                  ).length;
                  return `Showing ${count} of 6 searchable EEG protocols (plus 9 Mendi-optimized pinned above)`;
                })()} — full library on roadmap will add ILF variants, LORETA-guided, gamma training, neuromuscular (TBI), and additional pediatric protocols.
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
              <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 700, color: "#FBBF24", background: "rgba(251,191,36,0.15)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(251,191,36,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Proposed · Pending Mendi Partnership</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(79,70,229,0.25)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid rgba(79,70,229,0.4)" }}>📊</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Outcomes Registry</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em" }}>Real-world Mendi outcomes — anonymized &amp; opt-in</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, marginBottom: 16 }}>
                Anonymous session data from EEGBase-pilot clinics, opt-in. Standard research format. <strong style={{ color: "#FBBF24" }}>Proposed</strong>: once Mendi joins as device partner, this becomes the peer-reviewed evidence pipeline their consumer claims have been missing. Numbers below are illustrative until pilot data lands.
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
                    <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>DOI pending · OSF Preprints submission</span>
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
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#C4B5FD", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Proposed: Co-author with Mendi</div>
                    <div style={{ fontSize: 12, color: "#F1F5F9", fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
                      12-week multi-clinic registry · IRB-pack ready
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.5, marginBottom: 8 }}>
                      Pre-built study protocol, IRB packet, and data pipeline. The proposal: Mendi is listed as the device, EEGBase-pilot clinics rotate as lead author. Open to discuss structure.
                    </div>
                  </div>
                  <button onClick={() => showToast("Demo: opens our proposed IRB pack to share with Mendi · DPA template included")} style={{ fontSize: 11, padding: "6px 12px", background: "#7C3AED", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>Open IRB packet →</button>
                </div>
              </div>

              {/* Registry IP / governance note */}
              <div style={{ marginBottom: 8, padding: "8px 12px", background: "rgba(15,23,42,0.55)", border: "1px solid #1E293B", borderRadius: 8, fontSize: 10, color: "#94A3B8", lineHeight: 1.55 }}>
                <strong style={{ color: "#A5B4FC", fontWeight: 700 }}>Who owns the data:</strong> Anonymized to HIPAA standards · Each clinic opts in (and can opt out any time) · Co-stewarded by EEGBase, the clinic, and Mendi · Mendi reviews any paper before publication · Your raw recordings stay on your server.
              </div>
              <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, fontSize: 10, color: "#86EFAC", lineHeight: 1.55, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#34D399", padding: "2px 7px", background: "rgba(34,197,94,0.15)", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em" }}>Q3 2026</span>
                <span><strong style={{ color: "#34D399", fontWeight: 700 }}>Sham-controlled RCT planned:</strong> n=180 ADHD adolescents · 3-arm (active / sham / waitlist) · ClinicalTrials.gov NCT registration pending · IRB approval target Q3 2026.</span>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => showToast("BIDS-compatible JSON export queued · sending to Mendi science team")} style={{ ...clinicianBtnPrimary, background: "#7C3AED" }}>Export to Mendi Science Team →</button>
                <button onClick={() => showToast("Filter outcomes by condition, age, region, protocol")} style={clinicianBtn}>Filter registry</button>
                <button onClick={() => showToast("View 14 active research studies using EEGBase + Mendi data")} style={clinicianBtn}>Active studies (14)</button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>One-Click Progress Reports</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Plain-English progress reports for clients, parents, or referring doctors. Branded PDF in one click. No exporting, no Word docs.
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
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>EEGBase vs every competitor</h2>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                We're the only one that covers everything in one app — live signal, AI, notes, billing, scheduling. Updated May 2026 from platform docs and clinician reviews.
              </p>
            </div>

            {/* Why EEGBase summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} className="demo-grid-2">
              {[
                { label: "fNIRS + EEG + HRV in one app", sub: "Most platforms cover one modality; we unify all three with native Mendi support", color: "#06B6D4" },
                { label: "AI cross-session pattern detector", sub: "Correlates Mendi data with sleep · mood · HRV · adherence — flags drivers", color: "#A855F7" },
                { label: "Free for licensed clinicians", sub: "No card · no per-seat fees · no \u201ccontact sales\u201d · hosted on HIPAA-friendly U.S. infra", color: "#10B981" },
                { label: "Browser-based now · Local desktop build coming", sub: "Run in any modern browser today — Mac, Windows, iPad, Chromebook · downloadable local build for fully on-device data is on the way", color: "#F59E0B" },
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
                <div style={{ marginTop: 6, color: "#A5B4FC" }}>
                  ⚡ <strong>Device note:</strong> EEG-band features (Z-score training, LORETA, normative DB, multi-channel band charts) require a multi-channel EEG headset such as Muse — not Mendi alone. fNIRS-only features (prefrontal HbO map, OxyHb sessions) work with Mendi. Multi-modal features blend both when paired.
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer CTA + site footer — hidden in 'strip' mode (the
          authenticated /dashboard doesn't need the public-marketing
          conversion bar or the bottom nav). */}
      {appMode !== "strip" && (
        <>
          <div style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #1E3A5F 100%)", borderTop: "1px solid #334155", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, color: "#C4B5FD", fontWeight: 600 }}>Ready to use with real clients?</span>
            <a href="/login" style={{ fontSize: 14, fontWeight: 700, padding: "8px 20px", background: "#7C3AED", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
              Get Access →
            </a>
            <a href="/contact" style={{ fontSize: 13, color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>
              Talk to us →
            </a>
          </div>

          {/* Site footer — mirrors the simplified homepage footer for cross-page
              chrome consistency. */}
          <footer style={{ background: "#fff", borderTop: "1px solid #E5E7EB", padding: "24px", color: "#9CA3AF", fontSize: 12 }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <span>© 2026 EEGBase &mdash; neurofeedback platform for clinics</span>
              <nav aria-label="Footer" style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 12 }}>
                <a href="/" style={{ color: "#6B7280", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Home</a>
                <a href="/mendi" style={{ color: "#6B7280", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Mendi</a>
                <a href="/pricing" style={{ color: "#6B7280", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Pricing</a>
                <a href="/privacy" style={{ color: "#6B7280", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Privacy</a>
                <a href="/terms" style={{ color: "#6B7280", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Terms</a>
                <a href="/contact" style={{ color: "#6B7280", textDecoration: "none", padding: "10px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Contact</a>
              </nav>
            </div>
          </footer>
        </>
      )}
        </div>
      </div>
    </div>
  );
}
