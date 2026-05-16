import { PROTOCOL_TEMPLATES, type ProtocolTemplate } from "@/lib/protocol-templates";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { ImportTemplateBtn } from "@/components/ImportTemplateBtn";

type CategoryStyle = { background: string; color: string };

const CATEGORY_COLORS: Record<string, CategoryStyle> = {
  // Original categories
  "Attention":           { background: "color-mix(in srgb, var(--brand) 10%, transparent)",  color: "var(--brand)" },
  "Trauma & PTSD":       { background: "color-mix(in srgb, #7C3AED 10%, transparent)",       color: "#7C3AED" },
  "Depression":          { background: "color-mix(in srgb, #4F46E5 10%, transparent)",       color: "#4F46E5" },
  "Anxiety":             { background: "color-mix(in srgb, var(--warning) 10%, transparent)", color: "var(--warning)" },
  "Sleep":               { background: "color-mix(in srgb, #0891B2 10%, transparent)",       color: "#0891B2" },
  "TBI / Cognitive":     { background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" },
  "Performance":         { background: "var(--success-subtle)",                              color: "var(--success)" },
  // New categories (added with the catalog expansion to 19)
  "Regulation":          { background: "color-mix(in srgb, #EC4899 10%, transparent)",       color: "#EC4899" },
  "Epilepsy":            { background: "color-mix(in srgb, #DC2626 10%, transparent)",       color: "#DC2626" },
  "qEEG-guided":         { background: "color-mix(in srgb, #0EA5E9 10%, transparent)",       color: "#0EA5E9" },
  "Migraine":            { background: "color-mix(in srgb, #C026D3 10%, transparent)",       color: "#C026D3" },
  "Autism / Social":     { background: "color-mix(in srgb, #14B8A6 10%, transparent)",       color: "#14B8A6" },
  "OCD":                 { background: "color-mix(in srgb, #F97316 10%, transparent)",       color: "#F97316" },
  "Autonomic / Stress":  { background: "color-mix(in srgb, #EF4444 10%, transparent)",       color: "#EF4444" },
  "Executive function":  { background: "color-mix(in srgb, #6366F1 10%, transparent)",       color: "#6366F1" },
  "Meditation / Calm":   { background: "color-mix(in srgb, #10B981 10%, transparent)",       color: "#10B981" },
};

const DEFAULT_CAT_STYLE: CategoryStyle = { background: "var(--surface-sunken)", color: "var(--text-secondary)" };

// Stable display order so the page reads top-down by clinical priority,
// rather than catalog insertion order.
const CATEGORY_ORDER = [
  "Attention",
  "Anxiety",
  "Depression",
  "Trauma & PTSD",
  "OCD",
  "Sleep",
  "Migraine",
  "Epilepsy",
  "TBI / Cognitive",
  "Executive function",
  "Autonomic / Stress",
  "Autism / Social",
  "Regulation",
  "qEEG-guided",
  "Performance",
  "Meditation / Calm",
];

function categorySort(a: string, b: string): number {
  const ai = CATEGORY_ORDER.indexOf(a);
  const bi = CATEGORY_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

export default function ProtocolTemplatesPage() {
  // Group templates by category, then sort categories by clinical priority.
  const byCategory = new Map<string, ProtocolTemplate[]>();
  for (const t of PROTOCOL_TEMPLATES) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }
  const sortedCategories = [...byCategory.keys()].sort(categorySort);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/protocols" className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: "var(--warning)" }} />
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Protocol Template Library</h1>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {PROTOCOL_TEMPLATES.length} evidence-based protocol presets across {sortedCategories.length} categories — import to your clinic in one click.
          </p>
        </div>
      </div>

      {sortedCategories.map((category) => {
        const items = byCategory.get(category)!;
        const style = CATEGORY_COLORS[category] ?? DEFAULT_CAT_STYLE;
        return (
          <section key={category} className="mb-10">
            <div className="flex items-baseline justify-between gap-3 mb-3 pb-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={style}
                >
                  {category}
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {items.length} template{items.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((t) => (
                <article key={t.id} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase" style={{ background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}>
                          {t.deviceType}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Target:</span> {t.targetBand}</div>
                    <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Sites:</span> {t.electrodes}</div>
                    <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Duration:</span> {t.sessionDurationMinutes} min</div>
                    <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>Reward:</span> {t.rewardThreshold}% threshold</div>
                  </div>

                  <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <span className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>{t.evidence}</span>
                    <ImportTemplateBtn templateId={t.id} templateName={t.name} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
