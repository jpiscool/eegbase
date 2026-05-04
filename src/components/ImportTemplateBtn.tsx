"use client";
import { useState, useTransition } from "react";
import { Download, Check } from "lucide-react";
import { importProtocolTemplate } from "@/app/protocols/templates/actions";

export function ImportTemplateBtn({ templateId, templateName }: { templateId: string; templateName: string }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleImport() {
    startTransition(async () => {
      await importProtocolTemplate(templateId);
      setDone(true);
    });
  }

  return (
    <button
      onClick={handleImport}
      disabled={isPending || done}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
      style={done
        ? { background: "var(--success-subtle)", color: "var(--success)" }
        : { background: "var(--brand)", color: "#fff" }}
    >
      {done ? <><Check size={12} /> Imported</> : isPending ? "Importing…" : <><Download size={12} /> Import</>}
    </button>
  );
}
