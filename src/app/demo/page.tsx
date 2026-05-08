import type { Metadata } from "next";
import { cookies } from "next/headers";
import DemoClient from "./DemoClient";

// Server component: reads ?tab= from the URL, falls back to a "demo_tab"
// cookie, and forwards the validated value to the client demo. SSR HTML
// already renders the correct tab — no hydration flash, and if a privacy
// browser (DuckDuckGo, Brave Strict, etc.) strips the query parameter on
// refresh, the cookie keeps the user on their last tab anyway.
//
// Marked dynamic so Next.js never serves a stale prerendered "session" HTML.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Demo · EEGBase",
  description:
    "Interactive demo with 10 tabs, 10 demo clients, and 88 simulated Mendi fNIRS sessions. No sign-up. No credit card. Synthetic data only.",
  robots: { index: true, follow: true },
};

const VALID_TABS = [
  "session", "game", "brain", "hrv", "progress", "ai", "protocols",
  "schedule", "reports", "compare",
] as const;
type MainTab = (typeof VALID_TABS)[number];

type SearchParamsRaw = { [key: string]: string | string[] | undefined };

function pickTab(candidate: string | undefined | null): MainTab | null {
  return candidate && (VALID_TABS as readonly string[]).includes(candidate)
    ? (candidate as MainTab)
    : null;
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const params = await searchParams;
  const raw = params.tab;
  const fromUrl = pickTab(Array.isArray(raw) ? raw[0] : raw);

  // If URL has no ?tab=, check the cookie. Some privacy browsers strip query
  // parameters they classify as tracking; the cookie survives that.
  let fromCookie: MainTab | null = null;
  if (!fromUrl) {
    const store = await cookies();
    fromCookie = pickTab(store.get("demo_tab")?.value);
  }

  const initialTab: MainTab = fromUrl ?? fromCookie ?? "session";
  return <DemoClient initialTab={initialTab} />;
}
