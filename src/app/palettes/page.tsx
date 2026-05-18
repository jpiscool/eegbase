// Darker cream/taupe palette options, built around the new teal accent.
// Each tile is compact so all 5 fit in one screenshot.

const palettes = [
  { name: "1. Stone",       page: "#C9BDA0" },
  { name: "2. Mocha",       page: "#B5A88A" },
  { name: "3. Pale bronze", page: "#A89880" },
  { name: "4. Dark sand",   page: "#8B7E66" },
  { name: "5. Coffee",      page: "#6B5E48" },
];

const card = "#0F172A";
const cardBorder = "#1E293B";
const sidebar = "#1F1A12";
const teal = "#2DD4BF";

export default function PalettesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", padding: 24, fontFamily: "Geist, system-ui, sans-serif" }}>
      <h1 style={{ color: "#F1F5F9", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Darker palette options
      </h1>
      <p style={{ color: "#94A3B8", fontSize: 12, marginBottom: 16 }}>
        Built around the teal accent. Each tile: page bg + sidebar stripe + dark card.
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
              padding: "8px 12px", fontSize: 11, fontWeight: 600,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{p.name}</span>
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
                  <div style={{ color: "#1A1A1A", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    Clients
                  </div>
                  <div style={{ color: "rgba(0,0,0,0.55)", fontSize: 9, marginTop: 1 }}>
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
