"use client";

import { CLIENTS } from "../_data/clients";
import { HOME_PRACTICE } from "../_data/sessions";

// "How is everyone today?" — a single primitive that solves the #1 daily
// clinician workflow ('which patients need attention right now?'). One row
// per patient, single plain-English status string, color dot, sorted
// urgent-first.

interface HowIsEveryoneCardProps {
  onOpenPatient: (clientId: string) => void;
}

type Status = {
  level: "ok" | "watch" | "urgent";
  text: string;
};

// Derive a one-line status from the home-practice recency + a few
// illustrative session/check-in heuristics. In a real app these come from
// a server query joining sessions, check-ins, outcome-measures, and
// no-shows; in the demo we synthesize from HOME_PRACTICE + small extras.
const EXTRAS: Record<string, Partial<Status>> = {
  sarah:  { text: "Trained today, score 78. On track." },
  james:  { text: "4 days without a check-in. Send one?" },
  priya:  { text: "Trained today. Mood ↑ this week." },
  daniel: { text: "9 days no session. May need a nudge." },
  emily:  { text: "On track. Last 3 sessions all above 75." },
};

function statusFor(clientId: string): Status {
  const hp = HOME_PRACTICE.find((h) => h.clientId === clientId);
  const days = hp?.daysSince ?? 99;
  const extra = EXTRAS[clientId];
  const level: Status["level"] = days <= 2 ? "ok" : days <= 7 ? "watch" : "urgent";
  return {
    level,
    text: extra?.text ?? (
      level === "urgent" ? `${days} days no home session.` :
      level === "watch"  ? `${days} days since last home session.` :
                           "On track."
    ),
  };
}

const LEVEL_RANK: Record<Status["level"], number> = { urgent: 0, watch: 1, ok: 2 };
const LEVEL_DOT: Record<Status["level"], string> = { ok: "#10B981", watch: "#F59E0B", urgent: "#EF4444" };

export function HowIsEveryoneCard({ onOpenPatient }: HowIsEveryoneCardProps) {
  const rows = CLIENTS
    .map((c) => ({ client: c, status: statusFor(c.id) }))
    .sort((a, b) => LEVEL_RANK[a.status.level] - LEVEL_RANK[b.status.level]);

  const needsAttention = rows.filter((r) => r.status.level !== "ok").length;

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">How is everyone today?</h2>
        <p className="text-xs text-gray-500">
          {needsAttention === 0
            ? "Everyone on track."
            : <>
                <span className="font-semibold text-gray-900 tabular-nums">{needsAttention}</span> need
                {needsAttention === 1 ? "s" : ""} attention
              </>}
        </p>
      </div>
      <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
        {rows.map(({ client, status }) => (
          <li key={client.id}>
            <button
              onClick={() => onOpenPatient(client.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                {client.initials}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 truncate">{client.name}</span>
                <span className="block text-xs text-gray-500 inline-flex items-center gap-1.5 mt-0.5">
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: LEVEL_DOT[status.level] }} />
                  {status.text}
                </span>
              </span>
              <span className="text-xs text-blue-600 font-semibold flex-shrink-0" aria-hidden>Open →</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
