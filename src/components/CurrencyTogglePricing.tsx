"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Approximate FX rates as of May 2026 (illustrative). In production these would
// come from a live FX API or be set per-region.
const RATES: Record<string, { sym: string; rate: number; sub?: string }> = {
  USD: { sym: "$",  rate: 1.00,  sub: "United States" },
  EUR: { sym: "€",  rate: 0.92,  sub: "Eurozone" },
  GBP: { sym: "£",  rate: 0.78,  sub: "United Kingdom" },
  CAD: { sym: "C$", rate: 1.36,  sub: "Canada" },
  AUD: { sym: "A$", rate: 1.51,  sub: "Australia" },
};

const STORAGE_KEY = "eegbase-currency";

const TIERS = [
  { tier: "Solo",       priceUSD: 19,   unit: "per session",   sub: "No commitment · trial-friendly", popular: false },
  { tier: "Practice",   priceUSD: 349,  unit: "per clinic / mo", sub: "5 clinicians · unlimited clients", popular: true },
  { tier: "Enterprise", priceUSD: null, unit: "white-label · SLA", sub: "Mendi-attached: 20% off · DPA · SSO", popular: false },
];

export function CurrencyTogglePricing() {
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && RATES[saved]) setCurrency(saved);
  }, []);

  function pick(c: string) {
    setCurrency(c);
    try { localStorage.setItem(STORAGE_KEY, c); } catch {}
  }

  const r = RATES[currency];
  const fmt = (usd: number) => {
    const v = usd * r.rate;
    return `${r.sym}${Math.round(v).toLocaleString("en-US")}`;
  };

  return (
    <div>
      {/* Currency picker */}
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Currency:</span>
        {Object.keys(RATES).map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${currency === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            aria-pressed={currency === c}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {TIERS.map((t) => (
          <div
            key={t.tier}
            className={`relative bg-white border-2 rounded-2xl p-6 ${t.popular ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200"}`}
          >
            {t.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">Most popular</span>
            )}
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t.tier}</p>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1 tabular-nums">
              {t.priceUSD === null ? "Custom" : fmt(t.priceUSD)}
            </p>
            <p className="text-xs text-gray-500 mb-3">{t.unit}</p>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">{t.sub}</p>
            <Link
              href="/demo"
              className={`block text-center text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors ${
                t.popular ? "bg-blue-600 text-white hover:bg-blue-700"
                : t.tier === "Enterprise" ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t.tier === "Enterprise" ? "Talk to us" : "Start free trial"}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        Prices in {currency} ({r.sub}) · 30-day free trial · no card required · HIPAA BAA · BIDS/SNIRF/EDF+ export · cancel anytime
      </p>
      {currency !== "USD" && (
        <p className="text-[11px] text-gray-300 text-center mt-1">
          FX rates are illustrative · billing happens in USD; your bank converts at its rate
        </p>
      )}
    </div>
  );
}
