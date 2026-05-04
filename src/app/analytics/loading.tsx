export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg" style={{ background: "var(--border-default)" }} />
        <div>
          <div className="h-7 w-28 rounded mb-1" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-64 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="h-3 w-20 rounded mb-3" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-8 w-16 rounded mb-1" style={{ background: "var(--border-default)" }} />
            <div className="h-3 w-24 rounded" style={{ background: "var(--surface-sunken)" }} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <div className="h-4 w-56 rounded mb-5" style={{ background: "var(--border-default)" }} />
          <div className="h-36 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
        </div>
        <div className="rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <div className="h-4 w-40 rounded mb-5" style={{ background: "var(--border-default)" }} />
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-7 rounded" style={{ background: "var(--surface-sunken)" }} />
                <div className="flex-1 h-4 rounded-full" style={{ background: "var(--surface-sunken)" }} />
                <div className="h-3 w-4 rounded" style={{ background: "var(--surface-sunken)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <div className="h-4 w-40 rounded mb-2" style={{ background: "var(--border-default)" }} />
          <div className="h-3 w-64 rounded mb-5" style={{ background: "var(--surface-sunken)" }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-6 w-16 rounded-full" style={{ background: "var(--surface-sunken)" }} />
            </div>
          ))}
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-36 rounded" style={{ background: "var(--border-default)" }} />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3">
              <div className="h-4 flex-1 rounded" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-5 w-20 rounded-full" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-4 w-10 rounded" style={{ background: "var(--surface-sunken)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
