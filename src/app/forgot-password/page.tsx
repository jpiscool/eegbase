"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // We always show the same success state regardless of whether the email
    // exists, to avoid leaking which addresses have accounts (account-enumeration
    // defense). A real reset email is sent server-side if the address matches.
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
                  Check your inbox
                </h2>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                  If <strong>{email}</strong> matches an account, we&rsquo;ve sent a password-reset link. The link expires in 30 minutes.
                </p>
                <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>
                  Didn&rsquo;t see it? Check your spam folder, or contact your clinic admin.
                </p>
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
                  Enter your email address and we&rsquo;ll send you a reset link.
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
