"use client";
import { useState, useTransition } from "react";
import { Plus, Minus, Trash2, PlusCircle } from "lucide-react";
import { addConsumable, updateStock, deleteConsumable } from "@/app/settings/inventory/actions";

interface Item {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  parLevel: number;
  usagePerSession: number | null;
  notes: string | null;
}

export function InventoryTable({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUpdateStock(id: string, delta: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, currentStock: Math.max(0, it.currentStock + delta) } : it
      )
    );
    startTransition(() => updateStock(id, delta));
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    startTransition(() => deleteConsumable(id));
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addConsumable(fd);
      setShowAdd(false);
    });
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border-default)",
    background: "var(--surface-sunken)",
    color: "var(--text-primary)",
  };

  return (
    <div>
      <div className="rounded-xl overflow-hidden mb-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No supplies tracked yet. Add your first item below.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Item</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Stock</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Par Level</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Per Session</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Adjust</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {items.map((item) => {
                const low = item.currentStock <= item.parLevel;
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                      {item.notes && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{item.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold" style={{ color: low ? "var(--warning)" : "var(--text-primary)" }}>
                        {item.currentStock} {item.unit}
                      </span>
                      {low && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--warning-subtle)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 20%, transparent)" }}>
                          Low
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{item.parLevel} {item.unit}</td>
                    <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>
                      {item.usagePerSession != null ? `${item.usagePerSession} ${item.unit}` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateStock(item.id, -1)}
                          disabled={isPending || item.currentStock <= 0}
                          className="p-1 rounded transition-colors disabled:opacity-30"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          onClick={() => handleUpdateStock(item.id, 1)}
                          disabled={isPending}
                          className="p-1 rounded transition-colors"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => handleUpdateStock(item.id, 10)}
                          disabled={isPending}
                          className="px-2 py-0.5 text-xs rounded transition-colors font-medium"
                          style={{ color: "var(--brand)" }}
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="p-1 rounded transition-colors disabled:opacity-30"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd ? (
        <form onSubmit={handleAdd} className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Add Supply Item</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Item Name *</label>
              <input name="name" required placeholder="e.g. Electrode Gel" className="w-full px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Unit</label>
              <input name="unit" placeholder="units / ml / packs" defaultValue="units" className="w-full px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Current Stock</label>
              <input name="currentStock" type="number" min={0} defaultValue={0} className="w-full px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Par Level (alert below)</label>
              <input name="parLevel" type="number" min={0} defaultValue={10} className="w-full px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Usage per Session</label>
              <input name="usagePerSession" type="number" min={0} step="0.1" placeholder="optional" className="w-full px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Notes</label>
              <input name="notes" placeholder="optional" className="w-full px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              style={{ background: "var(--brand)", color: "#fff" }}>
              {isPending ? "Saving…" : "Add Item"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{ color: "var(--brand)", border: "1px solid color-mix(in srgb, var(--brand) 25%, transparent)" }}>
          <PlusCircle size={16} />
          Add Supply Item
        </button>
      )}
    </div>
  );
}
