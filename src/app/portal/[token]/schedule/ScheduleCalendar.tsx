"use client";

import { useState, useTransition } from "react";
import { requestAppointment } from "./actions";

const TIME_SLOTS = [
  { label: "9:00 AM", hour: 9, minute: 0 },
  { label: "10:00 AM", hour: 10, minute: 0 },
  { label: "11:00 AM", hour: 11, minute: 0 },
  { label: "2:00 PM", hour: 14, minute: 0 },
  { label: "3:00 PM", hour: 15, minute: 0 },
  { label: "4:00 PM", hour: 16, minute: 0 },
];

const SESSION_TYPES = [
  "Neurofeedback Session",
  "Check-in Call",
  "Assessment",
];

type BookedSlot = {
  scheduledAt: string;
  clinicianId: string;
  durationMinutes: number;
};

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatFull(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function isSlotBooked(day: Date, hour: number, minute: number, bookedSlots: BookedSlot[]): boolean {
  const slotMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime();
  return bookedSlots.some((b) => {
    const bMs = new Date(b.scheduledAt).getTime();
    // Block if within duration window of any booked appointment
    return Math.abs(bMs - slotMs) < b.durationMinutes * 60 * 1000;
  });
}

export function ScheduleCalendar({
  token,
  clientName,
  clinicName,
  bookedSlots,
}: {
  token: string;
  clientName: string;
  clinicName: string;
  clinicianId: string;
  bookedSlots: BookedSlot[];
}) {
  const days = getNext14Days();

  const [selected, setSelected] = useState<{ day: Date; hour: number; minute: number; label: string } | null>(null);
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSlotClick(day: Date, hour: number, minute: number, label: string) {
    setSelected({ day, hour, minute, label });
    setShowConfirm(true);
    setResult(null);
  }

  function handleConfirm() {
    if (!selected) return;
    const scheduledAt = new Date(
      selected.day.getFullYear(),
      selected.day.getMonth(),
      selected.day.getDate(),
      selected.hour,
      selected.minute
    ).toISOString();

    startTransition(async () => {
      const res = await requestAppointment(token, scheduledAt, sessionType, notes);
      setResult(res);
      if (res.success) {
        setShowConfirm(false);
      }
    });
  }

  if (result?.success) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={styles.heading}>Appointment Requested!</h2>
          <p style={styles.subtext}>
            Your request for{" "}
            <strong>
              {formatFull(selected!.day)} at {selected!.label}
            </strong>{" "}
            has been sent to your clinician.
          </p>
          <p style={{ ...styles.subtext, marginTop: 8 }}>
            Your clinician will confirm within 24 hours.
          </p>
          <div
            style={{
              marginTop: 20,
              padding: "12px 16px",
              background: "#F0FDF4",
              borderRadius: 10,
              fontSize: 13,
              color: "#166534",
              fontWeight: 500,
            }}
          >
            {sessionType}
          </div>
          <button
            onClick={() => {
              setResult(null);
              setSelected(null);
              setNotes("");
              setSessionType(SESSION_TYPES[0]);
            }}
            style={{ ...styles.btn, marginTop: 24, background: "#F1F5F9", color: "#334155" }}
          >
            Book Another Time
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ maxWidth: 860, margin: "0 auto 28px", padding: "0 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: "#0F172A", marginBottom: 6 }}>
          EEG<span style={{ color: "#2563EB" }}>Base</span>{" "}
          <span style={{ color: "#94A3B8", fontWeight: 400 }}>· {clinicName}</span>
        </div>
        <h1 style={styles.heading}>Book an Appointment</h1>
        <p style={styles.subtext}>
          Hi <strong>{clientName}</strong> — select a date and time that works for you.
        </p>
        <p style={{ ...styles.subtext, marginTop: 4, fontSize: 12 }}>
          Your clinician will confirm within 24 hours.
        </p>
      </div>

      {/* Calendar grid */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
        <div style={styles.grid}>
          {days.map((day) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div key={day.toISOString()} style={styles.dayCol}>
                <div
                  style={{
                    ...styles.dayHeader,
                    background: isWeekend ? "#F8FAFC" : "white",
                  }}
                >
                  {formatDate(day)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {TIME_SLOTS.map((slot) => {
                    const booked = isSlotBooked(day, slot.hour, slot.minute, bookedSlots);
                    return (
                      <button
                        key={slot.label}
                        disabled={booked || isWeekend}
                        onClick={() => handleSlotClick(day, slot.hour, slot.minute, slot.label)}
                        style={{
                          ...styles.slotBtn,
                          ...(booked
                            ? styles.slotBooked
                            : isWeekend
                            ? styles.slotWeekend
                            : styles.slotAvailable),
                        }}
                      >
                        {booked ? (
                          <span style={{ color: "#CBD5E1", textDecoration: "line-through" }}>
                            {slot.label}
                          </span>
                        ) : isWeekend ? (
                          <span style={{ color: "#CBD5E1" }}>{slot.label}</span>
                        ) : (
                          slot.label
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ maxWidth: 860, margin: "16px auto 0", padding: "0 16px", display: "flex", gap: 20, fontSize: 12, color: "#94A3B8" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#2563EB", display: "inline-block" }} />
          Available
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#F1F5F9", display: "inline-block", border: "1px solid #E2E8F0" }} />
          Unavailable
        </span>
      </div>

      {/* Confirm dialog overlay */}
      {showConfirm && selected && (
        <div style={styles.overlay}>
          <div style={{ ...styles.card, maxWidth: 440, width: "100%" }}>
            <h2 style={{ ...styles.heading, marginBottom: 4 }}>Confirm Appointment</h2>
            <p style={{ ...styles.subtext, marginBottom: 20 }}>
              {formatFull(selected.day)} at {selected.label}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                style={styles.select}
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={styles.label}>
                Notes <span style={{ fontWeight: 400, color: "#94A3B8" }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes for your clinician..."
                rows={3}
                style={styles.textarea}
              />
            </div>

            {result?.error && (
              <div style={styles.errorBox}>{result.error}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setResult(null);
                }}
                style={{ ...styles.btn, flex: 1, background: "#F1F5F9", color: "#334155" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                style={{ ...styles.btn, flex: 2, opacity: isPending ? 0.6 : 1 }}
              >
                {isPending ? "Sending Request..." : "Request Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    padding: "32px 0 64px",
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0F172A",
    margin: "0 0 6px",
  },
  subtext: {
    fontSize: 14,
    color: "#64748B",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 8,
    overflowX: "auto",
    minWidth: 0,
  },
  dayCol: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 90,
  },
  dayHeader: {
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    padding: "6px 4px",
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 2,
    letterSpacing: "0.01em",
  },
  slotBtn: {
    width: "100%",
    padding: "7px 4px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 500,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.1s",
    textAlign: "center" as const,
  },
  slotAvailable: {
    background: "#EFF6FF",
    borderColor: "#BFDBFE",
    color: "#1D4ED8",
  },
  slotBooked: {
    background: "#F8FAFC",
    borderColor: "#E2E8F0",
    cursor: "not-allowed",
  },
  slotWeekend: {
    background: "#F8FAFC",
    borderColor: "#E2E8F0",
    cursor: "not-allowed",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 50,
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: "32px 28px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  } as React.CSSProperties,
  select: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 14,
    color: "#0F172A",
    background: "white",
    boxSizing: "border-box" as const,
    appearance: "none" as const,
  },
  textarea: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 14,
    color: "#0F172A",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  btn: {
    padding: "11px 20px",
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 16,
  },
};
