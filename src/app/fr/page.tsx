import { redirect } from "next/navigation";

// /fr locale stub — full French translation ships Q3 2026.

export const metadata = {
  title: "EEGBase — Bientôt en français",
  description: "La couche clinique pour tout matériel de neurofeedback. Traduction française : T3 2026.",
  alternates: {
    languages: {
      en: "/",
      es: "/es",
      fr: "/fr",
    },
  },
};

export default function FrLanding() {
  redirect("/?lang=fr-pending");
}
