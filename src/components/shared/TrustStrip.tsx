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
  { dot: "#10B981", label: "HIPAA-friendly",       date: "Today",    explain: "HIPAA-aligned architecture today. We sign a Business Associate Agreement with every clinic that stores PHI." },
  { dot: "#2563EB", label: "SOC 2 Type II",        date: "Q1 2026",  explain: "Coalfire audit scheduled for Q1 2026. Report will be available NDA-gated on completion." },
  { dot: "#7C3AED", label: "US data residency",    date: "Always",   explain: "All U.S. clinic data stored in AWS us-east-1. EU clinics on Frankfurt eu-west-3. No cross-border transfer." },
  { dot: "#F59E0B", label: "End-to-end encrypted", date: "Always",   explain: "TLS 1.3 in transit, AES-256-GCM at rest. Keys managed by AWS KMS." },
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
