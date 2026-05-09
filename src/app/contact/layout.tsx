import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact · EEGBase",
  description:
    "Talk to EEGBase. Routed to clinician, partner, press, investor, patient, security, or research inboxes. Same-day reply on weekdays.",
  alternates: { canonical: "/contact" },
  openGraph: {
    url: "https://eegbase.com/contact",
    title: "Contact · EEGBase",
    description:
      "Talk to EEGBase. Routed to clinician, partner, press, investor, patient, security, or research inboxes.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
