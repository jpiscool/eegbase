// Visual cream palette comparison — temporary page for design review.
// Each tile shows: cream page bg + dark slate card + warm charcoal sidebar
// stripe + sample text + a teal CTA so you can compare side by side.

const palettes = [
  { name: "1. Warm cream (current)",   page: "#FAF7EE", sunken: "#F4EFE0" },
  { name: "2. Warm linen",             page: "#F4EFE0", sunken: "#ECE5CC" },
  { name: "3. Soft sand (recommended)", page: "#EEE7D3", sunken: "#E4DBC1" },
  { name: "4. Bone / aged paper",      page: "#E8DFC7", sunken: "#DDD2B6" },
  { name: "5. Warm taupe",             page: "#D9CFB4", sunken: "#CFC4A4" },
  { name: "6. Vintage parchment",      page: "#EFE9D4", sunken: "#E4DCBF" },
];

const card = "#0F172A";
const cardBorder = "#1E293B";
const sidebar = "#1F1A12";
const teal = "#2DD4BF";

export default function PalettesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#222", padding: 32, fontFamily: "Geist, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ color: "#F1F5F9", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Cream palette options
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 24 }}>
          Each tile shows: page bg + dark sidebar stripe + dark slate card with sample content.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {palettes.map((p) => (
            <div key={p.name} style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #334155",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              {/* Label bar */}
              <div style={{
                background: "#0B1220",
                color: "#F1F5F9",
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span>{p.name}</span>
                <code style={{ color: "#94A3B8", fontSize: 11, fontFamily: "ui-monospace,monospace" }}>{p.page}</code>
              </div>

              {/* Mock app layout */}
              <div style={{ background: p.page, height: 280, display: "flex" }}>
                {/* Sidebar stripe */}
                <div style={{
                  width: 48,
                  background: sidebar,
                  borderRight: "1px solid #3E3628",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "12px 0",
                  alignItems: "center",
                }}>
                  <div style={{ width: 24, height: 24, background: teal, borderRadius: 6 }} />
                  <div style={{ width: 16, height: 2, background: "#3E3628", borderRadius: 1, marginTop: 6 }} />
                  <div style={{ width: 16, height: 2, background: "#3E3628", borderRadius: 1 }} />
                  <div style={{ width: 16, height: 2, background: "#3E3628", borderRadius: 1 }} />
                </div>

                {/* Content area with dark card */}
                <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Page heading (dark on cream) */}
                  <div>
                    <div style={{ color: "#1A1A1A", fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>
                      Clients
                    </div>
                    <div style={{ color: "#7A7268", fontSize: 11, marginTop: 2 }}>
                      10 clients
                    </div>
                  </div>

                  {/* Dark card */}
                  <div style={{
                    background: card,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 10,
                    padding: 12,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#F1F5F9", fontSize: 11, fontWeight: 600 }}>Amara Okafor</div>
                        <div style={{ color: "#94A3B8", fontSize: 9 }}>2 sessions · 2w ago</div>
                      </div>
                      <div style={{ background: teal, color: "#022922", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                        Start
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#F1F5F9", fontSize: 11, fontWeight: 600 }}>Daniel Kim</div>
                        <div style={{ color: "#94A3B8", fontSize: 9 }}>8 sessions · 2w ago</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#F1F5F9", fontSize: 11, fontWeight: 600 }}>Elena Vasquez</div>
                        <div style={{ color: "#94A3B8", fontSize: 9 }}>18 sessions · 2w ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
