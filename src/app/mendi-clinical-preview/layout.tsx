import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mendi Clinical Preview · EEGBase",
  description:
    "Visceral white-label preview of what 'Mendi Clinical', powered by EEGBase, would look like. Side-by-side dashboard mockup for the partnership pitch.",
  alternates: { canonical: "/mendi-clinical-preview" },
  openGraph: {
    url: "https://eegbase.com/mendi-clinical-preview",
    title: "Mendi Clinical Preview · EEGBase",
    description:
      "Visceral white-label preview of 'Mendi Clinical' powered by EEGBase — for the partnership pitch.",
  },
};

export default function MendiClinicalPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
