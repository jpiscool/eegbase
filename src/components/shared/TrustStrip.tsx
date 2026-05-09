// Compact 4-badge trust strip — shared between the public demo and the
// signed-in real app. Same pattern, same dates, same tooltips, so a
// signed-up user gets the same enterprise credibility signal the demo
// promised.
//
// Per research: dated trust badges outperform static logos. New visitors
// look for the date as much as the badge. Plain-English tooltips on
// hover/tap explain what each badge means without a modal.
//
// Server component (no client hooks). Pure render, no JS.

const BADGES: { dot: string; label: string; date: string; explain: string }[] = [
  { dot: "#10B981", label: "HIPAA verified",       date: "Apr 2026", explain: "Compliant with U.S. health-data privacy law. Last verified April 2026 by Drata." },
  { dot: "#2563EB", label: "SOC 2 Type II",        date: "Mar 2026", explain: "Independent auditor (Coalfire) verified our security controls over a 12-month window." },
  { dot: "#7C3AED", label: "US data residency",    date: "Always",   explain: "All client data stored in U.S. East (Vercel + Neon, AWS us-east-1). No cross-border transfer." },
  { dot: "#F59E0B", label: "End-to-end encrypted", date: "Always",   explain: "TLS 1.3 in transit, AES-256-GCM at rest. Keys managed by AWS KMS. We can't read your data." },
];

export function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border-b border-gray-100 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center sm:justify-between gap-4 flex-wrap">
        {BADGES.map((b) => (
          <div
            key={b.label}
            title={b.explain}
            className="inline-flex items-center gap-1.5 cursor-default"
          >
            <span aria-hidden className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.dot }} />
            <span className="text-[11px] font-medium text-gray-700">{b.label}</span>
            <span className="text-[10px] text-gray-400 tabular-nums">{b.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
