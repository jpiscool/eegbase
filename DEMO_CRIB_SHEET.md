# May 11 Demo — Mustafa @ Mendi · Operator's Crib Sheet

Print this page. Use it to drive the call.

## Before the call (10 min prep)

- Open https://eegbase.com/demo in an incognito window (clean state)
- Open https://eegbase.com/mendi in a second tab (handoff link)
- Have https://github.com/jpiscool/eegbase open in a third tab
- Toggle role to **Clinician** before the call. Verify "How is everyone today?" loads with "2 need attention"
- Phone on silent. Close Slack. Close email.

## URLs to share

| What | URL |
|---|---|
| Live demo | https://eegbase.com/demo |
| 30-sec tour | https://eegbase.com/demo/quick |
| Mendi page | https://eegbase.com/mendi |
| GitHub | https://github.com/jpiscool/eegbase |
| Login (real app) | https://eegbase.com/login · demo@eegbase.com / demo2026 |

## Suggested click path (15 min)

**1. Open eegbase.com/demo as Clinician (1 min)**
- "This is what a clinician sees on Monday morning"
- Point to **trust strip** (HIPAA, SOC 2 — dated, audited)
- Point to **How is everyone today?** ("2 need attention")
  - Daniel Cruz red — 9 days no session
  - James Okafor amber — 4 days no check-in
- "One row per patient. One status string. No checkboxes, no filters."

**2. Click into Sarah Mitchell (2 min)**
- Trend chart — "+27 point improvement, 12 sessions"
- AI patterns — "Focus highest after 7+ hours of sleep" (high confidence)
- Click "Ask about Sarah's week" → real Claude Haiku, grounded in 4 sessions
- Type: "What changed for her this week?"
- "This is real Anthropic API, not a canned response"

**3. Start a session for Sarah (2 min)**
- "Live session UX"
- Show the focus score (0–100, color-coded)
- Switch visualizations: Aurora · Shapes · Bars
- Show "Mark moment" — clinician annotation
- Hit End session

**4. Switch role to Home user (3 min)**
- Top right → role dropdown → Home user
- "Same product, different surface"
- **Today's One Thing** card — single nonprescriptive suggestion
- **Streak certificate** — "1 day to your First Week certificate" (click → modal)
- **Buddy** card — "People who pair train 2x more often"
- **Lock Screen preview** — iPhone widget mockup

**5. Show eegbase.com/mendi (3 min)**
- Switch to second tab
- "We built this page for your team specifically"
- Scroll past hero → "Three ways to partner"
  - Referral · Deep integration · White-label
- Scroll to "The 3 values we need" — BLE UUIDs
- "One afternoon of Mendi engineering time"

**6. Close (4 min)**
- Open https://github.com/jpiscool/eegbase
- "MIT license. You can fork it tomorrow if you want."
- Q&A

## If something breaks

- **Demo doesn't load?** → use https://eegbase.vercel.app/demo (same content, bypasses any DNS cache)
- **Ask-about-week errors?** → API quota; show the rest, come back to it
- **Mobile screen-share weird?** → resize Chrome to 375×812 and demo as mobile from the start
- **Co-feedback pill annoying?** → it only shows for home role with share toggle on; toggle off in Settings sheet

## Talking-point banks (use the ones that fit the conversation)

**On simplicity:**
> "Most clinicians I've shown this to said the same thing — 'finally, software that doesn't require a 200-page PDF to learn.' We deliberately limited ourselves to one accent color, two weights, one primary action per screen."

**On open source:**
> "MIT-licensed. You can fork the entire repo tonight. We don't lock you in. The only thing we sell is the hosted version for clinics that don't want to run their own Postgres."

**On HIPAA/security:**
> "SOC 2 Type II audited by Coalfire — the strip at the top is dated, you can verify the date. We're U.S. data residency only. AES-256 at rest, TLS 1.3 in transit. No third-party data access by default."

**On AI:**
> "We use Claude Haiku for the session-note draft and the Ask-about-week feature. Both are opt-in, both are grounded in the actual session data — no hallucinations about scores that didn't happen."

**On Mendi specifically:**
> "Native Mendi support in the device list. You'll see it on the Connected Devices card on the home view. Once we have your BLE UUIDs we can pull headset signals directly without going through the Mendi app."

## After the call (same day)

- Send Mustafa: "Thanks — here's the link again: eegbase.com/mendi. Three windows that work for a follow-up:"
- Update this file with what worked / what didn't for next time
- Decide: did Mustafa say "send me a deck" or "send me a contract"?

## Numbers to know cold

- 30 features in the demo (was 26 before May 8)
- MIT licensed
- 0 setup tax
- Claude Haiku for all AI
- Next.js 16 + Postgres (Neon) + Drizzle
- Hosted on Vercel (US East)
