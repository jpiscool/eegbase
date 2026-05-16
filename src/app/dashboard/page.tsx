import type { Metadata } from "next";
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

export default async function DashboardPage() {
  // Logged-in clinician path is stripped to the Dashboard tab only while
  // we validate each tier against real Mendi hardware. See
  // scripts/mendi-capture/live-site-test-priorities.md.
  // The public /demo route keeps the full tab surface.
  // ?tab=...  + the demo_tab cookie are intentionally ignored here — once
  // we restore additional tabs we'll re-enable the URL-driven routing.
  return <DemoClient initialTab="dashboard" appMode="strip" />;
}
