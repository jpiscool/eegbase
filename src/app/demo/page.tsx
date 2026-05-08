import type { Metadata } from "next";
import DemoShell from "./DemoShell";

// Server component — passes through the optional ?surface= URL param so a deep
// link can land on Patients or Session directly. Validation lives in the shell.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Demo · EEGBase",
  description:
    "The simplest neurofeedback clinic platform. Today, Patients, Session — three screens, no setup. Sample data only.",
  robots: { index: true, follow: true },
};

type SearchParamsRaw = { [key: string]: string | string[] | undefined };

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const params = await searchParams;
  const raw = params.surface;
  const surface = Array.isArray(raw) ? raw[0] : raw;
  const initialSurface =
    surface === "patients" || surface === "session" ? surface : "today";

  const rawClient = params.client;
  const initialClientId = Array.isArray(rawClient) ? rawClient[0] : rawClient;

  return <DemoShell initialSurface={initialSurface} initialClientId={initialClientId} />;
}
