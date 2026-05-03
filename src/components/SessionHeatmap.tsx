"use client";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = 16;

interface Props {
  sessionDates: Date[];
}

export function SessionHeatmap({ sessionDates }: Props) {
  // Build a set of date strings YYYY-MM-DD for sessions
  const sessionSet = new Set(
    sessionDates.map((d) => {
      const dt = new Date(d);
      return dt.toISOString().split("T")[0];
    })
  );

  // Build grid: columns = weeks (oldest left), rows = Mon-Sun
  // Start from (WEEKS * 7) days ago, aligned to Monday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Find the most recent Monday
  const dow = today.getDay(); // 0=Sun, 1=Mon..
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(lastMonday.getDate() - daysToMonday);

  // Grid[col][row]: col=week (0=oldest), row=day (0=Mon)
  const grid: Array<Array<{ date: Date; dateStr: string }>> = [];
  for (let col = WEEKS - 1; col >= 0; col--) {
    const weekStart = new Date(lastMonday);
    weekStart.setDate(weekStart.getDate() - col * 7);
    const week: Array<{ date: Date; dateStr: string }> = [];
    for (let row = 0; row < 7; row++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + row);
      week.push({ date: d, dateStr: d.toISOString().split("T")[0] });
    }
    grid.push(week);
  }

  // Month labels: find first column for each month
  const monthLabels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  grid.forEach((week, col) => {
    const m = week[0].date.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        col,
        label: week[0].date.toLocaleDateString("en-US", { month: "short" }),
      });
      lastMonth = m;
    }
  });

  return (
    <div>
      {/* Month labels */}
      <div className="flex mb-1" style={{ paddingLeft: 32 }}>
        {grid.map((_, col) => {
          const ml = monthLabels.find((m) => m.col === col);
          return (
            <div key={col} className="text-xs text-gray-400" style={{ width: 14, minWidth: 14, marginRight: 2 }}>
              {ml ? ml.label : ""}
            </div>
          );
        })}
      </div>
      {/* Grid rows */}
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col mr-1" style={{ gap: 2 }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className="text-xs text-gray-400 flex items-center justify-end"
              style={{ height: 12, lineHeight: "12px", width: 28, fontSize: 9 }}
            >
              {i % 2 === 0 ? label : ""}
            </div>
          ))}
        </div>
        {/* Cells */}
        <div className="flex" style={{ gap: 2 }}>
          {grid.map((week, col) => (
            <div key={col} className="flex flex-col" style={{ gap: 2 }}>
              {week.map(({ date, dateStr }) => {
                const hasSession = sessionSet.has(dateStr);
                const isToday = dateStr === today.toISOString().split("T")[0];
                const isFuture = date > today;
                return (
                  <div
                    key={dateStr}
                    title={`${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}${hasSession ? " · session" : ""}`}
                    className="rounded-sm"
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: isFuture
                        ? "transparent"
                        : hasSession
                        ? "#2563EB"
                        : "#E5E7EB",
                      border: isToday ? "1.5px solid #2563EB" : "none",
                      opacity: isFuture ? 0 : 1,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-gray-400">Less</span>
        {["#E5E7EB", "#93C5FD", "#2563EB"].map((c) => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  );
}
