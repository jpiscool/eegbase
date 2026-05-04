import { PROTOCOL_TEMPLATES } from "@/lib/protocol-templates";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { ImportTemplateBtn } from "@/components/ImportTemplateBtn";

type CategoryStyle = { background: string; color: string };

const CATEGORY_COLORS: Record<string, CategoryStyle> = {
  "Attention":       { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" },
  "Trauma & PTSD":   { background: "color-mix(in srgb, #7C3AED 10%, transparent)", color: "#7C3AED" },
  "Depression":      { background: "color-mix(in srgb, #4F46E5 10%, transparent)", color: "#4F46E5" },
  "Anxiety":         { background: "color-mix(in srgb, var(--warning) 10%, transparent)", color: "var(--warning)" },
  "Sleep":           { background: "color-mix(in srgb, #0891B2 10%, transparent)", color: "#0891B2" },
  "TBI / Cognitive": { background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" },
  "Performance":     { background: "var(--success-subtle)", color: "var(--success)" },
};

const DEFAULT_CAT_STYLE: CategoryStyle = { background: "var(--surface-sunken)", color: "var(--text-secondary)" };

export default function ProtocolTemplatesPage() {
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
            Evidence-based protocol presets — import to your clinic in one click
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROTOCOL_TEMPLATES.map((t) => (
          <div key={t.id} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={CATEGORY_COLORS[t.category] ?? DEFAULT_CAT_STYLE}>
                    {t.category}
                  </span>
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
          </div>
        ))}
      </div>
    </div>
  );
}
