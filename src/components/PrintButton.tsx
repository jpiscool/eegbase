"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <div className="print-bar">
      <button
        onClick={() => window.print()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          background: "var(--brand)",
          color: "white",
          border: "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 16px color-mix(in srgb, var(--brand) 35%, transparent)",
        }}
      >
        <Printer size={15} />
        Print / Save as PDF
      </button>
    </div>
  );
}
