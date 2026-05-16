# Mendi hardware-in-the-loop validation runbook

**Prerequisite:** `AUDIT-2026-MENDI-BLE-PROTOCOL.md` complete; `MENDI_PROTOCOL_PENDING = false` in `src/lib/device/mendi.ts`; unit-test fixtures populated in `mendi-decoder.test.ts`.

**Goal:** Prove a real Mendi headband can pair with EEGBase, stream live data into the demo, persist a session, and produce a measurable physiological response on a known PFC task.

When all four checks below pass, Phase 6 of the build plan (site copy: flip "in development" → "live") is unblocked.

---

## Setup

1. Power on Mendi headband, ensure ≥ 50 % battery.
2. Close the Mendi consumer app (BLE allows only one master).
3. Open Chrome on macOS or Windows. (No Safari — no Web Bluetooth on iOS.)
4. Start the dev server: `npm run dev`.
5. Open `http://localhost:3000/sessions/live?device=mendi`.
6. Click pair → choose "Mendi-XXXX" from the chooser.

---

## Test 1 — Smoke test (signal presence)

**Procedure:** 30 seconds of any movement.

**Pass criteria:**
- [ ] Pairing chooser shows the headband.
- [ ] After pair, `FNIRSChart` shows non-zero values for all four channels (`oxyHbLeft`, `oxyHbRight`, `deoxyHbLeft`, `deoxyHbRight`).
- [ ] Reward gauge shows a value 0–100.
- [ ] No exceptions in the browser console.
- [ ] No "Failed to connect" error in the UI.

**On failure:** check the console for the actual error. If "GATT operation failed" → the Mendi consumer app is probably still connected to the headband.

---

## Test 2 — Quiet baseline (5 min)

**Procedure:** sit still, eyes open, neutral. Run a 5-minute session in EEGBase. Click **Stop & Save**.

**Pass criteria:**
- [ ] Row in `sessions` table with `device_type='mendi'`.
- [ ] ≥ 2,500 rows in `session_data_points` for that session_id (5 min × 60 s × 10 Hz × 0.85 floor).
- [ ] Reload `/sessions/[id]` → the saved chart re-renders.
- [ ] Mean ΔHbO proxy over the session is in the **±2 (unitless, scaled ×10)** range produced by `MendiPacketDecoder`. Values are not in μM — see note at the bottom of this runbook.

Save the session id as `BASELINE_SESSION_ID`.

---

## Test 3 — Prefrontal task (5 min)

**Procedure:** subject does serial sevens (subtract 7 from 1000 repeatedly) silently in their head for 5 minutes. Same headband placement as Test 2. Save.

**Pass criteria:**
- [ ] Same data-quality metrics as Test 2.
- [ ] Mean ΔHbO proxy during minute 3 of this session is **at least 0.05 higher (in the decoder's unitless ×10 scale)** than mean during minute 3 of `BASELINE_SESSION_ID`. The proxy is monotonic with true ΔHbO so direction is meaningful; the threshold is empirical, not physiological.

Save as `TASK_SESSION_ID`.

To compute: open `http://localhost:3000/sessions/compare?a=BASELINE_SESSION_ID&b=TASK_SESSION_ID` (existing comparison view) OR query directly:

```sql
SELECT
  AVG(oxy_hb_left + oxy_hb_right) / 2 AS mean_hbo
FROM session_data_points
WHERE session_id = '<id>'
  AND timestamp_ms BETWEEN <session_start + 120000> AND <session_start + 180000>;
```

---

## Test 4 — Edge cases

| Scenario | Expected behaviour | Pass? |
|---|---|---|
| Power off headband mid-session | UI shows disconnect indicator; no console exception; Save still works on whatever was buffered | ☐ |
| Two Mendi devices in BLE range | Pairing chooser shows both; user selects one | ☐ |
| Browser tab backgrounded for 30 s | Session continues recording (BLE notifications survive throttling); on return, chart catches up | ☐ |
| Page reload mid-session | Adapter cleanly disconnects; no GATT-stuck-open errors on next pair attempt | ☐ |
| Low battery (< 10 %) | If battery service is exposed, surface in UI; if not, document the gap | ☐ |

---

## Test 5 — Cross-check vs. Mendi consumer app (optional but recommended)

Single BLE master → cannot run both apps simultaneously. Instead, run two consecutive 5-min sessions on the same subject:

1. Session A in EEGBase (record reward-score-over-time)
2. Session B in Mendi consumer app (screenshot reward-score-over-time)

Compute Pearson correlation between the two reward curves. **Pass:** r > 0.5. (Lower correlation ≠ failure — different windowing / smoothing — but a strong negative correlation would be a red flag.)

---

## When all 5 tests pass

1. Capture screen recording of: pair → 60 s session → save → reload `/sessions/[id]`.
2. Save the recording at `scripts/mendi-capture/session-fixtures/v1-validation.mp4`.
3. Save the actual session DB rows (export to CSV) at `scripts/mendi-capture/session-fixtures/v1-validation.csv`.
4. Proceed to **Phase 6** of the build plan: flip site copy from "in development" → "live" across:
   - `src/app/integrations/page.tsx` (Mendi tile status: "beta" → "live")
   - `src/components/SearchableFAQ.tsx` (devices Q)
   - `src/app/devices/page.tsx` (Mendi roadmap items)
   - `src/app/mendi/page.tsx`
   - `src/app/investors/page.tsx`
   - `src/app/status/page.tsx`

Commit message convention:
```
mendi: validated with hardware (session id <id>) — flip "live" across site
```

---

## Note on units

The current `MendiPacketDecoder` outputs a **unitless ΔHbO/ΔHHb proxy** scaled by an empirical `SCALE = 10`, not real μM. The formula is `-((red_cor - baseline_red_cor) / baseline_red_cor) × 10`, a simplified ratio against the first-packet baseline of `red - amb` (ambient-corrected red intensity).

This proxy is monotonic with true ΔHbO — when prefrontal HbO rises, the proxy rises — so direction-based pass criteria above are valid. However, the *magnitude* is arbitrary. True μM calibration requires:

1. Per-wavelength molar extinction coefficients (ε_HbO and ε_HHb at 660 nm and 940 nm)
2. Differential pathlength factor (DPF) for the forehead at adult age
3. Source-detector separation (Mendi V4 optode geometry)
4. The `Calibration` characteristic (`fc3eabb6-...`) for per-channel offsets

None of those are wired in yet. Treat the proxy as a relative activation signal until full mBLL is implemented.
