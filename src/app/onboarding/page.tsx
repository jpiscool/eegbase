"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Check, ChevronRight, ChevronLeft, Brain, Activity, Cpu } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "Admin" | "Clinician";
type Device = "muse" | "mendi" | "simulator" | null;

interface TeamMember {
  id: number;
  email: string;
  role: Role;
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded-full transition-all duration-300"
          style={{
            background: i < current ? "var(--brand)" : "var(--surface-sunken)",
          }}
        />
      ))}
    </div>
  );
}

// ── Confetti dots (CSS animated) ──────────────────────────────────────────────

const CONFETTI_COLORS = [
  "var(--brand)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--brand-hover)",
];

function Confetti() {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 90 + 5}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${1.2 + Math.random() * 1}s`,
    size: `${6 + Math.floor(Math.random() * 8)}px`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  return (
    <div
      className="relative h-16 mb-6 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {dots.map((d) => (
        <div
          key={d.id}
          style={{
            position: "absolute",
            left: d.left,
            top: 0,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: d.color,
            animation: `confetti-fall ${d.duration} ${d.delay} ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({
  clinicName,
  tagline,
  onClinicName,
  onTagline,
}: {
  clinicName: string;
  tagline: string;
  onClinicName: (v: string) => void;
  onTagline: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--brand)" }}
        >
          <Brain size={28} style={{ color: "var(--text-inverse)" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Welcome to EEGBase!
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Let's get your clinic set up in just a few steps.
        </p>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--text-primary)" }}
        >
          Clinic Name <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          type="text"
          value={clinicName}
          onChange={(e) => onClinicName(e.target.value)}
          placeholder="e.g. NeuroWell Clinic"
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--text-primary)" }}
        >
          Tagline{" "}
          <span className="text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>
            (optional)
          </span>
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => onTagline(e.target.value)}
          placeholder="e.g. Evidence-based neurofeedback for wellbeing"
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
}

// ── Step 2: Invite Team ───────────────────────────────────────────────────────

