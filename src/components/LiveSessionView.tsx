"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SimulatorAdapter } from "@/lib/device/simulator";
import { MendiAdapter } from "@/lib/device/mendi";
import type { DeviceAdapter, DeviceSample } from "@/lib/device/adapter";
import { LiveChart } from "@/components/LiveChart";
import { saveSession, type SamplePayload, type Questionnaire } from "@/app/sessions/actions";
import Link from "next/link";
import { ArrowLeft, Wifi, WifiOff, StopCircle, CheckCircle } from "lucide-react";

function createAdapter(deviceType: string, params?: unknown): DeviceAdapter {
  if (deviceType === "mendi") return new MendiAdapter();
  const simParams = params && typeof params === "object" ? (params as Record<string, unknown>) : {};
  return new SimulatorAdapter({
    noiseLevel: typeof simParams.noiseLevel === "number" ? simParams.noiseLevel : 0.3,
    trendStrength: typeof simParams.trendStrength === "number" ? simParams.trendStrength : 0.5,
  });
}

const MAX_POINTS = 60;

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
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{desc}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 w-3 text-right">1</span>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs text-gray-400 w-3">10</span>
        <span className="w-8 text-center text-sm font-bold text-blue-600 tabular-nums">{value}</span>
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Session notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder="Any observations about the session…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}
      </div>
      <button
        onClick={onSubmit}
        disabled={submitDisabled}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
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
      });
      router.push(`/sessions/${sessionId}`);
    } finally {
      setSaving(false);
    }
  }, [selectedClientId, selectedProtocolId, preQ, postQ, postNotes, router]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    adapterRef.current?.disconnect();
  }, []);

  const rewardVal = sample?.rewardScore;
  const rewardColor =
    rewardVal == null ? "text-gray-300"
    : rewardVal >= 70 ? "text-emerald-500"
    : rewardVal >= 40 ? "text-amber-500"
    : "text-red-500";

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
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Live Session</h1>
          <p className="text-sm text-gray-500 capitalize">
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
                  <Wifi size={13} className="animate-pulse text-emerald-600" />
                  <span className="text-sm font-mono font-medium text-emerald-700 tabular-nums">
                    {fmt(elapsed)} / {fmt(targetSeconds)}
                  </span>
                </div>
                <div className="w-36 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                <Wifi size={13} className="animate-pulse" />{fmt(elapsed)}
              </span>
            )}
            <button
              onClick={stopStream}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <StopCircle size={15} /> Stop Session
            </button>
          </div>
        )}
        {phase === "pre" && (
          <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
            <WifiOff size={13} /> Idle
          </span>
        )}
      </div>

      {/* Client / Protocol selectors */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Client
          </label>
          {noClients ? (
            <p className="text-sm text-amber-600">
              No clients yet.{" "}
              <Link href="/clients" className="underline">Add one first.</Link>
            </p>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={phase !== "pre"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Protocol <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <select
            value={selectedProtocolId}
            onChange={(e) => setSelectedProtocolId(e.target.value)}
            disabled={phase !== "pre"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
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
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-3 rounded-xl mb-5">
          <CheckCircle size={16} className="animate-pulse" />
          Saving session…
        </div>
      )}

      {/* Live data */}
      {(running || phase === "post") && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5 flex items-center gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Reward Score
              </p>
              <p className={`text-6xl font-bold tabular-nums leading-none ${rewardColor}`}>
                {rewardVal != null ? rewardVal.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">out of 100</p>
            </div>
            <div className="flex-1">
              <LiveChart data={reward.data} color="#2563EB" label="Reward score · last 60s" height={76} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LiveChart data={oxyL.data} color="#10B981" label="OxyHb Left · prefrontal (μM)" height={84} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LiveChart data={oxyR.data} color="#0EA5E9" label="OxyHb Right · prefrontal (μM)" height={84} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LiveChart data={deoxyL.data} color="#6366F1" label="DeoxyHb Left (μM)" height={84} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LiveChart data={deoxyR.data} color="#8B5CF6" label="DeoxyHb Right (μM)" height={84} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LiveChart data={theta.data} color="#F59E0B" label="Theta power" height={84} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <LiveChart data={alpha.data} color="#EF4444" label="Alpha power" height={84} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
              <LiveChart data={beta.data} color="#EC4899" label="Beta power" height={84} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            {[
              { label: "OxyHb L", val: sample?.oxyHbLeft, color: "#10B981" },
              { label: "OxyHb R", val: sample?.oxyHbRight, color: "#0EA5E9" },
              { label: "DeoxyHb L", val: sample?.deoxyHbLeft, color: "#6366F1" },
              { label: "DeoxyHb R", val: sample?.deoxyHbRight, color: "#EC4899" },
              { label: "Theta", val: sample?.theta, color: "#8B5CF6" },
              { label: "Alpha", val: sample?.alpha, color: "#F59E0B" },
              { label: "Beta", val: sample?.beta, color: "#EF4444" },
              { label: "Elapsed", val: null, elapsed: fmt(elapsed), color: "#64748B" },
            ].map(({ label, val, elapsed: elapsedFmt, color }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
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
