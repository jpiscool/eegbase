import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { GlobalCommandK } from "@/components/GlobalCommandK";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

const SITE_URL = "https://eegbase.vercel.app";
const SITE_TITLE = "EEGBase — The clinical layer for any neurofeedback hardware";
const SITE_DESC =
  "Mendi at home, Muse in clinic, Polar HRV, and Apple Health become one client record, one SOAP note, one billable session. Open-source · MIT · BIDS-fNIRS / SNIRF / EDF+ export.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  applicationName: "EEGBase",
  keywords: [
    "neurofeedback", "fNIRS", "EEG", "Mendi", "clinician",
    "BIDS", "SNIRF", "EDF+", "HIPAA", "telehealth", "open source",
  ],
  authors: [{ name: "EEGBase" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EEGBase",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
    siteName: "EEGBase",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "EEGBase — clinical layer for neurofeedback hardware" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} h-full antialiased`}>
        {children}
        <GlobalCommandK />
        <InstallPwaPrompt />
        <CookieBanner />
        {PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
