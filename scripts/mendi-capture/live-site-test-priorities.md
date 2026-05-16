# EEGBase live-site Mendi hardware test priorities

**Audience:** John Paul, with a Mendi V4 headband in front of him at eegbase.com.
**Goal:** Validate the authenticated clinician app one slice at a time, gating
each new surface on hardware reality. Strip first, re-add in order, test each.

The public **/demo** surface is unaffected by this runbook — it already
works on the simulator. This document covers what a logged-in clinician
sees and uses with real Mendi hardware.

---

## How to use this list

1. Pick the lowest-numbered item not yet ✅.
2. Confirm it works end-to-end on eegbase.com with the headband on.
3. Tick the box. If broken, fix before moving to the next.
4. When you reach a green block of ≥ 3 items, redeploy the focus list.

The test environment is **eegbase.com (production)** + Chrome on macOS
+ a real Mendi V4 headband. The `mendi-bridge.py` script must be
running locally for live frames to flow through the dashboard.

Each test below should take **≤ 5 minutes**. Anything longer = bug.

---

## Tier 0 · Smoke test (gating EVERYTHING else)

The authenticated app is worthless if these don't pass. Do these first.

- [ ] **0.1 Sign in** — `eegbase.com/login` accepts `demo@eegbase.com / demo2026`,
      redirects to the dashboard. No JS errors in console.
- [ ] **0.2 Pair Mendi** — From the dashboard, click `Connect device` →
      Mendi → confirm the picker either opens the bridge connection toast
      or the WebBluetooth chooser. The "Mendi live · disconnect" pill
      appears when a frame arrives.
- [ ] **0.3 Live frames arrive** — On the dashboard, the Mendi widgets
      (`Mendi · 4 channels`, `Mendi pulse · BPM`, `Mendi signal rate`)
      update at ≥ 25 Hz within 10 s of pairing. Signal-rate widget is
      green ("clean") not amber.
- [ ] **0.4 Stillness reads sane** — `Stillness · motion` widget reads
      ≥ 80 when sitting still. Drops below 50 when you shake your head.
- [ ] **0.5 Disconnect cleanly** — Click "Mendi live · disconnect".
      Status pill returns to "Connect device". No console errors.

---

## Tier 1 · Save a real session end-to-end

This proves the persistence pipeline (commit `e04c557`) works against
real hardware, not just simulator data.

- [ ] **1.1 Navigate to live-session UI** — `eegbase.com/sessions/live?device=mendi`
      loads without error.
- [ ] **1.2 Fill the pre-session questionnaire** — focus/mood/anxiety/energy
      sliders 1-10 all submit.
- [ ] **1.3 Start a 2-min session** — Reward score climbs and falls
      during serial-sevens vs eyes-closed periods. No dropped-packet
      warning in the diagnostics.
- [ ] **1.4 Mark a moment** — Click `Mark moment` mid-session. The
      annotation lands in `session_annotations` with the correct
      timestampMs.
- [ ] **1.5 Stop + save** — Post-session questionnaire submits with
      clinical notes. Session ID returned.
- [ ] **1.6 Session row created** — `eegbase.com/sessions/<id>` loads.
      Avg reward score matches what you saw live ±1 point.
- [ ] **1.7 Sample count is right** — Session detail shows ≥ 2,500 rows
      for a 2-min session (~31 Hz × 120 s).
- [ ] **1.8 fNIRS chart re-renders** — The saved fNIRS hemodynamics
      chart on the detail page shows the same shape as the live trace.
- [ ] **1.9 Mendi Sensor Diagnostics card** — The 13-aux-field card
      (commit `028dea2`) renders with non-null values for temperature,
      accel, pulse HR, signal quality, ambient.

---

## Tier 2 · Multi-session + client context

These prove the session aggregates correctly into the client record.

- [ ] **2.1 Session appears in list** — `eegbase.com/sessions` shows
      the new session at the top with the right client, device, duration.
- [ ] **2.2 Session appears on client detail** — `clients/[id]`
      includes the new session in the trend chart.
- [ ] **2.3 Client trend chart updates** — Reward score is plotted with
      the new point. No stale-data issues.
- [ ] **2.4 Run a 2nd session** — Same flow. Compare view at
      `sessions/compare?a=X&b=Y` overlays both reward curves.
