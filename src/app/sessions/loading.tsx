export default function SessionsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-32 rounded mb-2" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-40 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
        <div className="h-9 w-36 rounded-lg" style={{ background: "var(--border-default)" }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex gap-6 px-5 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
          {["Client", "Protocol", "Date", "Duration", "Avg Reward", "Focus Δ"].map((col) => (
            <div key={col} className="h-4 w-16 rounded" style={{ background: "var(--border-default)" }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-6 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-32 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-40 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-28 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-16 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-12 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-12 rounded" style={{ background: "var(--surface-sunken)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
