export default function MessagesLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-pulse">
      <div className="flex items-center gap-4 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="w-8 h-8 rounded-lg" style={{ background: "var(--border-default)" }} />
        <div>
          <div className="h-5 w-36 rounded mb-1" style={{ background: "var(--border-default)" }} />
          <div className="h-3 w-24 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
      </div>
      <div className="flex-1 rounded-xl mt-4 p-6 space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div
              className={`h-10 rounded-xl ${i % 2 === 0 ? "w-48" : "w-40"}`}
              style={{ background: i % 2 === 0 ? "var(--surface-sunken)" : "color-mix(in srgb, var(--brand) 12%, transparent)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
