"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "eegbase-roadmap-votes";

type VoteState = Record<string, { count: number; voted: boolean }>;

function getStored(): VoteState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setStored(state: VoteState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function RoadmapVoteButton({ id, initial, color }: { id: string; initial: number; color: string }) {
  const [count, setCount] = useState(initial);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const stored = getStored();
    if (stored[id]) {
      setCount(stored[id].count);
      setVoted(stored[id].voted);
    }
  }, [id]);

  function vote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const stored = getStored();
    if (voted) {
      const next = Math.max(initial - 1, count - 1);
      setCount(next);
      setVoted(false);
      stored[id] = { count: next, voted: false };
    } else {
      const next = count + 1;
      setCount(next);
      setVoted(true);
      stored[id] = { count: next, voted: true };
    }
    setStored(stored);
  }

  return (
    <button
      type="button"
      onClick={vote}
      aria-label={voted ? `Remove vote (${count} votes)` : `Vote up (${count} votes)`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "4px 8px",
        border: `1px solid ${voted ? color : `${color}40`}`,
        borderRadius: 8,
        minWidth: 36,
        background: voted ? `${color}15` : "white",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 9, color, fontWeight: 700 }}>▲</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: "#111", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{count}</span>
    </button>
  );
}
