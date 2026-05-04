export default function SessionDetailLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-8 h-8 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
        <div>
          <div className="h-7 w-40 rounded mb-2" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-56 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="h-3 w-16 rounded mb-2" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-5 w-20 rounded" style={{ background: "var(--border-default)" }} />
          </div>
        ))}
      </div>

      {/* Pre/Post */}
      <div className="rounded-xl p-6 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-40 rounded mb-5" style={{ background: "var(--border-default)" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="flex-1 h-2 rounded-full" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-24 rounded" style={{ background: "var(--surface-sunken)" }} />
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-36 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded mb-2" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-5 w-32 rounded" style={{ background: "var(--border-default)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
