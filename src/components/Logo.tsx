import Link from "next/link";
import { Brain } from "lucide-react";

// Canonical EEGBase logo. Brain icon (lucide) on a 32×32 blue square,
// followed by the EEGBase wordmark. Wraps the whole logo in a Link so
// every header logo navigates to the homepage. Used by every public
// page so the brand can never drift apart again.

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        minHeight: 40,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          background: "#2563EB",
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Brain size={18} color="white" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "#0F172A",
          letterSpacing: "-0.01em",
        }}
      >
        EEGBase
      </span>
    </Link>
  );
}
