import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { invoices, clients, clinicians, clinics } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";

export default async function SuperbillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [row] = await db
    .select({
      invoice: invoices,
      client: clients,
      clinicName: clinics.name,
      clinicianName: clinicians.name,
      clinicianEmail: clinicians.email,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .innerJoin(clinics, eq(invoices.clinicId, clinics.id))
    .innerJoin(clinicians, eq(clients.clinicianId, clinicians.id))
    .where(and(eq(invoices.id, id), eq(invoices.clinicId, clinicId)))
    .limit(1);

  if (!row) notFound();

  const { invoice, client, clinicName, clinicianName, clinicianEmail } = row;
  const provider = invoice.renderingProvider ?? clinicianName;
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency }).format(
    invoice.amountCents / 100
  );
  const serviceDate = new Date(invoice.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dob = client.dateOfBirth
    ? new Date(client.dateOfBirth).toLocaleDateString("en-US")
    : "—";

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fb" }}>
      {/* Print button — hidden in print */}
      <div className="flex items-center justify-between px-8 py-4 border-b print:hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Superbill for {client.name}</p>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors"
          style={{ background: "var(--brand)" }}
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      {/* Superbill document */}
      <div className="max-w-3xl mx-auto my-8 bg-white rounded-xl shadow-md p-10 print:shadow-none print:rounded-none print:my-0 print:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{clinicName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Neurofeedback Practice</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">SUPERBILL</p>
            <p className="text-xs text-gray-400 mt-1">For insurance reimbursement</p>
          </div>
        </div>

        <hr className="border-gray-200 mb-6" />

        {/* Two-column info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Patient Information</p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: "Patient Name", value: client.name },
                  { label: "Date of Birth", value: dob },
                  { label: "Email", value: client.email ?? "—" },
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td className="py-1.5 text-gray-500 w-32">{label}</td>
                    <td className="py-1.5 font-medium text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Provider Information</p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: "Provider", value: provider },
                  { label: "Clinic", value: clinicName },
                  { label: "Email", value: clinicianEmail },
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td className="py-1.5 text-gray-500 w-32">{label}</td>
                    <td className="py-1.5 font-medium text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service line */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Service Detail</p>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {["Date of Service", "CPT Code", "ICD-10 Code", "Description", "Amount"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-900">{serviceDate}</td>
                <td className="px-4 py-3 font-mono text-gray-900">{invoice.cptCode ?? "97532"}</td>
                <td className="px-4 py-3 font-mono text-gray-900">{invoice.icd10Code ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{invoice.description}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{amount}</td>
              </tr>
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={4} className="px-4 py-2.5 text-right text-sm font-semibold text-gray-700">Total Billed</td>
                <td className="px-4 py-2.5 font-bold text-gray-900">{amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* CPT code reference */}
        <div className="bg-blue-50 rounded-lg p-4 mb-8 text-xs text-blue-800">
          <p className="font-semibold mb-1">Common Neurofeedback CPT Codes (for reference)</p>
          <p>90901 — Biofeedback training, any modality · 90875 — Biofeedback training with psychotherapy ·
          97532 — Cognitive skills development (30 min) · 90911 — Biofeedback training, perineal floor (specify)</p>
        </div>

        {/* Signature line */}
        <div className="grid grid-cols-2 gap-8 mt-10">
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-400">Provider Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-400">Date</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          This superbill is provided for insurance reimbursement purposes. Patient is responsible for verifying coverage with their insurer.
        </p>
      </div>

      <style>{`@media print { body { background: white; } .print\\:hidden { display: none; } }`}</style>
    </div>
  );
}
