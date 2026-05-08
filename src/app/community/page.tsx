"use client";

import { useState } from "react";
import { ExternalLink, Eye, MessageSquare, Globe, Download, Star, Tag } from "lucide-react";
import Link from "next/link";

// ── Protocol Exchange data ───────────────────────────────────────────────────

const PROTOCOLS = [
  {
    name: "fNIRS Prefrontal Alpha Upregulation v2",
    author: "Dr. Miriam Osei-Bonsu",
    downloads: 247,
    rating: 4.8,
    tags: ["fNIRS", "Alpha", "Prefrontal"],
  },
  {
    name: "ADHD Delta/Theta Suppression Protocol",
    author: "Dr. Liam Ashford",
    downloads: 389,
    rating: 4.6,
    tags: ["ADHD", "Delta", "Theta", "Suppression"],
  },
  {
    name: "Sleep Onset Alpha Enhancement",
    author: "Dr. Priya Ravenscroft",
    downloads: 178,
    rating: 4.5,
    tags: ["Sleep", "Alpha", "Enhancement"],
  },
  {
    name: "Peak Performance Beta Training",
    author: "Dr. Callum Vega",
    downloads: 312,
    rating: 4.7,
    tags: ["Beta", "Performance", "Cognitive"],
  },
  {
    name: "Anxiety SMR Protocol",
    author: "Dr. Esme Thatcher",
    downloads: 204,
    rating: 4.4,
    tags: ["Anxiety", "SMR", "Relaxation"],
  },
];

// ── Clinical Discussion data ─────────────────────────────────────────────────

const THREADS = [
  {
    title: "Alpha-theta protocol outcomes in PTSD — 3-month follow-up",
    excerpt:
      "Sharing results from a small n=12 cohort. All clients showed statistically significant reductions in PCL-5 scores by week 8. Happy to share the full protocol parameter set.",
    replies: 18,
    lastActive: "2 hours ago",
    category: "Clinical Cases",
  },
  {
    title: "Anyone using SMR training for pediatric ADHD? Sharing my parameter set",
    excerpt:
      "I've been running SMR uptraining at 12–15 Hz with a reward threshold of 60 for the past six months across 14 paediatric clients. Results are promising — keen to compare notes.",
    replies: 29,
    lastActive: "Yesterday",
    category: "Protocol Sharing",
  },
  {
    title: "Mendi BLE dropout on iOS 17.4 — workaround found",
    excerpt:
      "After several support tickets and a lot of trial and error, the fix is to disable Background App Refresh for Mendi specifically. Full steps inside.",
    replies: 34,
    lastActive: "3 days ago",
    category: "Device Support",
  },
];

// ── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "Q3 2026", label: "Public launch" },
  { value: "Pre-launch", label: "Waitlist open" },
  { value: "MIT", label: "Open source" },
];

// ── Professional Resources ────────────────────────────────────────────────────

