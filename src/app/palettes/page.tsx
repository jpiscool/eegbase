// 20 distinct premium page-bg color families, all paired with the teal accent.

const palettes = [
  { name: "1. Forest",        page: "#1F3A2E", desc: "Deep green · calm" },
  { name: "2. Burgundy",      page: "#3F1E26", desc: "Wine · bold" },
  { name: "3. Slate navy",    page: "#1E2A3A", desc: "Classic, professional" },
  { name: "4. Aubergine",     page: "#2D1F38", desc: "Plum · luxurious" },
  { name: "5. Terracotta",    page: "#3E261B", desc: "Warm clay · earthy" },
  { name: "6. Espresso",      page: "#2C1F14", desc: "Coffee · rich" },
  { name: "7. Midnight",      page: "#0F1F35", desc: "Deep navy" },
  { name: "8. Charcoal",      page: "#1A1A1A", desc: "Pure minimalist" },
  { name: "9. Olive",         page: "#2E331E", desc: "Earthy green" },
  { name: "10. Plum",         page: "#3A1F2E", desc: "Berry · feminine" },
  { name: "11. Deep teal",    page: "#0A2222", desc: "Same family as accent" },
  { name: "12. Rust",         page: "#4A2415", desc: "Burnt sienna" },
  { name: "13. Mushroom",     page: "#2E2A26", desc: "Warm taupe-grey" },
  { name: "14. Graphite",     page: "#232629", desc: "Industrial" },
  { name: "15. Maritime",     page: "#15243A", desc: "Navy-blue blend" },
  { name: "16. Ink",          page: "#0F0F0F", desc: "Near pure black" },
  { name: "17. Cocoa",        page: "#281A14", desc: "Chocolate brown" },
  { name: "18. Steel",        page: "#2A2E33", desc: "Cool grey" },
  { name: "19. Pine",         page: "#16302B", desc: "Dark evergreen" },
  { name: "20. Obsidian",     page: "#1C1E26", desc: "Smoky black" },
];

const card = "#0F172A";
const cardBorder = "#1E293B";
const sidebar = "#1F1A12";
const teal = "#2DD4BF";

export default function PalettesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", padding: 24, fontFamily: "Geist, system-ui, sans-serif" }}>
      <h1 style={{ color: "#F1F5F9", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
        20 premium palette options
      </h1>
      <p style={{ color: "#94A3B8", fontSize: 12, marginBottom: 20 }}>
        Distinct color families. All paired with the teal accent + dark slate cards.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {palettes.map((p) => (
          <div key={p.name} style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #2A2A2A",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}>
            <div style={{
              background: "#0B1220", color: "#F1F5F9",
              padding: "7px 10px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.desc}</div>
              </div>
              <code style={{ color: "#94A3B8", fontSize: 9, fontFamily: "ui-monospace,monospace", marginLeft: 6, flexShrink: 0 }}>{p.page}</code>
            </div>

            <div style={{ background: p.page, height: 180, display: "flex" }}>
              <div style={{
                width: 30, background: sidebar,
                borderRight: "1px solid #3E3628", flexShrink: 0,
                display: "flex", flexDirection: "column",
                gap: 5, padding: "8px 0", alignItems: "center",
              }}>
                <div style={{ width: 16, height: 16, background: teal, borderRadius: 4 }} />
                <div style={{ width: 12, height: 2, background: "#3E3628", borderRadius: 1, marginTop: 3 }} />
                <div style={{ width: 12, height: 2, background: "#3E3628", borderRadius: 1 }} />
              </div>

              <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <div style={{ color: "#F1F5F9", fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    Clients
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 8, marginTop: 1 }}>
                    10 clients
                  </div>
                </div>

                <div style={{
                  background: card, border: `1px solid ${cardBorder}`,
                  borderRadius: 6, padding: 6, flex: 1,
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#F1F5F9", fontSize: 8, fontWeight: 600 }}>Amara Okafor</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#F1F5F9", fontSize: 8, fontWeight: 600 }}>Daniel Kim</div>
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", textAlign: "center" }}>
                    <span style={{ background: "#0F766E", color: "white", fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>
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
