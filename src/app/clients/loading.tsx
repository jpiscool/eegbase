export default function ClientsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-28 rounded mb-2" style={{ background: "var(--border-default)" }} />
          <div className="h-4 w-44 rounded" style={{ background: "var(--surface-sunken)" }} />
        </div>
        <div className="h-9 w-28 rounded-lg" style={{ background: "var(--border-default)" }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex gap-6 px-5 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
          {["Name", "Goals", "Sessions", "Email", "Added", "Status"].map((col) => (
            <div key={col} className="h-4 w-16 rounded" style={{ background: "var(--border-default)" }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-6 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="h-4 w-32 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-48 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-36 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-4 w-20 rounded" style={{ background: "var(--surface-sunken)" }} />
            <div className="h-5 w-14 rounded-full" style={{ background: "var(--surface-sunken)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
