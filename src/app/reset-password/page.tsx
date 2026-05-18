"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordWithToken } from "../forgot-password/actions";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <p style={{ color: "#FCA5A5", fontSize: 13 }}>
        Reset link is missing its token. <Link href="/forgot-password" style={{ color: "#60A5FA" }}>Request a new one</Link>.
      </p>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    startTransition(async () => {
      const res = await resetPasswordWithToken(token, password);
      if (res.error) setError(res.error);
      else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      }
    });
  }

  if (success) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#34D399", fontSize: 14, fontWeight: 600 }}>Password updated ✓</p>
        <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>Redirecting to sign-in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          New password
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          style={inputStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Confirm password
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isPending}
          style={inputStyle}
        />
      </label>

      {error && (
        <div style={{
          background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)",
          borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#FCA5A5",
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          background: isPending ? "#1E40AF" : "#2563EB",
          color: "white", border: "none",
          padding: "10px 16px", borderRadius: 10,
          fontSize: 14, fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          marginTop: 4,
        }}
      >
        {isPending ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1E293B",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "#F1F5F9",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

export default function ResetPasswordPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0A1320",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif", padding: 20,
    }}>
      <div style={{
        maxWidth: 380, width: "100%",
        background: "#0F172A", border: "1px solid #1E293B",
        borderRadius: 16, padding: "32px 28px",
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", margin: "0 0 6px" }}>
          Set a new password
        </h1>
        <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 20px" }}>
          Choose a password at least 8 characters long.
        </p>
        <Suspense fallback={<p style={{ color: "#94A3B8", fontSize: 13 }}>Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
        <p style={{ fontSize: 12, color: "#64748B", marginTop: 20, textAlign: "center" }}>
          <Link href="/login" style={{ color: "#60A5FA", textDecoration: "none" }}>Back to sign-in</Link>
        </p>
      </div>
    </div>
  );
}
