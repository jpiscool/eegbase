export default function ClientDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
        <div className="flex-1">
          <div className="h-7 w-48 rounded mb-2" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-64 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="h-3 w-24 rounded mb-3" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-8 w-16 rounded" style={{ background: "var(--border-default)" }} />
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-48 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="h-[180px] rounded-lg" style={{ background: "var(--surface-sunken)" }} />
      </div>

      {/* Session table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="h-5 w-36 rounded" style={{ background: "var(--border-default)" }} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-5 px-6 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-28 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-12 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-24 rounded" style={{ background: "var(--surface-sunken)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
