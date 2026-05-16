"use client";

import { useState, useTransition } from "react";
import { updateProfile, changePassword, updateClinicName, updateWebhookUrl, testWebhook } from "./actions";
import { Loader2, CheckCircle2, XCircle, Send, Copy, Check, ExternalLink } from "lucide-react";

const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputStyle = { background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" };
const labelStyle = { color: "var(--text-primary)" };
const btnStyle = { background: "var(--brand)", color: "var(--text-inverse)" };

export function ClinicNameForm({ currentName }: { currentName: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateClinicName(fd);
      if (res?.error) { setStatus("error"); setMsg(res.error); }
      else { setStatus("success"); setMsg("Clinic name updated."); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>Clinic Name</label>
        <input
          name="clinicName"
          defaultValue={currentName}
          required
          className={inputCls}
          style={inputStyle}
        />
      </div>
      {status !== "idle" && (
        <p className="text-sm" style={{ color: status === "success" ? "var(--success)" : "var(--danger)" }}>{msg}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        style={btnStyle}
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export function ProfileForm({
  name,
  email,
  editableEmail = false,
}: { name: string; email: string; editableEmail?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfile(fd);
      if (res?.error) { setStatus("error"); setMsg(res.error); }
      else { setStatus("success"); setMsg("Profile updated."); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>Name</label>
        <input
          name="name"
          defaultValue={name}
          required
          className={inputCls}
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>Email</label>
        {editableEmail ? (
          <input
            type="email"
            name="email"
            defaultValue={email}
            required
            className={inputCls}
            style={inputStyle}
          />
        ) : (
          <>
            <input
              value={email}
              readOnly
              className={inputCls + " cursor-not-allowed"}
              style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Email cannot be changed here.</p>
          </>
        )}
      </div>
      {status !== "idle" && (
        <p className="text-sm" style={{ color: status === "success" ? "var(--success)" : "var(--danger)" }}>
          {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        style={btnStyle}
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await changePassword(fd);
      if (res?.error) { setStatus("error"); setMsg(res.error); }
      else { setStatus("success"); setMsg("Password changed successfully."); form.reset(); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            {field === "currentPassword"
              ? "Current Password"
              : field === "newPassword"
              ? "New Password"
              : "Confirm New Password"}
          </label>
          <input
            type="password"
            name={field}
            required
            className={inputCls}
            style={inputStyle}
          />
        </div>
      ))}
      {status !== "idle" && (
        <p className="text-sm" style={{ color: status === "success" ? "var(--success)" : "var(--danger)" }}>
          {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        style={btnStyle}
      >
        {pending ? "Updating…" : "Change Password"}
      </button>
    </form>
  );
}

export function ApiKeyDisplay({ clinicId }: { clinicId: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(clinicId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleTestApi() {
    window.open("/docs", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-lg p-4 mb-4 border" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
        Your API Key (Clinic ID)
      </p>
      {/* Key row with copy button */}
      <div className="flex items-center gap-2 mb-2">
        <p className="font-mono text-sm break-all flex-1" style={{ color: "var(--text-primary)" }}>
          {clinicId}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
          style={copied
            ? { borderColor: "var(--success)", color: "var(--success)", background: "var(--success-subtle)" }
            : { borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {/* Bearer note */}
      <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
        Use this key in the Authorization header:{" "}
        <code
          className="rounded px-1"
          style={{ background: "var(--surface-raised)", color: "var(--text-secondary)" }}
        >
          Bearer &lt;your-clinic-id&gt;
        </code>
      </p>
      {/* Test API button */}
      <button
        type="button"
        onClick={handleTestApi}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        style={{ borderColor: "var(--border-default)", color: "var(--brand)", background: "var(--surface-raised)" }}
      >
        <ExternalLink size={13} />
        Test API
      </button>
    </div>
  );
}

export function WebhookForm({ currentUrl }: { currentUrl: string | null }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [testPending, startTestTransition] = useTransition();
  const [testResult, setTestResult] = useState<{ ok: boolean; status?: number; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setTestResult(null);
    startTransition(async () => {
      const res = await updateWebhookUrl(fd);
      if (res?.error) { setStatus("error"); setMsg(res.error); }
      else { setStatus("success"); setMsg("Webhook URL saved."); }
    });
  }

  function handleTest() {
    setTestResult(null);
    startTestTransition(async () => {
      const res = await testWebhook();
      setTestResult(res);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="webhookUrl"
        type="url"
        defaultValue={currentUrl ?? ""}
        placeholder="https://your-server.com/hooks/eegbase"
        className={inputCls}
        style={inputStyle}
      />
      {status !== "idle" && (
        <p className="text-xs" style={{ color: status === "success" ? "var(--success)" : "var(--danger)" }}>{msg}</p>
      )}
      {testResult && (
        <div
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border"
          style={testResult.ok
            ? { background: "var(--success-subtle)", borderColor: "color-mix(in srgb, var(--success) 25%, transparent)", color: "var(--success)" }
            : { background: "var(--danger-subtle)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)", color: "var(--danger)" }}
        >
          {testResult.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {testResult.ok
            ? `Test succeeded — server responded with HTTP ${testResult.status}`
            : testResult.error ?? `HTTP ${testResult.status ?? "error"}`}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          style={btnStyle}
        >
          {pending ? "Saving…" : "Save Webhook URL"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={handleTest}
            disabled={testPending}
            className="flex items-center gap-1.5 px-4 py-2 border text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
          >
            {testPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {testPending ? "Testing…" : "Send Test"}
          </button>
        )}
      </div>
    </form>
  );
}
