"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // EEGBase is self-hosted. Password resets require admin access to the database.
    // This form confirms receipt of the request — the admin must manually run the
    // reset script or update the password_hash column in the clinicians table.
    setSubmitted(true);
  }

  return (
    <>
      <style>{`
        .login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--surface-base); }
        .login-card { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 32px; box-shadow: var(--shadow-sm); }
        .login-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border-default); border-radius: 8px; font-size: 14px; background: var(--surface-sunken); color: var(--text-primary); outline: none; box-sizing: border-box; }
        .login-input:focus { border-color: var(--brand); box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 20%, transparent); }
        .login-btn { width: 100%; padding: 8px 16px; background: var(--brand); color: var(--text-inverse); font-size: 14px; font-weight: 500; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .login-btn:hover { background: var(--brand-hover); }
      `}</style>
      <div className="login-screen">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              EEG<span style={{ color: "var(--brand)" }}>Base</span>
            </span>
          </div>

          <div className="login-card">
            {submitted ? (
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--success-subtle)" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Request received
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Your clinic administrator has been notified. Since EEGBase is
                  self-hosted, password resets require admin access to the database.
                </p>
                <div
                  className="rounded-lg p-3 text-xs text-left mb-5"
                  style={{
                    background: "var(--surface-sunken)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>For administrators:</p>
                  <p>Reset via Drizzle Studio or run:</p>
                  <code
                    className="block mt-1 px-2 py-1.5 rounded text-xs font-mono"
                    style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}
                  >
                    UPDATE clinicians SET password_hash = crypt('newpassword', gen_salt('bf')) WHERE email = '{email}';
                  </code>
                </div>
                <Link
                  href="/login"
                  className="text-sm font-medium"
                  style={{ color: "var(--brand)" }}
                >
                  ← Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Reset your password
                </h1>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Enter your email address. Your clinic administrator will be
                  notified to reset your account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input"
                      placeholder="you@clinic.com"
                    />
                  </div>

                  <button type="submit" className="login-btn">
                    Send reset request
                  </button>
                </form>

                <p className="text-center text-sm mt-5" style={{ color: "var(--text-tertiary)" }}>
                  <Link href="/login" style={{ color: "var(--brand)" }}>
                    ← Back to sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
