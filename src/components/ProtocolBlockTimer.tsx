"use client";
// ── Protocol Block Timer ────────────────────────────────────────────────────
// Scripted multi-block protocol runtime. Given a list of blocks
// ({ kind, label, durationSeconds }) and the live elapsed seconds from
// the parent LiveSessionView, this component renders a compact "current
// block / time remaining / next block" pill above the session.
//
// Block schema (stored in protocols.parameters.blocks as jsonb):
//   [
//     { kind: "baseline", label: "Baseline rest",   durationSeconds: 60 },
//     { kind: "focus",    label: "Focus training",  durationSeconds: 300 },
//     { kind: "rest",     label: "Eyes-closed rest", durationSeconds: 120 },
//     { kind: "focus",    label: "Focus training",  durationSeconds: 300 },
//   ]
//
// Total duration is the sum of block durations. The component is
// purely presentational — the parent owns the elapsed counter and
// the session-save handoff.

import React from "react";

export type ProtocolBlockKind = "baseline" | "focus" | "rest" | "calm" | "task";

export interface ProtocolBlock {
  kind: ProtocolBlockKind;
  label: string;
  durationSeconds: number;
}

const KIND_COLOR: Record<ProtocolBlockKind, string> = {
  baseline: "#94A3B8",
  focus:    "#34D399",
  rest:     "#A78BFA",
  calm:     "#60A5FA",
  task:     "#F59E0B",
};

const KIND_LABEL: Record<ProtocolBlockKind, string> = {
  baseline: "Baseline",
  focus:    "Focus",
  rest:     "Rest",
  calm:     "Calm",
  task:     "Task",
};

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.max(0, sec - m * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface ProtocolBlockTimerProps {
  blocks: ProtocolBlock[];
  elapsedSeconds: number;
  onComplete?: () => void;
}

// Given elapsed seconds, find the current block index + seconds into it.
// Returns { index: -1, secondsIntoBlock: 0 } when finished.
export function currentBlockState(
  blocks: ProtocolBlock[],
  elapsedSeconds: number,
): { index: number; secondsIntoBlock: number; totalSeconds: number } {
  const totalSeconds = blocks.reduce((a, b) => a + b.durationSeconds, 0);
  let remaining = elapsedSeconds;
  for (let i = 0; i < blocks.length; i++) {
    const dur = blocks[i].durationSeconds;
    if (remaining < dur) return { index: i, secondsIntoBlock: remaining, totalSeconds };
    remaining -= dur;
  }
  return { index: -1, secondsIntoBlock: 0, totalSeconds };
}

export function ProtocolBlockTimer({ blocks, elapsedSeconds, onComplete }: ProtocolBlockTimerProps) {
  const state = currentBlockState(blocks, elapsedSeconds);
  const [completedNotified, setCompletedNotified] = React.useState(false);

  React.useEffect(() => {
    if (state.index === -1 && !completedNotified) {
      setCompletedNotified(true);
      onComplete?.();
    }
  }, [state.index, completedNotified, onComplete]);

  if (blocks.length === 0) return null;

  // Finished — render a quiet completion line.
  if (state.index === -1) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.3)",
        borderRadius: 999, padding: "8px 16px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12, color: "#34D399", fontWeight: 700,
      }}>
        <span>✓ Protocol complete · {blocks.length} blocks · {fmt(state.totalSeconds)} total</span>
      </div>
    );
  }

  const cur = blocks[state.index];
  const next = blocks[state.index + 1];
  const remaining = Math.max(0, cur.durationSeconds - state.secondsIntoBlock);
  const color = KIND_COLOR[cur.kind];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      background: "#020617", border: `1px solid ${color}40`,
      borderRadius: 12, padding: "10px 16px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12, color: "#CBD5E1",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          background: color, boxShadow: `0 0 8px ${color}`,
        }} />
        <span style={{ color: "#94A3B8", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Block {state.index + 1}/{blocks.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <strong style={{ color, fontSize: 13 }}>{KIND_LABEL[cur.kind]} — {cur.label}</strong>
        <span style={{ color: "#94A3B8", fontSize: 11 }}>
          <strong style={{ color: "#F1F5F9", fontFamily: "inherit" }}>{fmt(remaining)}</strong> remaining
          {next && (
            <>
              <span style={{ color: "#475569" }}> · next: </span>
              <span style={{ color: KIND_COLOR[next.kind] }}>{KIND_LABEL[next.kind]}</span>
            </>
          )}
        </span>
      </div>
      {/* Progress bar */}
      <div style={{
        flex: 1, minWidth: 120, height: 6, background: "#1E293B",
        borderRadius: 3, overflow: "hidden", position: "relative",
      }}>
        <div style={{
          width: `${(state.secondsIntoBlock / cur.durationSeconds) * 100}%`,
          height: "100%", background: color, transition: "width 0.5s linear",
        }} />
      </div>
    </div>
  );
}

// Helper: parse blocks from a protocol's parameters jsonb. Returns []
// if the parameters don't carry a valid blocks array — useful so a
// legacy protocol (no blocks) renders nothing instead of erroring.
export function parseProtocolBlocks(parameters: unknown): ProtocolBlock[] {
  if (!parameters || typeof parameters !== "object") return [];
  const obj = parameters as Record<string, unknown>;
  if (!Array.isArray(obj.blocks)) return [];
  const out: ProtocolBlock[] = [];
  for (const b of obj.blocks) {
    if (!b || typeof b !== "object") continue;
    const row = b as Record<string, unknown>;
    const kind = row.kind;
    const label = row.label;
    const durationSeconds = row.durationSeconds;
    if (
      (kind === "baseline" || kind === "focus" || kind === "rest" || kind === "calm" || kind === "task") &&
      typeof label === "string" &&
      typeof durationSeconds === "number" &&
      durationSeconds > 0
    ) {
      out.push({ kind, label, durationSeconds });
    }
  }
  return out;
}
