// Partner-logo strip with rolling animation. Used on landing.

const PARTNERS = [
  { name: "Mendi",        kind: "fNIRS hardware",   color: "#7C3AED" },
  { name: "Muse",          kind: "EEG hardware",    color: "#06B6D4" },
  { name: "Polar",         kind: "HRV",             color: "#EF4444" },
  { name: "Apple Health",  kind: "Wearables",       color: "#0F172A" },
  { name: "Oura",          kind: "Sleep · HRV",     color: "#A855F7" },
  { name: "Whoop",         kind: "Recovery",        color: "#10B981" },
  { name: "Anthropic",     kind: "AI · Claude",     color: "#D97706" },
  { name: "Stripe",        kind: "Billing",         color: "#635BFF" },
  { name: "Stedi",         kind: "Clearinghouse",   color: "#0EA5E9" },
  { name: "Daily.co",      kind: "HIPAA video",     color: "#F59E0B" },
  { name: "Coalfire",      kind: "SOC 2 audit",     color: "#16A34A" },
  { name: "Bishop Fox",    kind: "Pen-test",        color: "#DC2626" },
];

export function PartnerLogos() {
  // Duplicate so the loop wraps seamlessly
  const tape = [...PARTNERS, ...PARTNERS];
  return (
    <section className="max-w-6xl mx-auto px-6 pb-20">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-6">
        Built on the ecosystem clinicians already use
      </p>
      <div style={{ position: "relative", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
        <div className="flex gap-12 items-center" style={{ animation: "logo-marquee 36s linear infinite", width: "max-content" }}>
          <style>{`@keyframes logo-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
          {tape.map((p, i) => (
            <div key={`${p.name}-${i}`} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-100 bg-white/60" style={{ minWidth: 140, backdropFilter: "blur(8px)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <div>
                <div className="text-sm font-bold text-gray-900 leading-tight">{p.name}</div>
                <div className="text-[10px] text-gray-400">{p.kind}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
