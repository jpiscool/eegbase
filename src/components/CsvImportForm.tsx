"use client";
import { useState, useTransition } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { importSessionsFromCsv, type ImportResult } from "@/app/sessions/import/actions";

export function CsvImportForm() {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText.trim()) return;
    setResult(null);
    startTransition(async () => {
      const res = await importSessionsFromCsv(csvText);
      setResult(res);
    });
  }

  const isError = result && result.errors.length > 0 && result.imported === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Upload CSV file</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Or paste CSV text</label>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={8}
          placeholder={"client_email,started_at,duration_seconds,device_type,avg_reward_score,notes\njohn@example.com,2024-03-15T10:00:00Z,1800,mendi,72.5,Great session"}
          className="w-full rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-primary)" }}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !csvText.trim()}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        style={{ background: "var(--brand)", color: "#fff" }}
      >
        <Upload size={15} />
        {isPending ? "Importing…" : "Import Sessions"}
      </button>

      {result && (
        <div
          className="rounded-xl border p-4"
          style={isError
            ? { background: "var(--danger-subtle)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)" }
            : { background: "var(--success-subtle)", borderColor: "color-mix(in srgb, var(--success) 25%, transparent)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.imported > 0 ? (
              <CheckCircle size={16} style={{ color: "var(--success)" }} />
            ) : (
              <AlertCircle size={16} style={{ color: "var(--danger)" }} />
            )}
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {result.imported} session{result.imported !== 1 ? "s" : ""} imported
              {result.skipped > 0 && `, ${result.skipped} skipped`}
            </p>
          </div>
          {result.errors.length > 0 && (
            <ul className="text-xs space-y-0.5 list-disc list-inside" style={{ color: "var(--danger)" }}>
              {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
              {result.errors.length > 10 && <li>…and {result.errors.length - 10} more</li>}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
