"use client";

import { use, useActionState, useState, useEffect } from "react";
import { submitPublicCheckIn } from "./actions";
import { t, type Lang, detectLang } from "@/lib/i18n";

function ScaleInput({
  name,
  label,
  emoji,
  lo,
  hi,
}: {
  name: string;
  label: string;
  emoji: string;
  lo: string;
  hi: string;
}) {
  const [val, setVal] = useState<number | null>(null);

  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {emoji} {label}
      </label>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setVal(n)}
            style={{
              width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid",
              borderColor: val === n ? "#2563EB" : "#E2E8F0",
              background: val === n ? "#2563EB" : "white",
              color: val === n ? "white" : "#6B7280",
              cursor: "pointer",
              transition: "all 0.1s",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
      <input type="hidden" name={name} value={val ?? ""} />
    </div>
  );
}

type FormState = { success: boolean; error?: string } | null;

async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await submitPublicCheckIn(formData);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export default function PublicCheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [state, action, pending] = useActionState(formAction, null);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(detectLang());
  }, []);

  function toggleLang() {
    const next: Lang = lang === "en" ? "es" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  }

  if (state?.success) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14532D", marginBottom: 8 }}>{t("successTitle", lang)}</h1>
          <p style={{ color: "#64748B", fontSize: 14 }}>{t("successBody", lang)}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: "10px 24px", background: "#16A34A", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            {t("submitAnother", lang)}
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Language toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={toggleLang}
            style={{
              fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
              border: "1px solid #E2E8F0", background: "white", cursor: "pointer", color: "#64748B",
              letterSpacing: "0.05em",
            }}
          >
            {lang === "en" ? "🇪🇸 ES" : "🇺🇸 EN"}
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "#0F172A", marginBottom: 8 }}>
            EEG<span style={{ color: "#2563EB" }}>Base</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>{t("checkinTitle", lang)}</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>{t("checkinSubtitle", lang)}</p>
        </div>

        <form
          action={action}
          style={{ background: "white", borderRadius: 20, padding: "32px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 24 }}
        >
          <input type="hidden" name="token" value={token} />

          {/* Date */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t("dateLabel", lang)}
            </label>
            <input
              type="date"
              name="date"
              defaultValue={today}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", boxSizing: "border-box" }}
            />
          </div>

          {/* Sleep hours */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t("sleepHoursLabel", lang)}
            </label>
            <input
              type="number"
              name="sleepHours"
              min={0}
              max={24}
              step={0.5}
              placeholder={t("sleepHoursPlaceholder", lang)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", boxSizing: "border-box" }}
            />
          </div>

          <ScaleInput name="sleepQuality" label={t("sleepQualityLabel", lang)} emoji="😴" lo={t("poorExcellent", lang)[0]} hi={t("poorExcellent", lang)[1]} />
          <ScaleInput name="mood" label={t("moodLabel", lang)} emoji="🙂" lo={t("veryLowHigh", lang)[0]} hi={t("veryLowHigh", lang)[1]} />
          <ScaleInput name="anxiety" label={t("anxietyLabel", lang)} emoji="😰" lo={t("noneServerely", lang)[0]} hi={t("noneServerely", lang)[1]} />
          <ScaleInput name="focus" label={t("focusLabel", lang)} emoji="🎯" lo={t("scatteredSharp", lang)[0]} hi={t("scatteredSharp", lang)[1]} />
          <ScaleInput name="energy" label={t("energyLabel", lang)} emoji="⚡" lo={t("exhaustedEnergised", lang)[0]} hi={t("exhaustedEnergised", lang)[1]} />

          {/* Notes */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t("notesLabel", lang)} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>{t("notesOptional", lang)}</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder={t("notesPlaceholder", lang)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          {state?.error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              padding: "13px 24px",
              background: "#2563EB",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {pending ? t("submittingButton", lang) : t("submitButton", lang)}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#94A3B8" }}>
          {t("footerNote", lang)}
        </p>
      </div>
    </div>
  );
}
