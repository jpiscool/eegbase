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

const STATUS_CONFIG: Record<GoalStatus, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  active: { icon: Clock, label: "Active", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
  achieved: { icon: CheckCircle2, label: "Achieved", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
  paused: { icon: PauseCircle, label: "Paused", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "text-gray-500", bg: "bg-gray-50 border-gray-100" },
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
    <div className={`border rounded-xl p-4 ${cfg.bg} ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon size={16} className={`mt-0.5 shrink-0 ${cfg.color}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${status === "achieved" ? "line-through text-gray-400" : "text-gray-900"}`}>
              {goal.title}
            </p>
            {goal.description && (
              <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              {goal.targetDate && (
                <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                  {isOverdue ? "Overdue · " : "Target: "}
                  {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {goal.completedAt && (
                <span className="text-xs text-emerald-600">
                  Achieved {new Date(goal.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {isPending ? (
          <Loader2 size={14} className="animate-spin text-gray-400 shrink-0 mt-0.5" />
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {status !== "achieved" && (
              <button
                onClick={() => setStatus("achieved")}
                title="Mark achieved"
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 size={14} />
              </button>
            )}
            {status === "active" && (
              <button
                onClick={() => setStatus("paused")}
                title="Pause goal"
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <PauseCircle size={14} />
              </button>
            )}
            {status === "paused" && (
              <button
                onClick={() => setStatus("active")}
                title="Resume goal"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Clock size={14} />
              </button>
            )}
            {status === "achieved" && (
              <button
                onClick={() => setStatus("active")}
                title="Reopen goal"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Clock size={14} />
              </button>
            )}
            <button
              onClick={handleDelete}
              title="Delete goal"
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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

  return (
    <div>
      {/* Add goal */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={15} />
          Add Goal
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Treatment Goal</h2>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Goal title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reduce anxiety scores below 4 for 3 consecutive sessions"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Additional context or measurement criteria…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target date <span className="text-gray-400">(optional)</span></label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={isPending || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {isPending ? "Saving…" : "Save Goal"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); setTitle(""); setDescription(""); setTargetDate(""); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
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
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
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
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Other</h2>
          <div className="space-y-3">
            {other.map((g) => <GoalCard key={g.id} goal={g} clientId={clientId} />)}
          </div>
        </div>
      )}

      {initialGoals.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
          <Target size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">No treatment goals yet.</p>
          <p className="text-xs text-gray-400">Add goals to track clinical objectives and milestones.</p>
        </div>
      )}
    </div>
  );
}
