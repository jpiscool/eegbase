"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  WIDGET_CATALOG,
  WidgetCard,
  WidgetPicker,
  DashboardEmptyState,
  type WidgetCtx,
} from "@/app/demo/_dashboard-widgets";
import { saveClientDashboardWidgets } from "@/app/clients/[id]/dashboard-actions";

// Per-client customizable widget grid. Mirrors the My Dashboard surface
// but is scoped to a single client and persists the widget IDs to the
// `clients.dashboard_widgets` column instead of localStorage.
//
// Widgets render with an empty WidgetCtx — they show "waiting for feed…"
// placeholders. Once /clients/[id] gets a live session view wired up,
// the same ctx contract can pass real samples through.
export function ClientDashboardWidgets({
  clientId,
  initialWidgets,
}: {
  clientId: string;
  initialWidgets: string[];
}) {
  const [widgets, setWidgets] = useState<string[]>(initialWidgets);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();

  function persist(next: string[]) {
    setWidgets(next);
    startTransition(() => {
      void saveClientDashboardWidgets(clientId, next).catch(() => {
        // Server action failure is silent here — the optimistic UI keeps
        // the new layout in memory; a refresh will refetch authoritative
        // state from the DB.
      });
    });
  }

  function addWidget(id: string) {
    if (widgets.includes(id)) return;
    persist([...widgets, id]);
  }

  function removeWidget(id: string) {
    persist(widgets.filter((w) => w !== id));
  }

  // Widgets receive an empty live context until a live-session view is
  // wired into this surface. The cards self-render a "waiting for feed"
  // placeholder when sample is null.
  const ctx: WidgetCtx = {
    sample: null,
    reward: [],
    oxyL: [],
    oxyR: [],
    deoxyL: [],
    deoxyR: [],
    thetaW: [],
    alphaW: [],
    betaW: [],
    elapsed: 0,
    markersCount: 0,
    quickNote: "",
    setQuickNote: () => {},
  };

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          background: "#0F172A",
          border: "1px solid #1E293B",
          borderLeft: "3px solid #60A5FA",
          borderRadius: 12,
          padding: "12px 18px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "#CBD5E1", flex: 1, minWidth: 0 }}>
          <strong style={{ color: "#F1F5F9" }}>Client dashboard</strong> &mdash; pick the
          widgets that matter for this client. Layout saves automatically.
        </span>
        <button
          onClick={() => setPickerOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "#2563EB",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Plus size={14} /> Add widget
        </button>
      </div>

      {widgets.length === 0 ? (
        <DashboardEmptyState onAdd={() => setPickerOpen(true)} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {widgets.map((id) => {
            const def = WIDGET_CATALOG.find((w) => w.id === id);
            if (!def) return null;
            return (
              <WidgetCard
                key={id}
                def={def}
                ctx={ctx}
                onRemove={() => removeWidget(id)}
              />
            );
          })}
        </div>
      )}

      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentIds={widgets}
        onAdd={(id) => addWidget(id)}
        onRemove={(id) => removeWidget(id)}
      />
    </div>
  );
}
