import { redirect } from "next/navigation";

// /es locale stub — full Spanish translation ships Q3 2026.
// For now we redirect to the English landing with a notice.
// hreflang tags in layout.tsx tell crawlers this is the Spanish entry point.

export const metadata = {
  title: "EEGBase — Próximamente en español",
  description: "La capa clínica para cualquier hardware de neurofeedback. Traducción al español: Q3 2026.",
  alternates: {
    languages: {
      en: "/",
      es: "/es",
      fr: "/fr",
    },
  },
};

export default function EsLanding() {
  // Redirect to English with a parameter so we can show a banner if needed
  redirect("/?lang=es-pending");
}