- [ ] **2.5 Mean ΔHbO trend per validation runbook** — Per the existing
      `validation-runbook.md` Test 3, mean ΔHbO proxy in minute 3 of
      the serial-sevens session is ≥ 0.05 higher than the baseline
      session.

---

## Tier 3 · Exports + AI

- [ ] **3.1 CSV export** — `sessions/[id]/export/csv` includes all 13
      Mendi aux columns with non-empty values. Open in pandas, confirm
      `temperature_c` mean ≈ 23–35 °C, `accel_mag_g` mean ≈ 1.0.
- [ ] **3.2 JSON export** — `sessions/[id]/export` includes a
      `mendi: {}` block per data point (commit `e04c557`).
- [ ] **3.3 EDF export** — sanity-check structure. (Lower priority —
      no Mendi aux fields go through EDF.)
- [ ] **3.4 AI per-session insight** — On the session detail page,
      "Generate insight" fires Claude Haiku and returns a 3-5 sentence
      summary in < 10 s.
- [ ] **3.5 AI client progress summary** — On the client detail page,
      "Generate progress summary" produces a longitudinal multi-session
      summary referencing actual reward-score trends.

---

## Tier 4 · Clinical workflow (real-world clinic use)

These are not Mendi-hardware-dependent but they need to stay green for
a clinician to actually use the app for a billable session.

- [ ] **4.1 Create a new client** — `clients/new` form saves a client
      with name, email, DOB, goals.
- [ ] **4.2 Generate a check-in token** — From client detail, the
      check-in URL `/checkin/<token>` loads the form for the client.
- [ ] **4.3 Portal landing** — `/portal/<token>` renders the 3-card hub
      (commit `f944c99`).
- [ ] **4.4 Submit a check-in** — Form posts; client detail shows the
      new check-in row.
- [ ] **4.5 Assign a protocol from the template library** — Import any
      template from `/protocols/templates` (now 19 templates after
      commit `e3a5d84`) and assign to the client.
- [ ] **4.6 Session uses assigned protocol** — Next live session picks
      up the protocol's target metrics by default.

---

## Tier 5 · Communications + admin

Lowest priority — the operational surfaces around sessions.

- [ ] **5.1 Email summary** — Click "Email Summary" on the session detail.
      With `RESEND_API_KEY` + `RESEND_FROM` set, the client receives the
      HTML+text body. Without env vars set, button shows "Logged (no
      email provider)" (commit `3d2f4dc`).
- [ ] **5.2 PDF report** — `/sessions/[id]/report` prints cleanly from
      Chrome's print dialog.
- [ ] **5.3 Share link** — `/share/[token]` shows the read-only report
      to anyone with the URL.
- [ ] **5.4 SOAP notes** — Create + edit SOAP note for the session.
- [ ] **5.5 Outcome measures** — Score PHQ-9/GAD-7 and persist results.
- [ ] **5.6 Appointments** — Schedule a follow-up via the schedule UI.
- [ ] **5.7 Audit log** — All the above actions appear in
      `/audit-logs` with correct attribution.

---

## Tier 6 · Operations (no Mendi headset required)

- [ ] **6.1 Billing / Invoices** — Create invoice, mark paid.
- [ ] **6.2 Consumables** — Update stock levels.
- [ ] **6.3 Treatment plans** — Create + edit.
- [ ] **6.4 Supervision** — Co-sign a session.
- [ ] **6.5 Notifications** — Trigger one and confirm it lands.
- [ ] **6.6 Settings** — Update clinic name, webhook URL.

---

## Strip-and-rebuild policy

While working through this list:

1. **Hide every page not in the current tier from the sidebar nav.**
   Don't delete the routes — just remove them from the clinician
   navigation. Once Tier N is green end-to-end, expose Tier N+1.
2. **If a test fails, fix the bug or remove the feature.** No "broken
   in production but we'll fix it later" — every feature visible to a
   logged-in clinician must work.
3. **Re-test after every redeploy.** Tier 0 always runs first.

---

## What's already validated

The simulator-driven /demo dashboard surface (36 widgets, 5 device
focus, 9 picker sections) is independently validated via preview and
doesn't gate this runbook. Hardware testing is purely the authenticated
clinician path.

`AUDIT-2026-MENDI-BLE-PROTOCOL.md` documents the BLE protocol decode
(resolved). `scripts/mendi-capture/validation-runbook.md` documents the
decoder-level activation test (serial sevens vs baseline).
