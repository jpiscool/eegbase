"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SimulatorAdapter } from "@/lib/device/simulator";
import { MendiAdapter } from "@/lib/device/mendi";
import { MuseAdapter } from "@/lib/device/muse";
import type { DeviceAdapter, DeviceSample } from "@/lib/device/adapter";
import { LiveChart } from "@/components/LiveChart";
import { saveSession, type SamplePayload, type Questionnaire } from "@/app/sessions/actions";
import Link from "next/link";
import { ArrowLeft, Wifi, WifiOff, StopCircle, CheckCircle, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { RewardGauge } from "@/components/RewardGauge";
import { GameFeedback } from "@/components/GameFeedback";
import { BrainMapPanel } from "@/components/BrainMapPanel";
import { HRVPanel } from "@/components/HRVPanel";
import { VideoFeedback } from "@/components/VideoFeedback";
import { FractalFeedback } from "@/components/FractalFeedback";
import { AnnotationPanel, type Annotation } from "@/components/AnnotationPanel";

function createAdapter(deviceType: string, params?: unknown): DeviceAdapter {
  if (deviceType === "mendi") return new MendiAdapter();
  if (deviceType === "muse") return new MuseAdapter();
  const simParams = params && typeof params === "object" ? (params as Record<string, unknown>) : {};
  return new SimulatorAdapter({
    noiseLevel: typeof simParams.noiseLevel === "number" ? simParams.noiseLevel : 0.3,
    trendStrength: typeof simParams.trendStrength === "number" ? simParams.trendStrength : 0.5,
  });
}

const MAX_POINTS = 600; // 60 seconds at 10 Hz (Mendi/Simulator sample rate)

interface Client { id: string; name: string }
interface Protocol { id: string; name: string; deviceType: string; durationSeconds: number; parameters?: unknown }

interface Props {
  clients: Client[];
  protocols: Protocol[];
  defaultClientId?: string;
  defaultProtocolId?: string;
}

type Phase = "pre" | "running" | "post";

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

const FIELDS: { key: keyof Questionnaire; label: string; desc: string }[] = [
  { key: "focus", label: "Focus", desc: "How focused do you feel?" },
  { key: "mood", label: "Mood", desc: "How would you rate your mood?" },
  { key: "anxiety", label: "Anxiety", desc: "How anxious do you feel? (1 = very calm)" },
  { key: "energy", label: "Energy", desc: "How energised do you feel?" },
];

function defaultQ(): Questionnaire {
  return { focus: 5, mood: 5, anxiety: 5, energy: 5 };
}

function ScaleInput({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{desc}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs w-3 text-right" style={{ color: "var(--text-tertiary)" }}>1</span>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs w-3" style={{ color: "var(--text-tertiary)" }}>10</span>
        <span className="w-8 text-center text-sm font-bold tabular-nums" style={{ color: "var(--brand)" }}>{value}</span>
      </div>
    </div>
  );
}

function QuestionnairePanel({
  title,
  subtitle,
  values,
  onChange,
  notes,
  onNotesChange,
  showNotes,
  onSubmit,
  submitLabel,
  submitDisabled,
}: {
  title: string;
  subtitle: string;
  values: Questionnaire;
  onChange: (q: Questionnaire) => void;
  notes?: string;
  onNotesChange?: (s: string) => void;
  showNotes?: boolean;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
}) {
  return (
    <div className="rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
      </div>
      <div className="space-y-4 mb-5">
        {FIELDS.map(({ key, label, desc }) => (
          <ScaleInput
            key={key}
            label={label}
            desc={desc}
            value={values[key]}
            onChange={(v) => onChange({ ...values, [key]: v })}
          />
        ))}
        {showNotes && onNotesChange && (
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Session notes <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder="Any observations about the session…"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-primary)" }}
            />
          </div>
        )}
      </div>
      <button
        onClick={onSubmit}
        disabled={submitDisabled}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "var(--brand)", color: "#fff" }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

// ── Audio feedback ───────────────────────────────────────────────────────────
// Plays a short sine-wave blip when the reward score is above threshold.
// Volume scales proportionally between threshold and 100.
function useAudioFeedback(score: number | null, threshold: number, enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || score == null || score < threshold) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    function playBlip() {
      if (!enabled || score == null || score < threshold) return;
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      // Pitch rises gently with score (400–800 Hz range)
      osc.frequency.value = 400 + ((score - threshold) / (100 - threshold)) * 400;
      osc.type = "sine";
      const vol = 0.08 + ((score - threshold) / (100 - threshold)) * 0.12;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }

    // Rate of blips increases with score: 4s interval at threshold, 1.5s at 100
    const interval = Math.max(1500, 4000 - ((score - threshold) / (100 - threshold)) * 2500);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(playBlip, interval);
    playBlip(); // immediate first blip

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, threshold, enabled]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctxRef.current?.close();
    };
  }, []);
}

