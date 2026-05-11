import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { GlobalCommandK } from "@/components/GlobalCommandK";
import { DeferredClientWidgets } from "@/components/DeferredClientWidgets";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

const SITE_URL = "https://eegbase.com";
const SITE_TITLE = "EEGBase — The clinical layer for any neurofeedback hardware";
const SITE_DESC =
  "Mendi at home, Muse in clinic, Polar HRV, and Apple Health become one client record, one SOAP note, one billable session. Free for licensed clinicians · BIDS-fNIRS / SNIRF / EDF+ export.";

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  manifest: "/manifest.json",
  applicationName: "EEGBase",
  keywords: [
    "neurofeedback", "fNIRS", "EEG", "Mendi", "clinician",
    "BIDS", "SNIRF", "EDF+", "HIPAA", "telehealth", "Muse", "Polar HRV",
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
  // canonical is intentionally omitted at the root so per-page metadata
  // can declare it without duplicating to the homepage. metadataBase
  // (above) makes per-page relative canonicals resolve against
  // https://eegbase.com.
  alternates: {
    languages: {
      en: SITE_URL,
      "x-default": SITE_URL,
      es: `${SITE_URL}/es`,
      fr: `${SITE_URL}/fr`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} h-full antialiased`}>
        {/* WCAG 2.4.1 — global skip link. Off-screen until keyboard-focused.
            Targets the #main-content landmark that every page provides. */}
        <a
          href="#main-content"
          className="absolute left-2 top-2 z-[9999] -translate-y-[200%] rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white no-underline transition-transform duration-150 focus:translate-y-0"
        >
          Skip to main content
        </a>
        {/* Schema.org JSON-LD · Organization + SoftwareApplication for SEO rich-results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}#org`,
                  name: "EEGBase",
                  url: SITE_URL,
                  logo: `${SITE_URL}/og-image.svg`,
                  description: SITE_DESC,
                  contactPoint: [
                    { "@type": "ContactPoint", email: "hello@eegbase.com", contactType: "customer support" },
                  ],
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": `${SITE_URL}#app`,
                  name: "EEGBase",
                  url: SITE_URL,
                  applicationCategory: "MedicalApplication",
                  operatingSystem: "Web",
                  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
                  publisher: { "@id": `${SITE_URL}#org` },
                },
              ],
            }),
          }}
        />
        {children}
        <GlobalCommandK />
        <DeferredClientWidgets />
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