const RESOURCES = [
  {
    name: "ISNR",
    fullName: "International Society for Neuroregulation & Research",
    url: "https://isnr.org",
  },
  {
    name: "AAPB",
    fullName: "Association for Applied Psychophysiology and Biofeedback",
    url: "https://aapb.org",
  },
  {
    name: "BCIA",
    fullName: "Biofeedback Certification International Alliance",
    url: "https://bcia.org",
  },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star
        size={12}
        fill="currentColor"
        style={{ color: "#F59E0B" }}
      />
      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ── Newsletter form (needs state — reason for "use client") ───────────────────

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="px-6 py-4 rounded-xl text-center"
        style={{
          background: "var(--success-subtle)",
          border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)",
        }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
          You're subscribed.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--success)" }}>
          We'll send clinical updates and community highlights to{" "}
          <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{
          background: "var(--surface-sunken)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
          // @ts-expect-error CSS custom property
          "--tw-ring-color": "var(--brand)",
        }}
      />
      <button
        type="submit"
        className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all shrink-0"
        style={{
          background: "var(--brand)",
          color: "var(--text-inverse)",
          boxShadow: "0 1px 4px color-mix(in srgb, var(--brand) 35%, transparent)",
        }}
      >
        Subscribe
      </button>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">

      {/* ── Hero ── */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            EEGBase Community
          </h1>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: "var(--warning-subtle)",
              color: "var(--warning)",
            }}
          >
            Launching Q3 2026
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Share protocols, discuss clinical cases, and connect with neurofeedback practitioners
          worldwide.
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-4 text-center"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <p
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {s.value}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Honest-disclosure banner */}
      <div
        className="rounded-xl border p-4 flex items-start gap-3"
        style={{
          background: "var(--warning-subtle)",
          borderColor: "color-mix(in srgb, var(--warning) 30%, transparent)",
        }}
      >
        <span style={{ fontSize: 18 }}>ⓘ</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
            Preview content
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--warning)" }}>
            The protocols, discussions, downloads, and ratings shown below are illustrative examples of what the community will look like at launch. They are <strong>not</strong> real clinician contributions yet — no clinicians have submitted protocols and no sessions have been logged. We'll replace this with real content once the community goes live.
          </p>
        </div>
      </div>

      {/* ── Protocol Exchange ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Protocol Exchange <span style={{ fontSize: 10, color: "var(--warning)", marginLeft: 6 }}>· example</span>
          </h2>
          <Link
            href="/protocols/marketplace"
            className="text-xs hover:underline"
            style={{ color: "var(--brand)" }}
          >
            Browse all →
          </Link>
        </div>

        <div className="space-y-3">
          {PROTOCOLS.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border p-5 flex items-start gap-4"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold mb-0.5 leading-snug"
                  style={{ color: "var(--text-primary)" }}
                >
                  {p.name}
                </p>
                <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                  by {p.author}
                </p>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: "var(--brand-subtle)",
                        color: "var(--brand)",
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Meta */}
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <span className="flex items-center gap-1">
                    <Download size={11} />
                    {p.downloads.toLocaleString()} downloads
                  </span>
                  <StarRating rating={p.rating} />
                </div>
              </div>

              {/* Download CTA */}
              <Link
                href="/protocols/marketplace"
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-all"
                style={{
                  borderColor: "var(--brand)",
                  color: "var(--brand)",
                  background: "var(--brand-subtle)",
                }}
              >
                <Download size={13} />
                Download
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Clinical Discussion ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Clinical Discussion <span style={{ fontSize: 10, color: "var(--warning)", marginLeft: 6 }}>· example</span>
          </h2>
          <Link
            href="/community"
            className="text-xs hover:underline"
            style={{ color: "var(--brand)" }}
          >
            All threads →
          </Link>
        </div>

        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {THREADS.map((t, i) => (
            <Link
              key={t.title}
              href="/community"
              className="block px-5 py-4 transition-colors hover:opacity-80"
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-start gap-4">
                <MessageSquare
                  size={15}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--border-strong)" }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-snug mb-1"
                    style={{ color: "var(--brand)" }}
                  >
                    {t.title}
                  </p>
                  <p
                    className="text-xs leading-relaxed line-clamp-2 mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t.excerpt}
                  </p>
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--brand-subtle)",
                        color: "var(--brand)",
                      }}
                    >
                      {t.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} />
                      {t.replies} replies
                    </span>
                    <span>Active {t.lastActive}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Professional Resources ── */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          Professional Resources
        </h2>
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {RESOURCES.map((r, i) => (
            <a
              key={r.name}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-5 py-4 transition-opacity hover:opacity-80"
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <Globe size={16} className="shrink-0" style={{ color: "var(--brand)" }} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {r.name}
                </span>
                <span className="text-sm ml-2" style={{ color: "var(--text-secondary)" }}>
                  — {r.fullName}
                </span>
              </div>
              <ExternalLink size={14} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
            </a>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section
        className="rounded-2xl px-8 py-10 text-center"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-4"
          style={{
            background: "var(--brand-subtle)",
            color: "var(--brand)",
          }}
        >
          Stay informed
        </span>

        <h2
          className="text-xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Join the Newsletter
        </h2>
        <p
          className="text-sm mb-6 max-w-sm mx-auto leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Clinical updates, new community protocols, and neurofeedback research — straight to your
          inbox. No spam.
        </p>

        <NewsletterForm />
      </section>
    </div>
  );
}
