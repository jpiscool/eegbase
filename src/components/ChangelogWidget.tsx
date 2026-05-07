import Link from "next/link";

// Static for now — pulls the latest 3 entries from /changelog data.
// Real implementation would read from the same source as the changelog page.

const RECENT = [
  { date: "May 6 2026",  tag: "shipped",  title: "White-label /mendi-clinical-preview route" },
  { date: "May 5 2026",  tag: "shipped",  title: "HIPAA video co-feedback panel + cross-session AI pattern detector" },
  { date: "May 4 2026",  tag: "shipped",  title: "Live ROI calculator + 5-pill trust strip + outcome-story arc" },
];

const TAG_COLOR: Record<string, { bg: string; fg: string }> = {
  shipped:  { bg: "bg-emerald-50", fg: "text-emerald-700" },
  improved: { bg: "bg-blue-50",    fg: "text-blue-700" },
  fixed:    { bg: "bg-amber-50",   fg: "text-amber-700" },
};

export function ChangelogWidget() {
  return (
    <section className="max-w-3xl mx-auto px-6 pb-16">
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Recently shipped</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">From the changelog</h3>
          </div>
          <Link href="/changelog" className="text-xs font-semibold text-blue-600 hover:underline">All updates →</Link>
        </div>
        <ul className="divide-y divide-gray-100">
          {RECENT.map((e, i) => {
            const c = TAG_COLOR[e.tag] || TAG_COLOR.shipped;
            return (
              <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded ${c.bg} ${c.fg} shrink-0`}>{e.tag.toUpperCase()}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{e.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{e.date}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
