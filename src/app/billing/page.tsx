import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { invoices, clients } from "@/lib/db/schema";
import { eq, and, desc, sum } from "drizzle-orm";
import Link from "next/link";
import { Receipt, FileText } from "lucide-react";
import { CreateInvoiceModal } from "@/components/CreateInvoiceModal";
import { InvoiceStatusBtn } from "@/components/InvoiceStatusBtn";

export default async function BillingPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [allInvoices, clientList, totalPaid, totalPending] = await Promise.all([
    db
      .select({
        id: invoices.id,
        description: invoices.description,
        amountCents: invoices.amountCents,
        currency: invoices.currency,
        status: invoices.status,
        issuedAt: invoices.issuedAt,
        dueDate: invoices.dueDate,
        cptCode: invoices.cptCode,
        notes: invoices.notes,
        clientId: invoices.clientId,
        clientName: clients.name,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.clinicId, clinicId))
      .orderBy(desc(invoices.issuedAt)),
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)))
      .orderBy(clients.name),
    db
      .select({ total: sum(invoices.amountCents) })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(eq(invoices.clinicId, clinicId), eq(invoices.status, "paid"))),
    db
      .select({ total: sum(invoices.amountCents) })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(eq(invoices.clinicId, clinicId), eq(invoices.status, "sent"))),
  ]);

  const fmtAmount = (cents: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  function statusBadgeStyle(status: string): React.CSSProperties {
    const map: Record<string, React.CSSProperties> = {
      draft:  { background: "var(--surface-sunken)", color: "var(--text-secondary)" },
      sent:   { background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" },
      paid:   { background: "var(--success-subtle)", color: "var(--success)" },
      waived: { background: "var(--warning-subtle)", color: "var(--warning)" },
    };
    return map[status] ?? { background: "var(--surface-sunken)", color: "var(--text-secondary)" };
  }

  const paidTotal = Number(totalPaid[0]?.total ?? 0);
  const pendingTotal = Number(totalPending[0]?.total ?? 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Receipt size={22} style={{ color: "var(--brand)" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Billing</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Create and track session invoices</p>
          </div>
        </div>
        <CreateInvoiceModal clients={clientList} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Total Invoices</p>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{allInvoices.length}</p>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Revenue Collected</p>
          <p className="text-3xl font-bold" style={{ color: "var(--success)" }}>{fmtAmount(paidTotal, "USD")}</p>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Outstanding</p>
          <p className="text-3xl font-bold" style={{ color: "var(--warning)" }}>{fmtAmount(pendingTotal, "USD")}</p>
        </div>
      </div>

      {/* Invoice table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All Invoices</h2>
        </div>
        {allInvoices.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No invoices yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
              <tr>
                {["Client", "Description", "CPT", "Issued", "Due", "Amount", "Status"].map((h, i) => (
                  <th
                    key={h}
                    className={`${i === 5 ? "text-right" : "text-left"} px-6 py-3 font-medium`}
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {allInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-3.5">
                    <Link href={`/clients/${inv.clientId}`} className="font-medium hover:underline" style={{ color: "var(--brand)" }}>
                      {inv.clientName}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5" style={{ color: "var(--text-primary)" }}>{inv.description}</td>
                  <td className="px-6 py-3.5 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{inv.cptCode ?? "—"}</td>
                  <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5" style={{ color: "var(--text-secondary)" }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {fmtAmount(inv.amountCents, inv.currency)}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <InvoiceStatusBtn id={inv.id} status={inv.status as "draft" | "sent" | "paid" | "waived"} />
                      <Link
                        href={`/billing/superbill/${inv.id}`}
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        title="Generate Superbill"
                      >
                        <FileText size={13} /> Superbill
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
