export default function ProtocolDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 rounded-lg" style={{ background: "var(--border-default)" }} />
        <div className="flex-1">
          <div className="h-7 w-48 rounded mb-1" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-32 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
        <div className="h-9 w-28 rounded-lg" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="h-3 w-24 rounded mb-2" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-9 w-12 rounded" style={{ background: "var(--border-default)" }} />
          </div>
        ))}
      </div>

      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-48 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="h-28 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-5 w-36 rounded" style={{ background: "var(--border-default)" }} />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="h-4 w-28 rounded" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-4 w-16 rounded" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-4 w-14 rounded" style={{ background: "var(--surface-sunken)" }} />
            </div>
          ))}
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-36 rounded" style={{ background: "var(--border-default)" }} />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="h-4 w-32 rounded mb-1" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-3 w-24 rounded" style={{ background: "var(--surface-sunken)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
