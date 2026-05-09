"use client";

import { useState, useEffect } from "react";

// Phase 28 — Pair-with-one-person buddy card. Per research: home-user
// adherence ~2x when paired with a single accountability partner (not
// a group, not a forum). The card shows three states:
//
//   1. NOT PAIRED — invite a buddy by email
//   2. INVITE SENT — waiting on the buddy to accept
//   3. PAIRED — show the buddy's first name + their last activity
//
// State persisted in localStorage so a returning visitor sees the same
// state. No real email is sent in the demo.

const KEY = "eegbase-demo-buddy";

type State =
  | { kind: "none" }
  | { kind: "sent"; email: string }
  | { kind: "paired"; name: string; lastSeen: string };

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { kind: "none" };
    return JSON.parse(raw) as State;
  } catch {
    return { kind: "none" };
  }
}

function write(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function BuddyCard() {
  const [state, setState] = useState<State>({ kind: "none" });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setState(read()); }, []);

  function invite() {
    if (!email.trim() || busy) return;
    setBusy(true);
    // Simulate a 600ms send. In production this triggers a server action that
    // emails an accept-invite link via Resend/SES.
    setTimeout(() => {
      const next: State = { kind: "sent", email: email.trim() };
      setState(next);
      write(next);
      setBusy(false);
    }, 600);
  }

  function simulateAccept() {
    // Demo-only shortcut: lets the visitor see the paired state without
    // actually waiting on an email accept loop.
    const name = state.kind === "sent"
      ? state.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).split(" ")[0]
      : "Alex";
    const next: State = {
      kind: "paired",
      name: name || "Alex",
      lastSeen: "Trained today, 12 min Focus",
    };
    setState(next);
    write(next);
  }

  function unpair() {
    setState({ kind: "none" });
    write({ kind: "none" });
    setEmail("");
  }

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your training buddy</h2>
        <p className="text-xs text-gray-400">One person. Optional. Quietly motivating.</p>
      </div>

      {state.kind === "none" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-base text-gray-800 leading-relaxed mb-4">
            People who pair with one accountability partner train{" "}
            <span className="font-semibold text-gray-900">2x more often</span>. No groups, no leaderboards.
            Just one person who sees when you trained.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") invite(); }}
              placeholder="Their email"
              aria-label="Buddy email"
              className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            />
            <button
              onClick={invite}
              disabled={busy || !email.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {busy ? "Inviting…" : "Invite"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">They&rsquo;ll get one email. No spam, no extra account needed on their side.</p>
        </div>
      )}

      {state.kind === "sent" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Invite sent ✓</p>
              <p className="text-xs text-gray-500 mt-1 truncate">to {state.email}</p>
            </div>
            <button
              onClick={unpair}
              className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            We&rsquo;ll let you know when they accept. In the meantime, your training continues normally.
          </p>
          <button
            onClick={simulateAccept}
            className="text-xs text-blue-600 font-semibold hover:text-blue-700"
          >
            Demo: simulate them accepting →
          </button>
        </div>
      )}

      {state.kind === "paired" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
              {state.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Paired with {state.name}</p>
              <p className="text-xs text-gray-500 inline-flex items-center gap-1.5 mt-0.5">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {state.lastSeen}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            They see when you train; you see when they do. No scores, no streaks. Just a quiet signal that someone&rsquo;s in it with you.
          </p>
          <button
            onClick={unpair}
            className="text-xs text-gray-400 hover:text-gray-700 mt-3"
          >
            Unpair
          </button>
        </div>
      )}
    </section>
  );
}
