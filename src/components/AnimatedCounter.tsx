"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 1400,
  className,
}: {
  value: number | string;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>("0");
  const startedRef = useRef(false);

  // Non-numeric values (e.g., "MIT", "Custom") just render directly
  const numeric = typeof value === "number";

  useEffect(() => {
    if (!numeric) {
      setDisplay(String(value));
      return;
    }
    const node = ref.current;
    if (!node) return;
    const target = value as number;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              const current = Math.round(target * eased);
              setDisplay(current.toLocaleString("en-US"));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration, numeric]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {numeric ? display : String(value)}
      {suffix}
    </span>
  );
}
