export default function ReportLoading() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }} className="animate-pulse">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-40 rounded" style={{ background: "var(--border-default)" }} />
        </div>
        <div className="h-9 w-28 rounded-lg" style={{ background: "var(--border-default)" }} />
      </div>
      <div className="rounded-2xl p-10 space-y-8" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex justify-between pb-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="space-y-2">
            <div className="h-5 w-24 rounded" style={{ background: "var(--border-default)" }} />
            <div className="h-3 w-40 rounded" style={{ background: "var(--surface-sunken)" }} />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-28 rounded ml-auto" style={{ background: "var(--border-default)" }} />
            <div className="h-3 w-20 rounded ml-auto" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-3 w-32 rounded ml-auto" style={{ background: "var(--surface-sunken)" }} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-7 w-48 rounded" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-64 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 space-y-2" style={{ border: "1px solid var(--border-subtle)" }}>
              <div className="h-3 w-16 rounded" style={{ background: "var(--border-default)" }} />
              <div className="h-7 w-10 rounded" style={{ background: "var(--border-default)" }} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded" style={{ background: "var(--surface-sunken)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
