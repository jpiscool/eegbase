"use client";
import { useState, useTransition } from "react";
import { Tag, Plus, Trash2, Clock } from "lucide-react";
import { addAnnotation, deleteAnnotation } from "@/app/sessions/[id]/annotations/actions";

interface Annotation {
  id: string;
  label: string;
  category: string;
  timestampMs: number;
  createdAt: Date;
}

const CATEGORIES = [
  { value: "note",        label: "Note",          color: "#6366f1" },
  { value: "observation", label: "Observation",   color: "#0ea5e9" },
  { value: "protocol",    label: "Protocol",      color: "#059669" },
  { value: "artefact",    label: "Artefact",      color: "#d97706" },
];

const QUICK_STAMPS = ["Distraction", "Deep focus", "Protocol change", "Artefact", "Eye movement", "Yawn", "Fidgeting", "Calm period"];

function fmtMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function catColor(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.color ?? "#6b7280";
}

function catLabel(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function SessionAnnotations({
  sessionId,
  initialAnnotations,
  durationSeconds,
}: {
  sessionId: string;
  initialAnnotations: Annotation[];
  durationSeconds: number | null;
}) {
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("note");
  const [timestampMin, setTimestampMin] = useState(0);
  const [timestampSec, setTimestampSec] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const ms = (timestampMin * 60 + timestampSec) * 1000;
    setError(null);
    startTransition(async () => {
      try {
        await addAnnotation(sessionId, { label: label.trim(), category, timestampMs: ms });
        setAnnotations((prev) =>
          [...prev, { id: crypto.randomUUID(), label: label.trim(), category, timestampMs: ms, createdAt: new Date() }]
            .sort((a, b) => a.timestampMs - b.timestampMs)
        );
        setLabel("");
        setShowForm(false);
      } catch {
        setError("Failed to save annotation");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteAnnotation(sessionId, id);
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
      } catch {
        // ignore
      }
    });
  }

  function useQuickStamp(stamp: string) {
    setLabel(stamp);
    setShowForm(true);
    setCategory("observation");
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag size={15} style={{ color: "var(--brand)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Session Annotations
          </h2>
          {annotations.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
            >
              {annotations.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: "var(--brand)", color: "white" }}
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Quick stamps */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {QUICK_STAMPS.map((s) => (
          <button
            key={s}
            onClick={() => useQuickStamp(s)}
            className="tag-chip hover:border-blue-400 transition-colors"
            style={{ fontSize: "11px" }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg p-4 mb-4 animate-slide-up"
          style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Client distracted"
                required
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Clock size={13} style={{ color: "var(--text-tertiary)" }} />
            <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Timestamp</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min={0} max={durationSeconds ? Math.floor(durationSeconds / 60) : 99}
                value={timestampMin}
                onChange={(e) => setTimestampMin(Number(e.target.value))}
                className="w-14 px-2 py-1 rounded text-sm border text-center"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
              />
              <span style={{ color: "var(--text-tertiary)" }}>m</span>
              <input
                type="number" min={0} max={59}
                value={timestampSec}
                onChange={(e) => setTimestampSec(Number(e.target.value))}
                className="w-14 px-2 py-1 rounded text-sm border text-center"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
              />
              <span style={{ color: "var(--text-tertiary)" }}>s</span>
            </div>
          </div>
          {error && <p className="text-xs mb-2" style={{ color: "var(--danger)" }}>{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "var(--brand)", color: "white" }}
            >
              {pending ? "Saving…" : "Save Annotation"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Annotations list */}
      {annotations.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: "var(--text-tertiary)" }}>
          No annotations yet. Add a stamp to mark key moments in this session.
        </p>
      ) : (
        <div className="space-y-2">
          {annotations
            .slice()
            .sort((a, b) => a.timestampMs - b.timestampMs)
            .map((ann) => (
              <div
                key={ann.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg group"
                style={{
                  background: "var(--surface-sunken)",
                  borderLeft: `3px solid ${catColor(ann.category)}`,
                }}
              >
                {/* Timestamp */}
                <div
                  className="flex items-center gap-1 shrink-0 font-mono text-xs font-semibold"
                  style={{ color: catColor(ann.category) }}
                >
                  <Clock size={10} />
                  {fmtMs(ann.timestampMs)}
                </div>

                {/* Category pill */}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: catColor(ann.category) + "22", color: catColor(ann.category) }}
                >
                  {catLabel(ann.category)}
                </span>

                {/* Label */}
                <span className="flex-1 text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {ann.label}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(ann.id)}
                  disabled={pending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                  style={{ color: "var(--danger)" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
