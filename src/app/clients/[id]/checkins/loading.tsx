export default function CheckInsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 rounded-lg" style={{ background: "var(--border-default)" }} />
        <div>
          <div className="h-6 w-48 rounded mb-1" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-32 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 rounded" style={{ background: "var(--border-default)" }} />
              <div className="h-8 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
            </div>
          ))}
          <div className="h-10 rounded-lg mt-2" style={{ background: "var(--border-default)" }} />
        </div>
        <div className="lg:col-span-2 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-40 rounded" style={{ background: "var(--border-default)" }} />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded" style={{ background: "var(--surface-sunken)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
