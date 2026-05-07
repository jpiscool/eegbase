import DemoClient from "./DemoClient";

// Server component: reads ?tab= directly from the URL on every request and
// forwards the validated value to the client demo. This means the SSR HTML
// already renders the correct tab — no hydration flash from "session" to the
// requested tab when the user refreshes on /demo?tab=game.
//
// Marked dynamic so Next.js never serves a stale prerendered "session" HTML.
export const dynamic = "force-dynamic";

const VALID_TABS = [
  "session", "game", "brain", "hrv", "outcomes", "progress", "ai", "protocols",
  "schedule", "reports", "compare", "billing", "team", "compliance", "marketing", "devices",
] as const;
type MainTab = (typeof VALID_TABS)[number];

type SearchParamsRaw = { [key: string]: string | string[] | undefined };

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const params = await searchParams;
  const raw = params.tab;
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  const initialTab: MainTab =
    candidate && (VALID_TABS as readonly string[]).includes(candidate)
      ? (candidate as MainTab)
      : "session";

  return <DemoClient initialTab={initialTab} />;
}
