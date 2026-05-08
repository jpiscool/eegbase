import type { MetadataRoute } from "next";

const BASE = "https://eegbase.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/demo`,                      lastModified: now, changeFrequency: "weekly",  priority: 0.95 },
    { url: `${BASE}/mendi`,                     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/mendi-clinical-preview`,    lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/privacy`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/terms`,                     lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/status`,                    lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/changelog`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/roadmap`,                   lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/community`,                 lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/docs`,                      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/docs/hipaa`,                lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/docs/mendi-sdk`,            lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
  return routes;
}
