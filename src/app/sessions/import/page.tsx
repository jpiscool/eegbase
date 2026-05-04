import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { CsvImportForm } from "@/components/CsvImportForm";

export default function SessionImportPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/sessions" className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Upload size={20} style={{ color: "var(--brand)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Import Sessions</h1>
        </div>
      </div>

      <div className="rounded-xl border p-4 mb-6 text-sm" style={{ background: "color-mix(in srgb, var(--brand) 8%, transparent)", borderColor: "color-mix(in srgb, var(--brand) 20%, transparent)", color: "var(--brand)" }}>
        <p className="font-semibold mb-1">CSV Format</p>
        <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
          Required columns:{" "}
          <code className="px-1 rounded" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>client_email</code>,{" "}
          <code className="px-1 rounded" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>started_at</code>{" "}
          (ISO 8601). Optional:{" "}
          <code className="px-1 rounded" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>duration_seconds</code>,{" "}
          <code className="px-1 rounded" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>device_type</code>,{" "}
          <code className="px-1 rounded" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>avg_reward_score</code>,{" "}
          <code className="px-1 rounded" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>notes</code>
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Example row:{" "}
          <code className="px-1 rounded" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>john@example.com,2024-03-15T10:00:00Z,1800,mendi,72.5,Great session</code>
        </p>
      </div>

      <CsvImportForm />
    </div>
  );
}
