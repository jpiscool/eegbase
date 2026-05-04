/**
 * Standalone public layout for /docs/mendi-sdk.
 * No authentication required — intentionally bypasses the parent docs layout.
 */
export default function MendiSdkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--surface-base, #F8FAFC)", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
