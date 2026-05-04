"use client";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { updateInvoiceStatus } from "@/app/billing/actions";

type Status = "draft" | "sent" | "paid" | "waived";

const statusStyle: Record<Status, React.CSSProperties> = {
  draft:  { background: "var(--surface-sunken)", color: "var(--text-secondary)" },
  sent:   { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" },
  paid:   { background: "var(--success-subtle)", color: "var(--success)" },
  waived: { background: "var(--warning-subtle)", color: "var(--warning)" },
};

const options: { value: Status; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
];

export function InvoiceStatusBtn({ id, status }: { id: string; status: Status }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Status>(status);
  const [isPending, startTransition] = useTransition();
  const opt = options.find((o) => o.value === current)!;

  function select(value: Status) {
    setOpen(false);
    if (value === current) return;
    setCurrent(value);
    startTransition(async () => { await updateInvoiceStatus(id, value); });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-opacity"
        style={{ ...statusStyle[current], opacity: isPending ? 0.6 : 1 }}
      >
        {opt.label} <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-1 z-20 rounded-lg shadow-lg py-1 min-w-[110px]"
            style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => select(o.value)}
                className="w-full text-left px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  ...statusStyle[o.value],
                  background: current === o.value ? statusStyle[o.value].background : "transparent",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
