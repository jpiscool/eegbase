import type { Metadata } from "next";
import { cookies } from "next/headers";
import DemoClient from "../demo/DemoClient";

// The clinician home renders the polished DemoClient (same component as
// /demo) so the authenticated workspace and the public preview share one
// surface. Default tab is "dashboard" — the composable widget grid that
// pulls live from whichever devices are paired.
//
// `?tab=` overrides the default; otherwise we fall back to the `demo_tab`
// cookie so privacy browsers that strip query params still land where
// the user left off.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard · EEGBase",
  description: "Your clinical workspace.",
  robots: { index: false, follow: false },
};

const VALID_TABS = [
  "dashboard", "session", "game", "brain", "hrv", "progress", "ai", "protocols",
  "schedule", "reports", "compare",
] as const;
type MainTab = (typeof VALID_TABS)[number];

type SearchParamsRaw = { [key: string]: string | string[] | undefined };

function pickTab(candidate: string | undefined | null): MainTab | null {
  return candidate && (VALID_TABS as readonly string[]).includes(candidate)
    ? (candidate as MainTab)
    : null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const params = await searchParams;
  const raw = params.tab;
  const fromUrl = pickTab(Array.isArray(raw) ? raw[0] : raw);

  let fromCookie: MainTab | null = null;
  if (!fromUrl) {
    const store = await cookies();
    fromCookie = pickTab(store.get("demo_tab")?.value);
  }

  const initialTab: MainTab = fromUrl ?? fromCookie ?? "dashboard";
  return <DemoClient initialTab={initialTab} />;
}
