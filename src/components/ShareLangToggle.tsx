"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Lang } from "@/lib/i18n";

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "sv", flag: "🇸🇪", label: "SV" },
];

function Toggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawLang = searchParams.get("lang");
  const currentLang: Lang = rawLang === "es" ? "es" : rawLang === "sv" ? "sv" : "en";

  // Cycle to next language in the list
  const currentIdx = LANGS.findIndex((l) => l.code === currentLang);
  const next = LANGS[(currentIdx + 1) % LANGS.length];
  const nextHref = `${pathname}?lang=${next.code}`;

  const current = LANGS[currentIdx];

  return (
    <Link
      href={nextHref}
      style={{
        fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
        border: "1px solid var(--border-default)", background: "var(--surface-raised)", color: "var(--text-secondary)",
        letterSpacing: "0.05em", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
      }}
      title={`Switch to ${next.label}`}
    >
      {current.flag} {current.label}
    </Link>
  );
}

export function ShareLangToggle() {
  return (
    <Suspense>
      <Toggle />
    </Suspense>
  );
}
