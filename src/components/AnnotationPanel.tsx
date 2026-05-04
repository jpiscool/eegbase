"use client";
import { useState } from "react";

export interface Annotation {
  id: string;
  timestampMs: number;
  label: string;
  category: "observation" | "protocol" | "marker";
}

const CATEGORIES: { value: Annotation["category"]; label: string }[] = [
  { value: "observation", label: "Observation" },
  { value: "protocol", label: "Protocol" },
  { value: "marker", label: "Marker" },
];

function categoryStyle(cat: Annotation["category"]): React.CSSProperties {
  switch (cat) {
    case "observation":
      return {
        background: "color-mix(in srgb, var(--brand) 15%, transparent)",
        color: "var(--brand)",
      };
    case "protocol":
      return {
        background: "var(--success-subtle)",
        color: "var(--success)",
      };
    case "marker":
      return {
        background: "var(--warning-subtle)",
        color: "var(--warning)",
      };
  }
}

function fmtTime(ms: number): string {
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

interface Props {
  elapsedMs: number;
  annotations: Annotation[];
  onAdd: (ann: Omit<Annotation, "id">) => void;
  onRemove: (id: string) => void;
}

export function AnnotationPanel({ elapsedMs, annotations, onAdd, onRemove }: Props) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<Annotation["category"]>("observation");

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd({ timestampMs: elapsedMs, label: trimmed, category });
    setLabel("");
  }

  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: "var(--text-tertiary)" }}
      >
        Session Annotations
      </p>

      {/* Add row */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add annotation..."
          className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
          style={{
            border: "1px solid var(--border-default)",
            background: "var(--surface-sunken)",
            color: "var(--text-primary)",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Annotation["category"])}
          className="rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          style={{
            border: "1px solid var(--border-default)",
            background: "var(--surface-sunken)",
            color: "var(--text-primary)",
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!label.trim()}
          className="px-3 py-1.5 text-sm font-semibold rounded-lg disabled:opacity-40 transition-opacity"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          +
        </button>
      </div>

      {/* Annotation list */}
      {annotations.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {annotations.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm">
              <span
                className="font-mono shrink-0 w-16 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {fmtTime(a.timestampMs)}
              </span>
              <span
                className="shrink-0 px-2 py-0.5 rounded text-xs font-medium"
                style={categoryStyle(a.category)}
              >
                {a.category}
              </span>
              <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                {a.label}
              </span>
              <button
                onClick={() => onRemove(a.id)}
                className="shrink-0 text-sm leading-none transition-opacity hover:opacity-60"
                style={{ color: "var(--text-tertiary)" }}
                aria-label="Remove annotation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
