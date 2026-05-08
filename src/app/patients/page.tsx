import { AudienceLanding, type AudienceContent } from "@/components/AudienceLanding";

export const metadata = {
  title: "For patients & families · EEGBase",
  description: "Plain-language overview of how EEGBase + Mendi works at home and in the clinic.",
};

const C: AudienceContent = {
  eyebrow: "For patients + families",
  eyebrowColor: "#10B981",
  hero: { line1: "What it's like to use", line2: "EEGBase + Mendi at home", line2Color: "#10B981" },
  lede: "Your clinician sets a protocol. You wear a small headband at home for 20 minutes, 2–3 times a week. The app shows real-time feedback — like a video game where the goal is to keep your brain calm and focused. Your clinician sees your progress in their dashboard.",
  pillars: [
    { title: "20 minutes, at home",        desc: "A small lightweight headband (Mendi) measures blood flow to the front of your brain. Sit comfortably, headphones on, follow the on-screen feedback.",   color: "#10B981" },
    { title: "Your clinician stays involved", desc: "Weekly check-ins (in-person or telehealth). They see your sessions, adjust your protocol, and answer questions between visits.",                       color: "#06B6D4" },
    { title: "Your data is yours",          desc: "Recordings stay between you and your clinician. EEGBase is HIPAA-compliant. You can request deletion anytime.",                                          color: "#7C3AED" },
  ],
  features: [
    "Lightweight Mendi headband (~$299, often covered by HSA/FSA)",
    "20-minute sessions at home, 2–3 times per week",
    "Video-game-like feedback — no jargon, no homework",
    "Weekly clinician check-in (in-person or telehealth)",
    "PHQ-9 / GAD-7 / ADHD scales tracked over time",
    "Family-portal access for parents / spouses (with consent)",
    "Optional: Apple Health / Oura / Whoop passive data linkage",
    "Cancel anytime · your data stays yours",
  ],
  cta: { label: "Find a clinic near you →", href: "/clinic-finder" },
  secondaryCta: { label: "Read the science", href: "/research" },
  proofPoints: [
    { val: "20 min", lbl: "Per session" },
    { val: "2-3×",  lbl: "Per week" },
    { val: "8-12",  lbl: "Weeks typical protocol" },
  ],
  footnote: "EEGBase is software, not a medical device. Always work with a licensed clinician for diagnosis and treatment decisions.",
};

export default function PatientsPage() {
  return <AudienceLanding c={C} />;
}
