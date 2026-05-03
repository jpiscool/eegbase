"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Toggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get("lang") === "es" ? "es" : "en";
  const nextLang = currentLang === "en" ? "es" : "en";
  const nextHref = `${pathname}?lang=${nextLang}`;

  return (
    <Link
      href={nextHref}
      style={{
        fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
        border: "1px solid #E2E8F0", background: "white", color: "#64748B",
        letterSpacing: "0.05em", textDecoration: "none", display: "inline-block",
      }}
    >
      {currentLang === "en" ? "🇪🇸 ES" : "🇺🇸 EN"}
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
