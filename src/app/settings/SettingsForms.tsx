"use client";

import { useState, useTransition } from "react";
import { updateProfile, changePassword, updateClinicName } from "./actions";

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
        <input
          name="clinicName"
          defaultValue={currentName}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {status !== "idle" && (
        <p className={`text-sm ${status === "success" ? "text-emerald-600" : "text-red-500"}`}>{msg}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          name="name"
          defaultValue={name}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          value={email}
          readOnly
          className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
      </div>
      {status !== "idle" && (
        <p className={`text-sm ${status === "success" ? "text-emerald-600" : "text-red-500"}`}>
          {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      {status !== "idle" && (
        <p className={`text-sm ${status === "success" ? "text-emerald-600" : "text-red-500"}`}>
          {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "Updating…" : "Change Password"}
      </button>
    </form>
  );
}
