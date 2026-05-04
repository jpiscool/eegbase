export default function SettingsLoading() {
  return (
    <div className="max-w-2xl animate-pulse">
      <div className="h-8 w-24 rounded mb-2" style={{ background: "var(--border-default)" }} />
      <div className="h-4 w-48 rounded mb-8" style={{ background: "var(--surface-sunken)" }} />

      {/* Clinic info */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-32 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded mb-2" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-5 w-40 rounded" style={{ background: "var(--border-default)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-28 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 rounded mb-2" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-9 w-full rounded-lg" style={{ background: "var(--surface-sunken)" }} />
            </div>
          ))}
          <div className="h-9 w-24 rounded-lg" style={{ background: "var(--border-default)" }} />
        </div>
      </div>

      {/* Password form */}
      <div className="rounded-xl p-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <div className="h-4 w-36 rounded mb-4" style={{ background: "var(--border-default)" }} />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 rounded mb-2" style={{ background: "var(--surface-sunken)" }} />
              <div className="h-9 w-full rounded-lg" style={{ background: "var(--surface-sunken)" }} />
            </div>
          ))}
          <div className="h-9 w-36 rounded-lg" style={{ background: "var(--border-default)" }} />
        </div>
      </div>
    </div>
  );
}
