"use client";

// Phase 29 — iOS Lock-Screen widget mockup. Demonstrates "EEGBase works
// on your wrist & lock screen" claim without actually building native
// widgets. Pure SVG, no animation, no JS dependencies.
//
// Visitor sees an iPhone-frame mockup with lock-screen showing 3 widgets:
// time, weather, EEGBase streak. Below: a brief copy block + an iOS-style
// "wake reminder set for 7:30 AM" pill. The card is visual-first — it
// sells the promise that the platform meets you where you live, not in
// a separate app you have to remember to open.

export function LockScreenPreview() {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">On your lock screen</h2>
        <p className="text-xs text-gray-400">Coming this summer</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        {/* iPhone mockup */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 200 410" width={160} height={328} aria-hidden role="img">
            {/* Phone frame */}
            <rect x="2" y="2" width="196" height="406" rx="36" ry="36" fill="#0F172A" />
            <rect x="6" y="6" width="188" height="398" rx="32" ry="32" fill="#1E293B" />
            {/* Wallpaper gradient */}
            <defs>
              <linearGradient id="lsp-wall" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E1B4B" />
                <stop offset="50%" stopColor="#3B0764" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="188" height="398" rx="32" ry="32" fill="url(#lsp-wall)" />
            {/* Notch / island */}
            <rect x="78" y="14" width="44" height="14" rx="7" fill="#000" />
            {/* Time */}
            <text x="100" y="92" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="44" fontWeight="200" fill="#fff" letterSpacing="-2">7:38</text>
            <text x="100" y="116" textAnchor="middle" fontFamily="system-ui" fontSize="11" fill="#C4B5FD" letterSpacing="0.5">Friday, May 9</text>

            {/* EEGBase streak widget */}
            <g transform="translate(20 156)">
              <rect width="160" height="68" rx="14" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
              <rect x="10" y="10" width="22" height="22" rx="6" fill="#2563EB" />
              <text x="21" y="27" textAnchor="middle" fontFamily="system-ui" fontSize="11" fontWeight="700" fill="#fff">EB</text>
              <text x="40" y="22" fontFamily="system-ui" fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.5">EEGBASE</text>
              <text x="40" y="37" fontFamily="system-ui" fontSize="13" fontWeight="600" fill="#fff">6-day streak 🔥</text>
              <text x="10" y="58" fontFamily="system-ui" fontSize="10" fill="#C4B5FD">Train tonight to make it 7</text>
            </g>

            {/* Weather widget */}
            <g transform="translate(20 232)">
              <rect width="76" height="48" rx="12" fill="rgba(255,255,255,0.10)" />
              <text x="10" y="20" fontFamily="system-ui" fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.5">SF</text>
              <text x="10" y="38" fontFamily="system-ui" fontSize="18" fontWeight="600" fill="#fff">62°</text>
            </g>

            {/* Calendar widget */}
            <g transform="translate(104 232)">
              <rect width="76" height="48" rx="12" fill="rgba(255,255,255,0.10)" />
              <text x="10" y="20" fontFamily="system-ui" fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.5">NEXT</text>
              <text x="10" y="35" fontFamily="system-ui" fontSize="10" fill="#fff">Sarah · 2pm</text>
            </g>

            {/* Bottom pill / hint */}
            <text x="100" y="378" textAnchor="middle" fontFamily="system-ui" fontSize="9" fill="rgba(255,255,255,0.5)">swipe up to open</text>
          </svg>
        </div>

        {/* Copy + reminder */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-base text-gray-800 leading-relaxed mb-3">
            Your streak shows up where your eyes already are — without opening another app.
            One glance: <span className="font-semibold text-gray-900">six days, train tonight to make it seven.</span>
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Apple Watch complication ships in the same release. Both opt-in.
            Both silent — no buzzing, no streak-loss alerts, no shame.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-700">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Wake reminder set · 7:30 AM
          </div>
        </div>
      </div>
    </section>
  );
}
