export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-40 rounded mb-2" style={{ background: "var(--border-default)" }} />
      <div className="h-4 w-56 rounded mb-8" style={{ background: "var(--surface-sunken)" }} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5 flex items-center gap-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="w-9 h-9 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
            <div>
              <div className="h-3 w-24 rounded mb-2" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-7 w-12 rounded" style={{ background: "var(--border-default)" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart skeleton */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-52 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="h-[120px] rounded-lg" style={{ background: "var(--surface-sunken)" }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="h-5 w-36 rounded" style={{ background: "var(--border-default)" }} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-6 px-6 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-32 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-24 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-16 rounded" style={{ background: "var(--surface-sunken)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
