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
          background: "#2563EB",
          color: "white",
          border: "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
        }}
      >
        <Printer size={15} />
        Print / Save as PDF
      </button>
    </div>
  );
}
