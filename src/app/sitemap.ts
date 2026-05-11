import type { MetadataRoute } from "next";

const BASE = "https://eegbase.com";

// All public marketing routes that return 200 to anonymous visitors.
// /docs, /docs/*, /community are auth-gated (307 → /login) and therefore
// excluded — submitting them to Search Console would generate "soft 404"
// crawl errors.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; freq: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "/",                          freq: "weekly",  priority: 1.0 },
    { path: "/demo",                      freq: "weekly",  priority: 0.95 },
    { path: "/mendi",                     freq: "monthly", priority: 0.9 },
    { path: "/mendi-clinical-preview",    freq: "monthly", priority: 0.85 },
    { path: "/mendi-sdk",                 freq: "monthly", priority: 0.7 },
    { path: "/pricing",                   freq: "monthly", priority: 0.85 },
    { path: "/contact",                   freq: "monthly", priority: 0.85 },
    { path: "/faq",                       freq: "monthly", priority: 0.8 },
    { path: "/clinicians",                freq: "monthly", priority: 0.85 },
    { path: "/researchers",               freq: "monthly", priority: 0.8 },
    { path: "/developers",                freq: "monthly", priority: 0.8 },
    { path: "/investors",                 freq: "monthly", priority: 0.7 },
    { path: "/patients",                  freq: "monthly", priority: 0.7 },
    { path: "/partners",                  freq: "monthly", priority: 0.7 },
    { path: "/enterprise",                freq: "monthly", priority: 0.7 },
    { path: "/team",                      freq: "monthly", priority: 0.6 },
    { path: "/careers",                   freq: "monthly", priority: 0.7 },
    { path: "/case-studies",              freq: "monthly", priority: 0.75 },
    { path: "/blog",                      freq: "weekly",  priority: 0.7 },
    { path: "/roadmap",                   freq: "weekly",  priority: 0.7 },
    { path: "/vs",                        freq: "monthly", priority: 0.7 },
    { path: "/conditions",                freq: "monthly", priority: 0.7 },
    { path: "/clinic-finder",             freq: "monthly", priority: 0.7 },
    { path: "/glossary",                  freq: "monthly", priority: 0.6 },
    { path: "/security",                  freq: "monthly", priority: 0.7 },
    { path: "/trust-center",              freq: "monthly", priority: 0.7 },
    { path: "/privacy",                   freq: "yearly",  priority: 0.5 },
    { path: "/terms",                     freq: "yearly",  priority: 0.5 },
    { path: "/status",                    freq: "daily",   priority: 0.6 },
    { path: "/downloads",                 freq: "monthly", priority: 0.6 },
    { path: "/brand-assets",              freq: "monthly", priority: 0.5 },
    { path: "/office-hours",              freq: "monthly", priority: 0.5 },
    { path: "/integrations",              freq: "monthly", priority: 0.6 },
    { path: "/devices",                   freq: "monthly", priority: 0.6 },
    { path: "/calculators",               freq: "monthly", priority: 0.5 },
    { path: "/protocols/marketplace",     freq: "monthly", priority: 0.6 },
    { path: "/resources",                 freq: "monthly", priority: 0.6 },
  ];

  // /vs/[slug] static comparison pages
  const vsSlugs = ["simplepractice", "therapynotes", "myndlift", "brainmaster", "cygnet", "bioexplorer", "neuroguide", "divergence-neuro"];
  const vsRoutes = vsSlugs.map((slug) => ({ path: `/vs/${slug}`, freq: "monthly" as const, priority: 0.65 }));

  // /conditions/[slug] static condition pages
  const conditionSlugs = ["adhd"];
  const conditionRoutes = conditionSlugs.map((slug) => ({ path: `/conditions/${slug}`, freq: "monthly" as const, priority: 0.65 }));

  return [...routes, ...vsRoutes, ...conditionRoutes].map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
