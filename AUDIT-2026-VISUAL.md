# EEGBase Visual Demo Audit — Chunk 4

**Date:** 2026-05-07
**Mode:** Production (`npm run build && npm start`)
**Viewport:** 1440×900 desktop (Chromium, dark theme default)
**Route audited:** `/demo` (16 sections, intro modal + 8 sampled tabs)
**Server:** stopped at end of audit

---

## Tabs sampled (≤8 screenshots, per memory budget)

| # | Tab                  | Outcome  |
|---|----------------------|----------|
| 1 | Intro modal          | OK       |
| 2 | Live Session         | OK *     |
| 3 | Brain Map            | OK       |
| 4 | AI Insights          | OK       |
| 5 | Reports              | OK       |
| 6 | Compliance           | ⚠️ stale  |
| 7 | Devices & API        | ❌ wrong  |
| 8 | Marketing            | OK       |

\* Cookie banner + onboarding popover overlap stat row on first paint — non-blocking, dismissible.

---

## Findings

### ❌ Blocker — Mendi sample rate misstated as 25 Hz (5 instances)

`src/app/demo/DemoClient.tsx` references **25 Hz** for the Mendi fNIRS stream in:

- L5184  driver intro paragraph
- L5188  spec table (`Sample rate: 25 Hz`)
- L5233  pair-headset toast
- L5368  device list channel string
- L5414  LSL outlet `srate` for `EEGBase_Mendi_OxyHb`

But the actual adapter `src/lib/device/mendi.ts:37` uses
`const SAMPLE_INTERVAL_MS = 100; // Mendi samples at ~10 Hz`.

**Risk:** Mustafa will see "25 Hz" in the demo on May 11. If he asks
about the BLE characteristic packet cadence, the truth (10 Hz) will not
match what's on screen. Pick a single number and propagate it before
the call.

**Recommendation:** keep 10 Hz (the simulator and memory both confirm
this matches Mendi's actual hardware rate). Sed-replace `25 Hz` →
`10 Hz` in the 5 locations above and the `LSL` outlet `srate`.

### ⚠️ Stale — Compliance cards still claim Q1 2026 timelines

Compliance tab badges:
- **HITRUST CSF:** `In progress · Self-assessment 2026`
- **SOC 2 Type II:** `Certified · Audit completed Q1 2026`

The trust-page audit on May 8 already flagged the SOC 2 / Bishop Fox /
WCAG dates as stale (it's now Q2 2026). Demo copy carries the same
issue. Confirm true status with user before May 11; if SOC 2 is in
fact still in flight, downgrade to "In progress · target Q3 2026".
If certified, attach issuer + date.

### ⚠️ Minor — Onboarding popover overlaps Live Session stat row

The "Explore the demo · 1 of 16 sections visited" panel anchors
bottom-right and obscures the rightmost column of the session
controls/window-size buttons until dismissed. It does not block
keyboard nav, but visually competes with the Reward Score gauge on
first paint of the Live Session tab. Consider auto-collapsing the
popover after first interaction with the canvas.

### ✅ Confirmed working
- Sidebar navigation across all sampled tabs (no JS errors,
  router-free state changes feel instant)
- "FOR MENDI" pill correctly appears on 6 sidebar items (Live Session,
  AI Insights, Reports, Marketing, Devices & API, Game Mode partial)
- Reports tab cohort numbers match the May-8 voiceover audit
  (`n=2,840 ADHD-RS`, `n=87 burnout`, `n=412 clinics`)
- Brain Map normative comparison uses `n=847` cohort label
  (matches the resolved one-pager fix)
- AI Insights "decision-support, not medical advice" disclaimer
  present and prominent
- Devices & API Mendi card shows "Preferred · Non-Exclusive" badge
  (correct framing per pre-call positioning)

---

## Memory & process notes

- Production server (`npm start` on port 3000) sat at ~190 MB after
  warmup vs. ~1.3 GB for `next dev`. Chunk 4 finished comfortably
  inside the 2 GB headroom.
- 8 screenshots × ~1300 tokens ≈ 10k tokens consumed by image frames
  in this conversation. Stayed well under the 30+ screenshot
  ballooning threshold flagged in memory.
- Server stopped via `preview_stop` at end of audit (see commit log
  in MEMORY.md).

---

## Action items for user

1. **Decide Mendi sample rate** (10 Hz vs 25 Hz) and apply across
   the 5 DemoClient.tsx locations.
2. **Refresh Compliance card dates** (SOC 2, HITRUST, Bishop Fox)
   before May 11 demo.
3. *(Optional)* Auto-dismiss the onboarding popover after first
   canvas interaction.