export function LiveSessionView({ clients, protocols, defaultClientId, defaultProtocolId }: Props) {
  const router = useRouter();
  const adapterRef = useRef<DeviceAdapter | null>(null);
  const deviceTypeRef = useRef<string>("simulator");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<string>("");
  const allSamplesRef = useRef<SamplePayload[]>([]);

  const [phase, setPhase] = useState<Phase>("pre");
  const [elapsed, setElapsed] = useState(0);
  const [sample, setSample] = useState<DeviceSample | null>(null);
  const [saving, setSaving] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState(
    defaultClientId && clients.some((c) => c.id === defaultClientId)
      ? defaultClientId
      : clients[0]?.id ?? ""
  );
  const [selectedProtocolId, setSelectedProtocolId] = useState(
    defaultProtocolId && protocols.some((p) => p.id === defaultProtocolId)
      ? defaultProtocolId
      : protocols[0]?.id ?? ""
  );

  const [preQ, setPreQ] = useState<Questionnaire>(defaultQ());
  const [postQ, setPostQ] = useState<Questionnaire>(defaultQ());
  const [postNotes, setPostNotes] = useState("");
  const [liveNotes, setLiveNotes] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"charts" | "game" | "video" | "art">("charts");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // ── Clinician Controls ───────────────────────────────────────────────────────
  const [controlsOpen, setControlsOpen] = useState(true);
  const [liveThreshold, setLiveThreshold] = useState<number | null>(null);
  const [alertSensitivity, setAlertSensitivity] = useState<"off" | "gentle" | "strict">("gentle");
  const [focusBand, setFocusBand] = useState<"auto" | "theta" | "alpha" | "beta">("auto");

  // ── Low-reward alert tracking ────────────────────────────────────────────────
  // Count consecutive below-threshold samples and show warning after 20 seconds (200 samples at 10Hz)
  const belowThresholdCountRef = useRef(0);
  const alertSensitivityRef = useRef<"off" | "gentle" | "strict">("gentle");
  useEffect(() => { alertSensitivityRef.current = alertSensitivity; }, [alertSensitivity]);
  const [showLowRewardAlert, setShowLowRewardAlert] = useState(false);

  const reward = useSlidingWindow(MAX_POINTS);
  const oxyL = useSlidingWindow(MAX_POINTS);
  const oxyR = useSlidingWindow(MAX_POINTS);
  const deoxyL = useSlidingWindow(MAX_POINTS);
  const deoxyR = useSlidingWindow(MAX_POINTS);
  const theta = useSlidingWindow(MAX_POINTS);
  const alpha = useSlidingWindow(MAX_POINTS);
  const beta = useSlidingWindow(MAX_POINTS);

  const startStream = useCallback(async () => {
    reward.reset(); oxyL.reset(); oxyR.reset(); deoxyL.reset(); deoxyR.reset();
    theta.reset(); alpha.reset(); beta.reset();
    setElapsed(0); setSample(null);
    allSamplesRef.current = [];
    startedAtRef.current = new Date().toISOString();

    const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId);
    const deviceType = selectedProtocol?.deviceType ?? "simulator";
    deviceTypeRef.current = deviceType;

    const adapter = createAdapter(deviceType, selectedProtocol?.parameters);
    adapterRef.current = adapter;

    adapter.onSample((s) => {
      setSample(s);
      // Track consecutive below-threshold samples for alert
      const threshold = (() => {
        const prot = protocols.find((x) => x.id === selectedProtocolId);
        if (!prot?.parameters) return 50;
        const params = prot.parameters as Record<string, unknown>;
        return typeof params.rewardThreshold === "number" ? params.rewardThreshold * 100 : 50;
      })();
      if (s.rewardScore != null) {
        if (s.rewardScore < threshold) {
          belowThresholdCountRef.current += 1;
          const sensitivityLimit =
            alertSensitivityRef.current === "off" ? Infinity
            : alertSensitivityRef.current === "strict" ? 100
            : 300; // gentle = 30s at 10Hz
          if (belowThresholdCountRef.current >= sensitivityLimit) setShowLowRewardAlert(true);
        } else {
          belowThresholdCountRef.current = 0;
          setShowLowRewardAlert(false);
        }
      }
      const p: SamplePayload = {
        timestampMs: s.timestampMs,
        oxyHbLeft: s.oxyHbLeft,
        oxyHbRight: s.oxyHbRight,
        deoxyHbLeft: s.deoxyHbLeft,
        deoxyHbRight: s.deoxyHbRight,
        delta: s.delta,
        theta: s.theta,
        alpha: s.alpha,
        beta: s.beta,
        gamma: s.gamma,
        rewardScore: s.rewardScore,
        heartRate: s.heartRate,
        hrvRmssd: s.hrvRmssd,
      };
      allSamplesRef.current.push(p);
      if (s.rewardScore != null) reward.push(s.rewardScore / 100);
      if (s.oxyHbLeft != null) oxyL.push(s.oxyHbLeft);
      if (s.oxyHbRight != null) oxyR.push(s.oxyHbRight);
      if (s.deoxyHbLeft != null) deoxyL.push(s.deoxyHbLeft);
      if (s.deoxyHbRight != null) deoxyR.push(s.deoxyHbRight);
      if (s.theta != null) theta.push(s.theta);
      if (s.alpha != null) alpha.push(s.alpha);
      if (s.beta != null) beta.push(s.beta);
    });

    try {
      await adapter.connect();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Failed to connect to device.");
      adapterRef.current = null;
      return;
    }
    setConnectError(null);
    setPhase("running");
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProtocolId]);

  const stopStream = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await adapterRef.current?.disconnect();
    adapterRef.current = null;
    setPhase("post");
  }, []);

  const elapsedRef = useRef(0);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  const handleSave = useCallback(async () => {
    if (!selectedClientId) return;
    setSaving(true);
    try {
      const sessionId = await saveSession({
        clientId: selectedClientId,
        protocolId: selectedProtocolId || null,
        deviceType: deviceTypeRef.current,
        startedAt: startedAtRef.current,
        durationSeconds: elapsedRef.current,
        samples: allSamplesRef.current,
        preSession: preQ,
        postSession: { ...postQ, notes: postNotes || undefined },
        clinicalNotes: liveNotes.trim() || undefined,
      });
      router.push(`/sessions/${sessionId}`);
    } finally {
      setSaving(false);
    }
  }, [selectedClientId, selectedProtocolId, preQ, postQ, postNotes, liveNotes, router]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    adapterRef.current?.disconnect();
  }, []);

  const rewardVal = sample?.rewardScore ?? null;
  // Derive threshold from selected protocol params (default 50)
  const protocolThreshold = (() => {
    const p = protocols.find((x) => x.id === selectedProtocolId);
    if (!p?.parameters) return 50;
    const params = p.parameters as Record<string, unknown>;
    return typeof params.rewardThreshold === "number"
      ? params.rewardThreshold * 100  // protocol stores 0-1, convert to 0-100
      : 50;
  })();
  const effectiveThreshold = liveThreshold ?? protocolThreshold;
  useAudioFeedback(rewardVal, effectiveThreshold, audioEnabled && phase === "running");

  const rewardColor =
    rewardVal == null ? "var(--border-default)"
    : rewardVal >= 70 ? "var(--success)"
    : rewardVal >= 40 ? "var(--warning)"
    : "var(--danger)";

  const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId);
  const targetSeconds = selectedProtocol?.durationSeconds ?? 0;
  const progressPct = targetSeconds > 0 ? Math.min(100, (elapsed / targetSeconds) * 100) : 0;

  const noClients = clients.length === 0;
  const running = phase === "running";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/sessions"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Live Session</h1>
          <p className="text-sm capitalize" style={{ color: "var(--text-secondary)" }}>
            {protocols.find((p) => p.id === selectedProtocolId)?.deviceType ?? "simulator"} device
            {protocols.find((p) => p.id === selectedProtocolId)?.name
              ? ` · ${protocols.find((p) => p.id === selectedProtocolId)!.name}`
              : ""}
          </p>
        </div>
        {running && (
          <div className="flex items-center gap-3">
            {targetSeconds > 0 ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <Wifi size={13} className="animate-pulse" style={{ color: "var(--success)" }} />
                  <span className="text-sm font-mono font-medium tabular-nums" style={{ color: "var(--success)" }}>
                    {fmt(elapsed)} / {fmt(targetSeconds)}
                  </span>
                </div>
                <div className="w-36 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%`, background: "var(--success)" }}
                  />
                </div>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border" style={{ background: "var(--success-subtle)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 25%, transparent)" }}>
                <Wifi size={13} className="animate-pulse" />{fmt(elapsed)}
              </span>
            )}
            <button
              onClick={() => setAudioEnabled((v) => !v)}
              title={audioEnabled ? "Mute audio feedback" : "Enable audio feedback (plays when above threshold)"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors"
              style={audioEnabled
                ? { background: "var(--surface-sunken)", color: "var(--brand)", borderColor: "var(--border-subtle)" }
                : { background: "var(--surface-sunken)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}
            >
              {audioEnabled ? "🔊" : "🔇"} Audio
            </button>
            <button
              onClick={stopStream}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: "var(--danger-subtle)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}
            >
              <StopCircle size={15} /> Stop Session
            </button>
          </div>
        )}
        {phase === "pre" && (
          <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border" style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>
            <WifiOff size={13} /> Idle
          </span>
        )}
      </div>

      {/* Client / Protocol selectors */}
      <div className="rounded-xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Client
          </label>
          {noClients ? (
            <p className="text-sm" style={{ color: "var(--warning)" }}>
              No clients yet.{" "}
              <Link href="/clients" className="underline">Add one first.</Link>
            </p>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={phase !== "pre"}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-primary)" }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Protocol <span className="font-normal normal-case" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
          </label>
          <select
            value={selectedProtocolId}
            onChange={(e) => setSelectedProtocolId(e.target.value)}
            disabled={phase !== "pre"}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-primary)" }}
          >
            <option value="">— None —</option>
            {protocols.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Connect error */}
      {connectError && (
        <div className="text-sm px-4 py-3 rounded-xl mb-5" style={{ background: "var(--danger-subtle)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
          <span className="font-semibold">Device error:</span> {connectError}
        </div>
      )}

      {/* PRE-SESSION questionnaire */}
      {phase === "pre" && (
        <QuestionnairePanel
          title="Pre-Session Check-In"
          subtitle="Rate how you feel before the session starts (1 = low · 10 = high)"
          values={preQ}
          onChange={setPreQ}
          onSubmit={startStream}
          submitLabel={noClients ? "Add a client to begin" : "▶ Start Session"}
          submitDisabled={noClients}
        />
      )}

      {/* POST-SESSION questionnaire */}
      {phase === "post" && (
        <QuestionnairePanel
          title="Post-Session Check-In"
          subtitle="How did you feel during and after the session?"
          values={postQ}
          onChange={setPostQ}
          notes={postNotes}
          onNotesChange={setPostNotes}
          showNotes
          onSubmit={handleSave}
          submitLabel={saving ? "Saving…" : "Save Session"}
          submitDisabled={saving}
        />
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl mb-5" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)", border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)" }}>
          <CheckCircle size={16} className="animate-pulse" />
          Saving session…
        </div>
      )}

      {/* Low reward alert banner */}
      {running && showLowRewardAlert && (
        <div className="flex items-center gap-3 text-sm px-4 py-3 rounded-xl mb-4 animate-pulse" style={{ background: "var(--warning-subtle)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}>
          <span className="text-base">⚠</span>
          <div className="flex-1">
            <span className="font-semibold">Reward score below threshold for 20+ seconds.</span>
            {" "}Consider pausing to check client comfort, adjusting the session difficulty, or prompting a brief reset breath.
          </div>
          <button
            onClick={() => { belowThresholdCountRef.current = 0; setShowLowRewardAlert(false); }}
            className="text-xs font-medium shrink-0"
            style={{ color: "var(--warning)" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Clinician Controls Panel ─────────────────────────────────────────── */}
      {running && (
        <div className="rounded-xl border mb-4 overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <button
            onClick={() => setControlsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-3 transition-colors"
            style={{ background: "var(--surface-sunken)" }}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={13} style={{ color: "var(--brand)" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Clinician Controls
              </span>
            </div>
            {controlsOpen
              ? <ChevronUp size={14} style={{ color: "var(--text-tertiary)" }} />
              : <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
            }
          </button>

          {controlsOpen && (
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Reward threshold */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Reward Threshold
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={10} max={80}
                    value={liveThreshold ?? protocolThreshold}
                    onChange={(e) => setLiveThreshold(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ color: "var(--brand)" }}>
                    {Math.round(liveThreshold ?? protocolThreshold)}
                  </span>
                </div>
                {liveThreshold !== null && (
                  <button onClick={() => setLiveThreshold(null)} className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Reset to protocol default
                  </button>
                )}
              </div>

              {/* Alert sensitivity */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Alert Sensitivity
                </p>
                <div className="flex gap-1.5">
                  {(["off", "gentle", "strict"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setAlertSensitivity(s)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
                      style={alertSensitivity === s
                        ? { background: "var(--brand)", color: "var(--text-inverse)" }
                        : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick annotation stamps */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Quick Stamp
                </p>
                <div className="flex flex-col gap-1.5">
                  {(["Eyes Open", "Distracted", "Breakthrough"] as const).map((stamp) => (
                    <button
                      key={stamp}
                      onClick={() => setAnnotations((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), timestampMs: elapsed * 1000, label: stamp, category: "observation" as const },
                      ])}
                      className="py-1 px-2.5 rounded-lg text-xs font-medium text-left transition-colors"
                      style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
                    >
                      + {stamp}
                    </button>
                  ))}
                </div>
              </div>

              {/* EEG band focus */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  EEG Focus Band
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["auto", "theta", "alpha", "beta"] as const).map((band) => (
                    <button
                      key={band}
                      onClick={() => setFocusBand(band)}
                      className="py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
                      style={focusBand === band
                        ? { background: "var(--brand)", color: "var(--text-inverse)" }
                        : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
                      }
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mid-session protocol switch */}
              {protocols.length > 1 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Switch Protocol
                  </p>
                  <select
                    value={selectedProtocolId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      if (newId === selectedProtocolId) return;
                      const newName = protocols.find((p) => p.id === newId)?.name ?? "Unknown";
                      setSelectedProtocolId(newId);
                      setAnnotations((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          timestampMs: elapsed * 1000,
                          label: `Protocol → ${newName}`,
                          category: "protocol" as const,
                        },
                      ]);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-xs border focus:outline-none"
                    style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  >
                    {protocols.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Logs a protocol-change annotation
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live data */}
      {(running || phase === "post") && (
        <>
          {/* View mode tabs */}
          <div className="flex items-center gap-1 rounded-xl p-1 mb-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            {(["charts", "game", "video", "art"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors"
                style={viewMode === mode
                  ? { background: "var(--brand)", color: "#fff" }
                  : { color: "var(--text-secondary)" }}
              >
                {mode === "charts" ? "📊 Charts" : mode === "game" ? "🎮 Game" : mode === "video" ? "🎬 Video" : "🌀 Art"}
              </button>
            ))}
          </div>

          {viewMode === "game" ? (
            <div className="rounded-xl p-8 mb-5 flex flex-col items-center" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <GameFeedback score={rewardVal} threshold={protocolThreshold} />
            </div>
          ) : viewMode === "video" ? (
            <div className="rounded-xl p-6 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <VideoFeedback score={rewardVal} threshold={protocolThreshold} />
            </div>
          ) : viewMode === "art" ? (
            <div className="rounded-xl p-4 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <FractalFeedback
                alpha={sample?.alpha ?? null}
                theta={sample?.theta ?? null}
                beta={sample?.beta ?? null}
                score={rewardVal}
              />
            </div>
          ) : (
            <>
              <div className="rounded-xl p-6 mb-5 flex items-center gap-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                <div className="shrink-0">
                  <RewardGauge score={rewardVal ?? null} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Reward Score · Last 60s
                  </p>
                  <LiveChart data={reward.data} color="#2563EB" label="" height={100} />
                </div>
              </div>

              {/* Bilateral asymmetry indicator */}
              {sample?.oxyHbLeft != null && sample?.oxyHbRight != null && (
                <div className="rounded-xl px-5 py-4 mb-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                    fNIRS Bilateral Asymmetry · OxyHb
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-8 text-right" style={{ color: "var(--text-secondary)" }}>L</span>
                    <div className="flex-1 relative h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                      {(() => {
                        const l = sample.oxyHbLeft!;
                        const r = sample.oxyHbRight!;
                        const diff = l - r;
                        const maxAbs = Math.max(Math.abs(l), Math.abs(r), 0.001);
                        const asymPct = Math.min(100, (Math.abs(diff) / maxAbs) * 100);
                        const leftDominant = diff > 0;
                        return (
                          <div
                            className={`absolute h-full rounded-full ${leftDominant ? "right-1/2" : "left-1/2"}`}
                            style={{ width: `${asymPct / 2}%`, background: leftDominant ? "var(--success)" : "var(--brand)" }}
                          />
                        );
                      })()}
                      <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: "var(--border-default)" }} />
                    </div>
                    <span className="text-xs w-8" style={{ color: "var(--text-secondary)" }}>R</span>
                    <span className="text-xs w-24 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                      {sample.oxyHbLeft! >= sample.oxyHbRight! ? "L dominant" : "R dominant"}
                      {" · "}
                      {Math.abs(sample.oxyHbLeft! - sample.oxyHbRight!).toFixed(4)} μM
                    </span>
                  </div>
                </div>
              )}

              {/* Real-time brain activity map */}
              {(sample?.oxyHbLeft != null || sample?.alpha != null) && (
                <div className="mb-4">
                  <BrainMapPanel
                    oxyHbLeft={sample?.oxyHbLeft ?? null}
                    oxyHbRight={sample?.oxyHbRight ?? null}
                    deoxyHbLeft={sample?.deoxyHbLeft ?? null}
                    deoxyHbRight={sample?.deoxyHbRight ?? null}
                    alpha={sample?.alpha ?? null}
                    theta={sample?.theta ?? null}
                    beta={sample?.beta ?? null}
                    title="Brain Activity Map · Live"
                  />
                </div>
              )}

              {/* HRV panel */}
              {sample?.heartRate != null && (
                <div className="mb-4">
                  <HRVPanel heartRate={sample.heartRate ?? null} rmssd={sample.hrvRmssd ?? null} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                  <LiveChart data={oxyL.data} color="#10B981" label="OxyHb Left · prefrontal (μM)" height={84} />
                </div>
                <div className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                  <LiveChart data={oxyR.data} color="#0EA5E9" label="OxyHb Right · prefrontal (μM)" height={84} />
                </div>
                <div className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                  <LiveChart data={deoxyL.data} color="#6366F1" label="DeoxyHb Left (μM)" height={84} />
                </div>
                <div className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                  <LiveChart data={deoxyR.data} color="#8B5CF6" label="DeoxyHb Right (μM)" height={84} />
                </div>
                <div className="rounded-xl border p-5 transition-all" style={{ background: "var(--surface-raised)", borderColor: focusBand === "theta" ? "var(--brand)" : "var(--border-subtle)", boxShadow: focusBand === "theta" ? "0 4px 12px rgba(0,0,0,0.1)" : "none" }}>
                  <LiveChart data={theta.data} color="#F59E0B" label="Theta power" height={84} />
                </div>
                <div className="rounded-xl border p-5 transition-all" style={{ background: "var(--surface-raised)", borderColor: focusBand === "alpha" ? "var(--brand)" : "var(--border-subtle)", boxShadow: focusBand === "alpha" ? "0 4px 12px rgba(0,0,0,0.1)" : "none" }}>
                  <LiveChart data={alpha.data} color="#EF4444" label="Alpha power" height={84} />
                </div>
                <div className="rounded-xl border p-5 md:col-span-2 transition-all" style={{ background: "var(--surface-raised)", borderColor: focusBand === "beta" ? "var(--brand)" : "var(--border-subtle)", boxShadow: focusBand === "beta" ? "0 4px 12px rgba(0,0,0,0.1)" : "none" }}>
                  <LiveChart data={beta.data} color="#EC4899" label="Beta power" height={84} />
                </div>
              </div>
            </>
          )}

          {/* Live observation notes (clinician-only, visible during session) */}
          {running && (
            <div className="rounded-xl p-5 mb-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Clinical Observation Notes
              </label>
              <textarea
                value={liveNotes}
                onChange={(e) => setLiveNotes(e.target.value)}
                placeholder="Type real-time observations (e.g. 'client seems distracted at 5:00', 'technique shifted')…"
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-primary)" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Saved as clinical notes when you end the session.</p>
            </div>
          )}

          {/* Event Annotations panel */}
          {running && (
            <div className="mb-4">
              <AnnotationPanel
                elapsedMs={elapsed * 1000}
                annotations={annotations}
                onAdd={(ann) => setAnnotations((prev) => [...prev, { ...ann, id: crypto.randomUUID() }])}
                onRemove={(id) => setAnnotations((prev) => prev.filter((a): a is typeof a & { id: string } => a.id !== id))}
              />
            </div>
          )}

          <div className="rounded-xl px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            {[
              { label: "OxyHb L", val: sample?.oxyHbLeft, color: "#10B981" },
              { label: "OxyHb R", val: sample?.oxyHbRight, color: "#0EA5E9" },
              { label: "DeoxyHb L", val: sample?.deoxyHbLeft, color: "#6366F1" },
              { label: "DeoxyHb R", val: sample?.deoxyHbRight, color: "#EC4899" },
              { label: "Theta", val: sample?.theta, color: "#8B5CF6" },
              { label: "Alpha", val: sample?.alpha, color: "#F59E0B" },
              { label: "Beta", val: sample?.beta, color: "#EF4444" },
              { label: "Elapsed", val: null, elapsed: fmt(elapsed), color: "var(--text-secondary)" },
            ].map(({ label, val, elapsed: elapsedFmt, color }) => (
              <div key={label}>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                <p className="font-semibold tabular-nums" style={{ color }}>
                  {elapsedFmt ?? (val != null ? val.toFixed(3) : "—")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
