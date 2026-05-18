// 5 distinct page-bg color families that all pair with the teal accent.

const palettes = [
  { name: "1. Forest",     page: "#1F3A2E", desc: "Deep green — nature, calm" },
  { name: "2. Burgundy",   page: "#3F1E26", desc: "Wine — bold, premium" },
  { name: "3. Slate blue", page: "#1E2A3A", desc: "Classic, professional" },
  { name: "4. Aubergine",  page: "#2D1F38", desc: "Plum — luxurious" },
  { name: "5. Terracotta", page: "#3E261B", desc: "Warm clay — earthy" },
];

const card = "#0F172A";
const cardBorder = "#1E293B";
const sidebar = "#1F1A12";
const teal = "#2DD4BF";

export default function PalettesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", padding: 24, fontFamily: "Geist, system-ui, sans-serif" }}>
      <h1 style={{ color: "#F1F5F9", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Distinct palette options
      </h1>
      <p style={{ color: "#94A3B8", fontSize: 12, marginBottom: 16 }}>
        Different color families, all paired with the teal accent + dark slate cards.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {palettes.map((p) => (
          <div key={p.name} style={{
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid #334155",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            <div style={{
              background: "#0B1220", color: "#F1F5F9",
              padding: "8px 12px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 1 }}>{p.desc}</div>
              </div>
              <code style={{ color: "#94A3B8", fontSize: 9, fontFamily: "ui-monospace,monospace" }}>{p.page}</code>
            </div>

            <div style={{ background: p.page, height: 240, display: "flex" }}>
              <div style={{
                width: 36, background: sidebar,
                borderRight: "1px solid #3E3628", flexShrink: 0,
                display: "flex", flexDirection: "column",
                gap: 6, padding: "10px 0", alignItems: "center",
              }}>
                <div style={{ width: 20, height: 20, background: teal, borderRadius: 5 }} />
                <div style={{ width: 14, height: 2, background: "#3E3628", borderRadius: 1, marginTop: 4 }} />
                <div style={{ width: 14, height: 2, background: "#3E3628", borderRadius: 1 }} />
                <div style={{ width: 14, height: 2, background: "#3E3628", borderRadius: 1 }} />
              </div>

              <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    Clients
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, marginTop: 1 }}>
                    10 clients
                  </div>
                </div>

                <div style={{
                  background: card, border: `1px solid ${cardBorder}`,
                  borderRadius: 8, padding: 8, flex: 1,
                  display: "flex", flexDirection: "column", gap: 5,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#F1F5F9", fontSize: 9, fontWeight: 600 }}>Amara Okafor</div>
                      <div style={{ color: "#94A3B8", fontSize: 7 }}>2 sessions</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#F1F5F9", fontSize: 9, fontWeight: 600 }}>Daniel Kim</div>
                      <div style={{ color: "#94A3B8", fontSize: 7 }}>8 sessions</div>
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", textAlign: "center" }}>
                    <span style={{ background: "#0F766E", color: "white", fontSize: 8, fontWeight: 700, padding: "3px 8px", borderRadius: 5, display: "inline-block" }}>
                      + Add widget
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
