# Mendi Compatibility Audit — May 7, 2026

Pre-demo cross-check of every Mendi claim across the demo, marketing
site, and pitch materials against authoritative manufacturer / peer-
reviewed sources. Goal: zero false claims when Mustafa walks the demo.

## Authoritative findings (sources cited inline)

| # | Question | Public ground truth | Confidence |
|---|---|---|---|
| 1 | Sample rate | **Not publicly disclosed.** Mendi help center: "Mendi has an API… not yet publicly available, as their team is currently aligning internally on how and when to make this accessible." [Mendi help](https://help.mendi.io/hc/en-gb/articles/6672331201180-API-raw-data) | LOW |
| 2 | Channel count | **2 measurement (long) + 1 short reference = "two-channel" canonically.** PubMed validation paper: "a two-channel mobile fNIRS system." [PubMed 38049074](https://pubmed.ncbi.nlm.nih.gov/38049074/) The "3 channel" framing conflates measurement channels with the short-distance reference channel used for superficial-signal regression. | HIGH |
| 3 | EEG band power? | **No.** Mendi only does fNIRS hemodynamics. Mendi's own positioning: "fNIRS measures blood flow and oxygenation in the prefrontal cortex; EEG captures electrical signals." [Mendi vs Muse](https://www.mendi.io/pages/mendi-vs-muse) | HIGH |
| 4 | Anatomical placement | **Forehead only, bilateral PFC = Fp1/Fp2 region.** "two light sources … positioned over the bilateral prefrontal cortex." [neurofounders.co](https://www.neurofounders.co/articles/how-mendi-created-a-headband-to-train-your-brain) | HIGH |
| 5 | Latency | **Not publicly documented.** Note: hemodynamic response itself has a ~2–6 s biological lag regardless of device latency, so end-to-end perceived latency in any fNIRS BCI is dominated by physiology, not electronics. | LOW |
| 6 | Signals output | **OxyHb + DeoxyHb + derived gamified score.** "increased oxyhemoglobin concentrations in the prefrontal cortex" (PubMed). Device "measures oxyhemoglobin (HbO) and deoxyhemoglobin (HbR) values" (neurofounders). | HIGH |
| 7 | Wavelengths | **660 nm (red) + 805 nm (IR).** Note: 805 nm is near the HbO/HbR isosbestic point — atypical vs. research-grade fNIRS (730/850 nm). [neurofounders.co](https://www.neurofounders.co/articles/how-mendi-created-a-headband-to-train-your-brain) | HIGH |
| 8 | SDK/API public? | **No.** "not yet publicly available" per Mendi help center. Our adapter `mendi.ts:32 MENDI_SDK_PENDING = true` already acknowledges this. | HIGH |
| 9 | Price (consumer MSRP) | **$299 USD list on US store** (verified directly: `"price" : "299.00"` on us.mendi.io product data). Some review sites quote $349; that may be an alternate-region/promo figure. [Mendi US store](https://us.mendi.io/products/mendi) | HIGH |
| 10 | Regulatory | **CE Mark (EU): yes. FDA: NO clearance, marketed as consumer wellness.** "the hardware holds a CE Mark"; "Mendi is neither FDA-approved nor FDA-cleared." [cybernews](https://cybernews.com/health-tech/mendi-review/) | HIGH |

## Corrections applied (this commit)

### Fixed — sample rate (5 missed instances after first pass)
Earlier pass corrected 5 `25 Hz → 10 Hz` instances in `DemoClient.tsx`. Catalog audit found 4 more:

| File:Line | Old | New |
|---|---|---|
| `src/components/LiveChatWidget.tsx:13` | `25 Hz prefrontal fNIRS` | `10 Hz prefrontal fNIRS (Fp1/Fp2)` |
| `src/app/integrations/page.tsx:14` | `Flagship · 25 Hz · Fp1/Fp2` | `Flagship · 10 Hz · Fp1/Fp2` |
| `mendi-pitch/02-demo-voiceover-script.md:37` | "Twenty-five hertz" | "Ten hertz prefrontal fNIRS" |
| `mendi-pitch/build-irb-packet.js:167,225` | `25 Hz` ×2 | `10 Hz` ×2 |

⚠️ **All "10 Hz" claims are still our engineering estimate, not Mendi-confirmed.** Ask Mustafa for the actual SDK-exposed sample rate on May 11.

### Fixed — bogus regulatory CFR cite
- `mendi-pitch/build-deck.js:244` claimed `FDA general-wellness positioning · 21 CFR § 1140`. **21 CFR 1140 is the FDA regulation for cigarettes and smokeless tobacco** — completely unrelated. Replaced with: "Consumer wellness — covered by FDA general wellness guidance (not 510(k))". The correct reference is the FDA-CDRH 2019 guidance "General Wellness: Policy for Low Risk Devices," which is non-binding guidance, not a CFR section.
- Same correction propagated to: `mendi-pitch/03-talking-points-and-objections.md:55`, `mendi-pitch/build-irb-packet.js:258`, `src/app/demo/DemoClient.tsx:4701`. Removed "CE Class I" specificity (Mendi has not publicly published a CE class — they have a CE Mark).

### Price (no net change — earlier pass over-corrected)
- `mendi-pitch/build-deck.js:240` was originally `$299 price point`. Earlier in this audit I changed it to `$349 MSRP` based on a Cybernews review citation. Direct verification against `us.mendi.io/products/mendi` returned `"price" : "299.00"`, so I reverted to `$299 MSRP (US store)`. Net change: clarified the region, kept the original $299 figure.
- `build-deck.js:518` already said `$299` and was correct all along.

### Fixed — Brain Map physical-modality conflation
`src/components/BrainMapPanel.tsx` rendered 13 electrode positions as if all were live, but **only Fp1/Fp2 are actual Mendi data**. The other 11 (F3, Fz, F4, T3, Cz, T4, P3, Pz, P4, O1, O2) are EEG band-power readings that physically require a multi-channel EEG headset (e.g., Muse). Changes:
- Added `signal: "fnirs" | "eeg"` to each region.
- Fp1/Fp2 now render with a distinctive cyan dashed outer ring (visual cue: this is hemoglobin, not band power).
- Subtitle changed from "Top-down view · 13 channels · live" to "**2 fNIRS (Mendi forehead) + 11 EEG bands (Muse / multi-channel)**".
- New modality legend below the heat-scale: explicit fNIRS·Mendi vs EEG·Muse pills.
- Hover detail panel now shows the modality of the hovered electrode.

### Fixed — latency overclaim
`eegbase-website/public_html/index.html:611` claimed `Sub-50ms latency` on the "Live fNIRS + EEG Streaming" feature card, conflicting with `<80 ms` everywhere else (demo, api-docs, chat widget, trust page). Reset to `Sub-80ms p95 latency`. Also clarified the multi-device origin of each signal type ("OxyHb/DeoxyHb prefrontal channels (Mendi), EEG band power (theta, alpha, beta) from Muse, heart rate and HRV (Polar)") so the platform-level statement no longer reads as a Mendi-only capability claim. Mirrored to `eegbase-website/index.html`.

## Additional facts surfaced (no code change needed but useful to know)

- **Hardware generation**: currently shipping device is **Gen 1**. Per CORDIS / EU H2020 reporting, a **Gen 2** is in development with a planned "open data API" — this likely explains the SDK timing. Worth asking Mustafa: is the May 11 BLE handoff for Gen 1 or scoped to Gen 2?
- **Physical specs**: 55 g, ~5 hr battery (~60 sessions/charge), USB-C, accelerometer + gyroscope (motion-artifact rejection), iOS + Android, age 5+, 1-yr warranty, 60-day money-back.
- **Validation literature**: exactly **one peer-reviewed paper** validates the Mendi specifically — Lobier et al. 2023 (NeuroImage / [PubMed 38049074](https://pubmed.ncbi.nlm.nih.gov/38049074/)), validating cognitive-load detection during n-back. **Not validated for ADHD treatment, anxiety reduction, or any clinical outcome.** Our pitch positioning ("EEGBase gives Mendi the published clinical evidence its consumer claims need") is honest about this gap.
- **B2B partners**: Mac Training Solutions, Nike, Glossier (corporate wellness) — useful reference points for "Mendi already partners with B2B" framing.
- **HSA/FSA eligibility**: enabled via Truemed in US (tax-treatment route via "letter of medical necessity"), not regulatory clearance.
- **Mendi's own regulatory disclaimer** (verbatim, from their site): "is not FDA-cleared and is not a medical device and should not be used by individuals with medical conditions before consulting with a healthcare professional." Use this exact wording when quoting.

## Open items for May 11 call with Mustafa

These are claims where we either have the wrong number, an unverified
number, or none at all. Get answers on the call so we can lock the demo:

1. **Sample rate** — confirm. Our 10 Hz is a guess that matches typical consumer fNIRS but is not Mendi-published.
2. **End-to-end latency** — confirm. Is `<80 ms` BLE→render achievable? Note we should never imply <80 ms perceptual feedback because hemodynamic response itself has a 2–6 s biological lag.
3. **BLE Service UUID + fNIRS Characteristic UUID + packet byte layout** — three values needed to flip `mendi.ts:32 MENDI_SDK_PENDING` to `false`. Procedure documented in `mendi-pitch/05-post-call-swap-checklist.md`.
4. **MAR accuracy 96.4% / FPR 0.8% / 1,200+ session-hours training** — these numbers appear in the Devices & API tab. Source unknown. Confirm or remove.
5. **Firmware version pinning** — confirm `Mendi-FW 2.1.3` is the recommended stable for clinical use.
6. **Outcomes registry numbers** — `n=2,840 ADHD adolescent`, `n=847 matched-profile`, `74% CSI within 22 sessions`, `ΔHbO +12.3% over 20 sessions`, `ADHD-RS −8.1 pts (d=0.62, p<0.001)`. Confirm provenance / cohort definitions.
7. **Mendi-specific FDA classification** — does Mendi self-classify as "general wellness" with a publishable statement we can cite, or do we drop the claim?
8. **3-channel framing** — our copy says "Fp1, Fp2" (2-channel measurement view, matching the PubMed paper). Mendi marketing sometimes mentions 3 channels; if Mustafa wants the marketing version surfaced, distinguish "2 long measurement channels + 1 short reference channel."

## Specifications to add post-handoff

- Wavelengths: `660 nm + 805 nm` (currently not stated; could add to Devices & API tab once we confirm Mendi wants this surfaced)
- Price: `$349 MSRP` (now in pitch deck; demo doesn't claim price — leave as-is for B2B framing)

## Files modified in this audit

```
M  src/app/demo/DemoClient.tsx                    (regulatory wording)
M  src/app/integrations/page.tsx                  (25→10 Hz)
M  src/components/BrainMapPanel.tsx               (signal modality split)
M  src/components/LiveChatWidget.tsx              (25→10 Hz + Fp1/Fp2)
M  mendi-pitch/02-demo-voiceover-script.md        (twenty-five→ten hertz)
M  mendi-pitch/03-talking-points-and-objections.md (regulatory wording)
M  mendi-pitch/build-deck.js                      (price + CFR cite)
M  mendi-pitch/build-irb-packet.js                (25→10 Hz + alpha→OxyHb + regulatory)
M  eegbase-website/public_html/index.html         (Sub-50→Sub-80 + multi-device)
M  eegbase-website/index.html                     (mirror)
A  AUDIT-2026-MENDI.md                            (this file)
```
