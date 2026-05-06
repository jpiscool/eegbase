# Mendi pitch · pre-meeting kit

Everything you need before the call.

## Files

| File | Purpose | When to use |
|--|--|--|
| `EEGBase-Mendi-Pitch-Deck.pptx` | 15-slide pitch deck | Open during the call · slides 6 + 15 are dark/conclusion · slides 7-8 are most likely to spark discussion |
| `01-pre-meeting-email.md` | Pre-meeting agenda email | Send 48 hours before the meeting |
| `02-demo-voiceover-script.md` | 60-sec demo voiceover script + Loom recording instructions | Record the night before. Backup if Wi-Fi/BLE fails |
| `03-talking-points-and-objections.md` | Top 12 objections + your answers · what to say + not to say · energy management | Print and keep open in a second tab during the call |
| `04-one-pager.md` | One-page summary content for designer | Send to designer for a printable PDF leave-behind |
| `build-deck.js` | pptxgenjs source for the deck | Edit and re-run if you want to change anything in the deck |

## Re-build the deck after edits

```bash
cd mendi-pitch
NODE_PATH=$(npm root -g) node build-deck.js
```

## Deck structure (15 slides)

1. **Cover** (dark) — Partnership Proposal Q2 2026
2. The wedge — clinicians can't prescribe Mendi today
3. Mendi today — what you have / what's missing
4. Market — $2.1B · 47k clinicians · +38% attach · 1.6× referrals
5. Product — 4 streams → 1 client record
6. **Live demo** (dark) — eegbase.vercel.app/demo + 60-sec tour
7. Why now — 4 timing tailwinds
8. **Three partnership tiers** — Referral / Deep / White-label
9. Clinical evidence path — Pre-print → Registry → RCT
10. Co-published case studies — 67% / −7.2 / −18.7%
11. Cannibalization mitigation — +38% / 1.6× / $8.2k / <2%
12. Commercials — 3-stream rev model
13. Compliance & honest gaps — what we have, target dates for what we don't
14. Team — operating experience > titles
15. **The ask** (dark) — NDA / clinician intro / 90-day pilot

## Three things you want them to do

1. Sign a mutual NDA (today)
2. Intro to one Mendi-attached clinician (this week)
3. Agree to a 90-day pilot, 3 clinics, referral tier first (this month)

Don't leave the call without naming all three out loud and asking which they'll commit to.
