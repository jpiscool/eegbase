"use client";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { updateAppointmentStatus } from "@/app/schedule/actions";

type Status = "scheduled" | "completed" | "cancelled" | "no_show";

const statusStyle: Record<Status, React.CSSProperties> = {
  scheduled:  { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" },
  completed:  { background: "var(--success-subtle)", color: "var(--success)" },
  cancelled:  { background: "var(--surface-sunken)", color: "var(--text-secondary)" },
  no_show:    { background: "var(--danger-subtle)", color: "var(--danger)" },
};

const options: { value: Status; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export function AppointmentStatusBtn({ id, status }: { id: string; status: Status }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Status>(status);
  const [isPending, startTransition] = useTransition();

  const opt = options.find((o) => o.value === current)!;

  function select(value: Status) {
    setOpen(false);
    if (value === current) return;
    setCurrent(value);
    startTransition(async () => {
      await updateAppointmentStatus(id, value);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-opacity"
        style={{ ...statusStyle[current], opacity: isPending ? 0.6 : 1 }}
      >
        {opt.label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-lg py-1 min-w-[130px]"
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
