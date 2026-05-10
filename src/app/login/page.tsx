"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function doSignIn(e: string, p: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password: p }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--surface-base); }
        .login-brand-accent { color: var(--brand); }
        .login-card { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 32px; box-shadow: var(--shadow-sm); }
        .login-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border-default); border-radius: 8px; font-size: 14px; background: var(--surface-sunken); color: var(--text-primary); outline: none; box-sizing: border-box; }
        .login-input:focus { border-color: var(--brand); box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 20%, transparent); }
        .login-error { font-size: 14px; color: var(--danger); background: var(--danger-subtle); padding: 8px 12px; border-radius: 8px; }
        .login-btn { width: 100%; padding: 8px 16px; background: var(--brand); color: var(--text-inverse); font-size: 14px; font-weight: 500; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .login-btn:hover:not(:disabled) { background: var(--brand-hover); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .demo-banner { background: linear-gradient(135deg, #EDE9FE 0%, #EFF6FF 100%); border: 1.5px solid #C4B5FD; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; }
        .demo-btn { width: 100%; padding: 8px 16px; background: #7C3AED; color: #fff; font-size: 14px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .demo-btn:hover:not(:disabled) { background: #6D28D9; }
      `}</style>
      <div className="login-screen">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2.5" style={{ textDecoration: "none" }}>
              <span style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
              </span>
              <span className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>EEGBase</span>
            </a>
            <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
              Clinician neurofeedback platform
            </p>
          </div>

          <div className="demo-banner">
            <p className="text-xs font-semibold mb-2" style={{ color: "#4C1D95" }}>DEMO ACCESS</p>
            <p className="text-xs mb-3" style={{ color: "#6D28D9", lineHeight: 1.5 }}>5 sample clients · 20-session arcs · Full clinical data · No sign-up needed</p>
            <button type="button" onClick={() => router.push('/demo')} className="demo-btn">
              ▶ Explore Live Demo — No login needed
            </button>
          </div>

          <div className="login-card">
            <h1 className="text-lg font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Sign in to your clinic</h1>
            <form onSubmit={(e) => { e.preventDefault(); doSignIn(email, password); }} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="login-input" placeholder="you@clinic.com" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Password</label>
                <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" placeholder="••••••••" />
              </div>
              {error && <p className="login-error">{error}</p>}
              <button type="submit" disabled={loading} className="login-btn">{loading ? "Signing in…" : "Sign in"}</button>
            </form>
            <p className="text-center text-sm mt-5" style={{ color: "var(--text-tertiary)" }}>
              <a href="/forgot-password" style={{ color: "var(--brand)" }}>Forgot your password?</a>
            </p>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-tertiary)" }}>Free for licensed clinicians</p>
        </div>
      </div>
    </>
  );
}
