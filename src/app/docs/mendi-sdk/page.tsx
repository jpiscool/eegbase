/**
 * /docs/mendi-sdk — In-app developer reference for the Mendi BLE integration.
 *
 * Sidebar nav still labels this as "Mendi BLE". The full BLE-protocol spec
 * is not published yet because we're mid-capture against a physical device
 * (see AUDIT-2026-MENDI-BLE-PROTOCOL.md in the repo). This page is a brief
 * status pointer until the protocol is documented.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mendi BLE integration — EEGBase docs",
  description: "Independent BLE protocol integration for the Mendi fNIRS headband. Status + reference.",
};

export default function MendiBleDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12" style={{ color: "var(--text-primary)" }}>
      <h1 className="text-3xl font-bold mb-2">Mendi BLE integration</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
        Independent reverse-engineered BLE protocol · no Mendi SDK required.
      </p>

      <div className="rounded-xl p-5 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
          Status
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Adapter scaffolded with a pure decoder, Beer-Lambert helper, and 11 / 11 unit tests passing.
          The remaining work is hardware-capture of the BLE GATT protocol from a physical Mendi
          (Wireshark + Android HCI snoop log). Once the capture completes, the only code change is
          two UUID constants and a packet-layout flip.
        </p>
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-3">Architecture</h2>
      <ul className="text-sm leading-relaxed mb-6 list-disc pl-6 space-y-1.5" style={{ color: "var(--text-secondary)" }}>
        <li><code>src/lib/device/mendi.ts</code> — WebBluetooth transport (GATT lifecycle).</li>
        <li><code>src/lib/device/mendi-decoder.ts</code> — pure packet decoder. Two layouts supported: <code>preprocessed-hb-float32</code> and <code>raw-intensity-uint16</code>.</li>
        <li><code>src/lib/device/beer-lambert.ts</code> — modified Beer-Lambert (MBLL) for the raw-intensity case.</li>
        <li><code>src/lib/device/mendi-decoder.test.ts</code> — vitest-style tests run via <code>npm test</code> (Node built-in runner, zero deps).</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-3">Reference docs in repo</h2>
      <ul className="text-sm leading-relaxed mb-6 list-disc pl-6 space-y-1.5" style={{ color: "var(--text-secondary)" }}>
        <li><code>AUDIT-2026-MENDI-BLE-PROTOCOL.md</code> — capture runbook.</li>
        <li><code>scripts/mendi-capture/decode-packets.py</code> — Python helper that ranks candidate byte interpretations against a captured packet stream.</li>
        <li><code>scripts/mendi-capture/validation-runbook.md</code> — Phase 4 hardware-validation procedure.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-3">Why no Mendi SDK?</h2>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        Mendi confirmed (May 2026) that an independent integration — talking to the headband
        directly over BLE without their app or cloud — is the supported model. This is the same
        approach Myndlift took with Muse: hardware-only, no licensing required.
      </p>

      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
        See the public-facing summary at <Link href="/mendi" className="underline">/mendi</Link>.
      </p>
    </div>
  );
}
