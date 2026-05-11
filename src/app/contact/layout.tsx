import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact · EEGBase",
  description:
    "Talk to EEGBase. Routed to the right inbox for clinicians, press, patients, and general inquiries. Same-day reply on weekdays.",
  alternates: { canonical: "/contact" },
  openGraph: {
    url: "https://eegbase.com/contact",
    title: "Contact · EEGBase",
    description:
      "Talk to EEGBase. Routed to the right inbox for clinicians, press, patients, and general inquiries.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
