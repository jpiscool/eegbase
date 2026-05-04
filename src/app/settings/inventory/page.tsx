import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { consumables } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Package, AlertTriangle } from "lucide-react";
import { InventoryTable } from "@/components/InventoryTable";

export default async function InventoryPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const items = await db
    .select()
    .from(consumables)
    .where(eq(consumables.clinicId, clinicId))
    .orderBy(asc(consumables.name));

  const lowStockCount = items.filter((i) => i.currentStock <= i.parLevel).length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package size={22} style={{ color: "var(--brand)" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Consumables Inventory</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Track electrode gel, caps, and other supplies</p>
          </div>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--warning-subtle)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}>
            <AlertTriangle size={15} style={{ color: "var(--warning)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--warning)" }}>{lowStockCount} item{lowStockCount !== 1 ? "s" : ""} at/below par level</span>
          </div>
        )}
      </div>

      <InventoryTable items={items} />
    </div>
  );
}
