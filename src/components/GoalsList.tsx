"use client";

import { useState, useTransition } from "react";
import { Plus, Target, CheckCircle2, Clock, PauseCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { createGoal, updateGoalStatus, deleteGoal } from "@/app/clients/[id]/goals/actions";

type GoalStatus = "active" | "achieved" | "paused" | "cancelled";

interface Goal {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  completedAt: Date | null;
  status: string;
  createdAt: Date;
}

const STATUS_CONFIG: Record<GoalStatus, {
  icon: React.ElementType;
  label: string;
  iconStyle: React.CSSProperties;
  cardStyle: React.CSSProperties;
  badgeStyle: React.CSSProperties;
}> = {
  active: {
    icon: Clock,
    label: "Active",
    iconStyle: { color: "var(--brand)" },
    cardStyle: { background: "color-mix(in srgb, var(--brand) 6%, transparent)", borderColor: "color-mix(in srgb, var(--brand) 18%, transparent)" },
    badgeStyle: { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)", borderColor: "color-mix(in srgb, var(--brand) 20%, transparent)" },
  },
  achieved: {
    icon: CheckCircle2,
    label: "Achieved",
    iconStyle: { color: "var(--success)" },
    cardStyle: { background: "var(--success-subtle)", borderColor: "color-mix(in srgb, var(--success) 20%, transparent)" },
    badgeStyle: { background: "var(--success-subtle)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 20%, transparent)" },
  },
  paused: {
    icon: PauseCircle,
    label: "Paused",
    iconStyle: { color: "var(--warning)" },
    cardStyle: { background: "var(--warning-subtle)", borderColor: "color-mix(in srgb, var(--warning) 20%, transparent)" },
    badgeStyle: { background: "var(--warning-subtle)", color: "var(--warning)", borderColor: "color-mix(in srgb, var(--warning) 20%, transparent)" },
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    iconStyle: { color: "var(--text-tertiary)" },
    cardStyle: { background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" },
    badgeStyle: { background: "var(--surface-sunken)", color: "var(--text-tertiary)", borderColor: "var(--border-subtle)" },
  },
};

function GoalCard({ goal, clientId }: { goal: Goal; clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const status = (goal.status as GoalStatus) ?? "active";
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const Icon = cfg.icon;

  const isOverdue =
    status === "active" &&
    goal.targetDate != null &&
    new Date(goal.targetDate) < new Date();

  function setStatus(s: GoalStatus) {
    startTransition(() => updateGoalStatus(goal.id, clientId, s));
  }

  function handleDelete() {
    if (!confirm("Delete this goal?")) return;
    startTransition(() => deleteGoal(goal.id, clientId));
  }

  return (
    <div
      className={`border rounded-xl p-4 ${isPending ? "opacity-60" : ""}`}
      style={cfg.cardStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon size={16} className="mt-0.5 shrink-0" style={cfg.iconStyle} />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={status === "achieved"
                ? { textDecoration: "line-through", color: "var(--text-tertiary)" }
                : { color: "var(--text-primary)" }}
            >
              {goal.title}
            </p>
            {goal.description && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{goal.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                style={cfg.badgeStyle}
              >
                {cfg.label}
              </span>
              {goal.targetDate && (
                <span
                  className="text-xs"
                  style={isOverdue ? { color: "var(--danger)", fontWeight: 500 } : { color: "var(--text-tertiary)" }}
                >
                  {isOverdue ? "Overdue · " : "Target: "}
                  {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {goal.completedAt && (
                <span className="text-xs" style={{ color: "var(--success)" }}>
                  Achieved {new Date(goal.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {isPending ? (
          <Loader2 size={14} className="animate-spin shrink-0 mt-0.5" style={{ color: "var(--text-tertiary)" }} />
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {status !== "achieved" && (
              <button
                onClick={() => setStatus("achieved")}
                title="Mark achieved"
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--success)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--success-subtle)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <CheckCircle2 size={14} />
              </button>
            )}
            {status === "active" && (
              <button
                onClick={() => setStatus("paused")}
                title="Pause goal"
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--warning)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--warning-subtle)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <PauseCircle size={14} />
              </button>
            )}
            {(status === "paused" || status === "achieved") && (
              <button
                onClick={() => setStatus("active")}
                title={status === "paused" ? "Resume goal" : "Reopen goal"}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--brand)"; (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--brand) 8%, transparent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <Clock size={14} />
              </button>
            )}
            <button
              onClick={handleDelete}
              title="Delete goal"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--border-default)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--danger-subtle)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--border-default)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  clientId: string;
  initialGoals: Goal[];
}

export function GoalsList({ clientId, initialGoals }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createGoal({ clientId, title, description, targetDate: targetDate || undefined });
        setTitle("");
        setDescription("");
        setTargetDate("");
        setShowForm(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add goal");
      }
    });
  }

  const active = initialGoals.filter((g) => g.status === "active");
  const achieved = initialGoals.filter((g) => g.status === "achieved");
  const other = initialGoals.filter((g) => g.status !== "active" && g.status !== "achieved");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid var(--border-default)",
    borderRadius: "8px",
    fontSize: "14px",
    background: "var(--surface-raised)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <div>
      {/* Add goal */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          <Plus size={15} />
          Add Goal
        </button>
      ) : (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>New Treatment Goal</h2>
          {error && <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Goal title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reduce anxiety scores below 4 for 3 consecutive sessions"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Description <span style={{ color: "var(--text-tertiary)" }}>(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Additional context or measurement criteria…"
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Target date <span style={{ color: "var(--text-tertiary)" }}>(optional)</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{ ...inputStyle, width: "auto" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={isPending || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={{ background: "var(--brand)", color: "#fff", opacity: (isPending || !title.trim()) ? 0.5 : 1 }}
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {isPending ? "Saving…" : "Save Goal"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); setTitle(""); setDescription(""); setTargetDate(""); }}
              className="px-4 py-2 text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
            <Target size={12} />
            Active Goals ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((g) => <GoalCard key={g.id} goal={g} clientId={clientId} />)}
          </div>
        </div>
      )}

      {/* Achieved goals */}
      {achieved.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
            <CheckCircle2 size={12} />
            Achieved ({achieved.length})
          </h2>
          <div className="space-y-3">
            {achieved.map((g) => <GoalCard key={g.id} goal={g} clientId={clientId} />)}
          </div>
        </div>
      )}

      {/* Paused/Cancelled */}
      {other.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>Other</h2>
          <div className="space-y-3">
            {other.map((g) => <GoalCard key={g.id} goal={g} clientId={clientId} />)}
          </div>
        </div>
      )}

      {initialGoals.length === 0 && !showForm && (
        <div className="rounded-xl border py-14 text-center" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <Target size={28} className="mx-auto mb-3" style={{ color: "var(--border-default)" }} />
          <p className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>No treatment goals yet.</p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Add goals to track clinical objectives and milestones.</p>
        </div>
      )}
    </div>
  );
}