function StepInvite({
  members,
  onAdd,
  onRemove,
  onEmailChange,
  onRoleChange,
}: {
  members: TeamMember[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onEmailChange: (id: number, email: string) => void;
  onRoleChange: (id: number, role: Role) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Invite Your Team
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Add your team members now, or skip and invite them later from Settings.
        </p>
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <input
              type="email"
              value={m.email}
              onChange={(e) => onEmailChange(m.id, e.target.value)}
              placeholder="colleague@clinic.com"
              className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
              style={{
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
            <select
              value={m.role}
              onChange={(e) => onRoleChange(m.id, e.target.value as Role)}
              className="px-2 py-2 text-sm rounded-lg outline-none"
              style={{
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              <option>Admin</option>
              <option>Clinician</option>
            </select>
            <button
              onClick={() => onRemove(m.id)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Remove member"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: "var(--brand)" }}
      >
        <Plus size={14} />
        Add another member
      </button>
    </div>
  );
}

// ── Step 3: Connect Device ────────────────────────────────────────────────────

const DEVICES = [
  {
    id: "muse" as Device,
    name: "Muse EEG",
    icon: Brain,
    description: "5-sensor brainwave headband over Bluetooth. Tracks the 5 standard brainwaves linked to focus, calm, sleep, and more.",
    badge: "EEG",
    badgeColor: "var(--brand)",
    badgeBg: "var(--brand-subtle)",
  },
  {
    id: "mendi" as Device,
    name: "Mendi fNIRS",
    icon: Activity,
    description: "Forehead headband that measures brain blood flow in real time — a marker of focus and brain activity.",
    badge: "fNIRS",
    badgeColor: "var(--success)",
    badgeBg: "var(--success-subtle)",
  },
  {
    id: "simulator" as Device,
    name: "Simulator",
    icon: Cpu,
    description: "Generate realistic synthetic sessions for onboarding, demos, and protocol testing. No hardware needed.",
    badge: "Demo",
    badgeColor: "var(--text-tertiary)",
    badgeBg: "var(--surface-sunken)",
  },
];

function StepDevice({
  selected,
  onSelect,
}: {
  selected: Device;
  onSelect: (d: Device) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Connect Your First Device
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Choose the neurofeedback device your clinic uses.
        </p>
      </div>

      {DEVICES.map((dev) => {
        const Icon = dev.icon;
        const isSelected = selected === dev.id;
        return (
          <button
            key={dev.id}
            onClick={() => onSelect(dev.id)}
            className="w-full text-left rounded-xl border p-4 flex items-start gap-4 transition-all"
            style={{
              background: isSelected ? "var(--brand-subtle)" : "var(--surface-sunken)",
              borderColor: isSelected ? "var(--brand)" : "var(--border-subtle)",
              outline: "none",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: isSelected ? "var(--brand)" : "var(--surface-raised)" }}
            >
              <Icon size={18} style={{ color: isSelected ? "var(--text-inverse)" : "var(--text-secondary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {dev.name}
                </span>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: dev.badgeBg, color: dev.badgeColor }}
                >
                  {dev.badge}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {dev.description}
              </p>
            </div>
            {isSelected && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--brand)" }}
              >
                <Check size={12} style={{ color: "var(--text-inverse)" }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Step 3.5: Mendi Integration Status (shown only when mendi selected) ───────

function StepMendiSetup({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* Mendi purple dot */}
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: "#7C3AED" }}
            aria-hidden="true"
          />
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Mendi Integration Status
          </h2>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Your adapter is built and ready — we just need 2 things from Mendi to go live:
        </p>
      </div>

      {/* Requirements list */}
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          background: "var(--surface-sunken)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {[
          {
            label: "BLE Service UUID",
            detail: "The Bluetooth Low Energy service identifier for the Mendi headband.",
          },
          {
            label: "GATT Characteristic UUID",
            detail: "The characteristic used to stream fNIRS oxygenation data in real time.",
          },
          {
            label: "JavaScript SDK",
            detail: "Optional — if Mendi provides a web SDK, we can wrap it directly.",
            optional: true,
          },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: item.optional ? "var(--surface-raised)" : "#EDE9FE",
                border: item.optional ? "1.5px dashed var(--border-default)" : "none",
              }}
            >
              {!item.optional && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#7C3AED" }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {item.label}
                </span>
                {item.optional && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "var(--surface-raised)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Optional
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Simulator note */}
      <div
        className="rounded-xl border p-4"
        style={{
          background: "var(--surface-sunken)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Note: </span>
          In simulator mode, all sessions run with realistic synthetic fNIRS data that matches
          the Mendi signal format exactly. You can run full sessions, review bilateral oxygenation
          charts, and test protocols — all without hardware.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: "#7C3AED",
          color: "#FFFFFF",
          boxShadow: "0 2px 12px rgba(124, 58, 237, 0.28)",
        }}
      >
        Continue with Simulator
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ── Step 4: First Client ──────────────────────────────────────────────────────

function StepClient({
  name,
  email,
  dob,
  onName,
  onEmail,
  onDob,
}: {
  name: string;
  email: string;
  dob: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onDob: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Add Your First Client
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Add a client profile to start logging sessions.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="e.g. Sarah Mitchell"
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          placeholder="client@example.com"
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
          Date of Birth
        </label>
        <input
          type="date"
          value={dob}
          onChange={(e) => onDob(e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
}

// ── Step 5: Done ──────────────────────────────────────────────────────────────

function StepDone({
  clinicName,
  invitedCount,
  device,
  hasClient,
}: {
  clinicName: string;
  invitedCount: number;
  device: Device;
  hasClient: boolean;
}) {
  const deviceLabel =
    device === "muse" ? "Muse EEG" : device === "mendi" ? "Mendi fNIRS" : device === "simulator" ? "Simulator" : null;

  const checklist = [
    { done: !!clinicName, label: clinicName ? `Clinic created: "${clinicName}"` : "Clinic name" },
    { done: invitedCount > 0, label: invitedCount > 0 ? `${invitedCount} team member${invitedCount > 1 ? "s" : ""} invited` : "Team invites (skipped)" },
    { done: !!device, label: deviceLabel ? `Device selected: ${deviceLabel}` : "Device (skipped)" },
    { done: hasClient, label: hasClient ? "First client added" : "First client (skipped)" },
  ];

  return (
    <div className="space-y-6">
      <Confetti />

      <div className="text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          You're all set!
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Your clinic is ready. Here's a summary of what was configured.
        </p>
      </div>

      <div
        className="rounded-xl border divide-y overflow-hidden"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {checklist.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={
                item.done
                  ? { background: "var(--success-subtle)" }
                  : { background: "var(--surface-sunken)" }
              }
            >
              {item.done ? (
                <Check size={12} style={{ color: "var(--success)" }} />
              ) : (
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>–</span>
              )}
            </div>
            <span
              className="text-sm"
              style={{ color: item.done ? "var(--text-primary)" : "var(--text-tertiary)" }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mendi-specific message on the done screen */}
      {device === "mendi" && (
        <div
          className="rounded-xl border px-4 py-3 flex items-start gap-3"
          style={{
            background: "#F5F3FF",
            borderColor: "#DDD6FE",
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
            style={{ background: "#7C3AED" }}
            aria-hidden="true"
          />
          <p className="text-sm" style={{ color: "#4C1D95" }}>
            Your clinic is pre-configured for Mendi fNIRS with the frontal attention protocol.
          </p>
        </div>
      )}

      <Link
        href="/dashboard"
        className="flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: "var(--brand)",
          color: "var(--text-inverse)",
          boxShadow: "0 2px 12px color-mix(in srgb, var(--brand) 35%, transparent)",
        }}
      >
        Go to Dashboard
        <ChevronRight size={15} />
      </Link>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

// The logical wizard steps. When mendi is selected, an extra step (3.5) is
// inserted between device selection and first-client, making the total 6.
// We map "logical step" to rendered content below.
type LogicalStep = 1 | 2 | 3 | 3.5 | 4 | 5;

const BASE_STEPS = 5; // steps shown in progress bar for non-mendi paths

export default function OnboardingPage() {
  const [logicalStep, setLogicalStep] = useState<LogicalStep>(1);

  // Step 1
  const [clinicName, setClinicName] = useState("");
  const [tagline, setTagline] = useState("");

  // Step 2
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 1, email: "", role: "Clinician" },
  ]);
  const [nextMemberId, setNextMemberId] = useState(2);

  // Step 3
  const [device, setDevice] = useState<Device>(null);

  // Step 4
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDob, setClientDob] = useState("");

  // Derived: how many logical steps exist in the current flow
  const totalSteps = device === "mendi" ? BASE_STEPS + 1 : BASE_STEPS;

  // Map logical step to a progress-bar position (1-indexed visual step)
  function logicalToVisual(ls: LogicalStep): number {
    if (ls === 3.5) return 4; // the mendi card counts as step 4 visually
    if (ls > 3.5) return (ls as number) + 1; // shift steps 4 & 5 up by 1
    return ls as number;
  }
  const visualStep = logicalToVisual(logicalStep);

  const canNext =
    logicalStep === 1
      ? clinicName.trim().length > 0
      : true; // all other steps can proceed even empty

  function addMember() {
    setMembers((prev) => [...prev, { id: nextMemberId, email: "", role: "Clinician" }]);
    setNextMemberId((n) => n + 1);
  }

  function removeMember(id: number) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMemberEmail(id: number, email: string) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, email } : m)));
  }

  function updateMemberRole(id: number, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function goNext() {
    if (logicalStep === 3 && device === "mendi") {
      setLogicalStep(3.5);
    } else if (logicalStep === 3.5) {
      setLogicalStep(4);
    } else if (logicalStep === 1) setLogicalStep(2);
    else if (logicalStep === 2) setLogicalStep(3);
    else if (logicalStep === 3) setLogicalStep(4);
    else if (logicalStep === 4) setLogicalStep(5);
  }

  function goBack() {
    if (logicalStep === 3.5) {
      setLogicalStep(3);
    } else if (logicalStep === 4 && device === "mendi") {
      setLogicalStep(3.5);
    } else if (logicalStep === 2) setLogicalStep(1);
    else if (logicalStep === 3) setLogicalStep(2);
    else if (logicalStep === 4) setLogicalStep(3);
    else if (logicalStep === 5) setLogicalStep(4);
  }

  const invitedCount = members.filter((m) => m.email.trim().length > 0).length;

  const isDone = logicalStep === 5;
  const isMendiCard = logicalStep === 3.5;

  // Skip is available on steps 2, 3, and 4 (but not the mendi card — it has its own CTA)
  const showSkip =
    !isDone && !isMendiCard && (logicalStep === 2 || logicalStep === 3 || logicalStep === 4);

  // "Finish" label on the step before Done
  const nextLabel =
    logicalStep === 4 ? "Finish" : "Next";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--surface-base)" }}
    >
      <div
        className="w-full max-w-[600px] rounded-2xl border p-8"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Progress */}
        <ProgressBar current={visualStep} total={totalSteps} />

        {/* Step label */}
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-6"
          style={{ color: "var(--text-tertiary)" }}
        >
          Step {visualStep} of {totalSteps}
        </p>

        {/* Step content */}
        {logicalStep === 1 && (
          <StepWelcome
            clinicName={clinicName}
            tagline={tagline}
            onClinicName={setClinicName}
            onTagline={setTagline}
          />
        )}
        {logicalStep === 2 && (
          <StepInvite
            members={members}
            onAdd={addMember}
            onRemove={removeMember}
            onEmailChange={updateMemberEmail}
            onRoleChange={updateMemberRole}
          />
        )}
        {logicalStep === 3 && (
          <StepDevice
            selected={device}
            onSelect={setDevice}
          />
        )}
        {logicalStep === 3.5 && (
          <StepMendiSetup onContinue={() => setLogicalStep(4)} />
        )}
        {logicalStep === 4 && (
          <StepClient
            name={clientName}
            email={clientEmail}
            dob={clientDob}
            onName={setClientName}
            onEmail={setClientEmail}
            onDob={setClientDob}
          />
        )}
        {logicalStep === 5 && (
          <StepDone
            clinicName={clinicName}
            invitedCount={invitedCount}
            device={device}
            hasClient={clientName.trim().length > 0}
          />
        )}

        {/* Navigation — hidden on Done step and Mendi card (which has its own CTA) */}
        {!isDone && !isMendiCard && (
          <div className="mt-8 flex items-center justify-between gap-4">
            {/* Back */}
            <button
              onClick={goBack}
              disabled={logicalStep === 1}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: logicalStep === 1 ? "var(--text-tertiary)" : "var(--text-secondary)" }}
            >
              <ChevronLeft size={15} />
              Back
            </button>

            {/* Skip + Next */}
            <div className="flex items-center gap-3">
              {showSkip && (
                <button
                  onClick={goNext}
                  className="text-sm font-medium transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Skip for now
                </button>
              )}

              <button
                onClick={goNext}
                disabled={!canNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={
                  canNext
                    ? {
                        background: "var(--brand)",
                        color: "var(--text-inverse)",
                        boxShadow: "0 1px 4px color-mix(in srgb, var(--brand) 35%, transparent)",
                      }
                    : {
                        background: "var(--surface-sunken)",
                        color: "var(--text-tertiary)",
                        cursor: "not-allowed",
                      }
                }
              >
                {nextLabel}
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Back button only, shown on the Mendi card so user can go back to device selection */}
        {isMendiCard && (
          <div className="mt-6">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={15} />
              Back to device selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
