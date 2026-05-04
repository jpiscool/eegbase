export default function ProtocolsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-28 rounded mb-2" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-36 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
        <div className="h-9 w-40 rounded-lg" style={{ background: "var(--border-default)" }} />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl px-6 py-4 flex items-start gap-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-48 rounded" style={{ background: "var(--border-default)" }} />
                <div className="h-4 w-16 rounded-full" style={{ background: "var(--surface-sunken)" }} />
                <div className="h-4 w-12 rounded" style={{ background: "var(--surface-sunken)" }} />
              </div>
              <div className="h-3 w-72 rounded" style={{ background: "var(--surface-sunken)" }} />
            </div>
            <div className="h-8 w-8 rounded-lg" style={{ background: "var(--surface-sunken)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
