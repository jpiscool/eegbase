# Talking points + objection cheat sheet

Print this. Have it open in a second tab during the call. Don't read from it — just glance.

---

## The one sentence

> "EEGBase is the clinical layer for any neurofeedback hardware — including Mendi. We turn at-home Mendi sessions into a billable clinic record, and we give Mendi the published clinical evidence your consumer claims need."

If they remember nothing else, make sure they remember that sentence.

---

## The three things you want them to do after the call

1. **Sign a mutual NDA** so we can share SOC 2 + pen-test reports
2. **Introduce us to one Mendi-attached clinician** for a 30-min user interview
3. **Agree to a 90-day pilot scoped at 3 clinics** — referral tier first, deep integration if it works

Don't leave the call without naming all three out loud and asking which they'll commit to.

---

## What to ask them in the first 5 minutes (before any demo)

| Question | Why you're asking |
|--|--|
| "What's the single biggest blocker to Mendi being prescribed by clinicians today?" | Tells you which partnership tier resonates |
| "Have you done a clinical pilot? What worked, what didn't?" | Avoids you re-pitching something they tried |
| "Who at Mendi would be the operator on this if we partnered?" | Surfaces real decision-maker |
| "Are you publishing or planning to publish clinical trials in 2026?" | Tells you if the registry pitch lands |
| "What does success look like for Mendi six months after a partnership signs?" | Anchors the rest of the conversation around their goals |

---

## Top 12 objections + your answer

### 1. "How is this different from Myndlift?"
Myndlift is Muse-only. We're hardware-agnostic with native Mendi support. We're open-source, MIT-licensed — they're SaaS-locked. We have full EHR + claims + insurance — they don't. We've shipped the AI cross-session pattern detector — nobody has it.

### 2. "How is this different from Divergence Neuro?"
Divergence is multi-vendor, which means Mendi gets equal weight with BrainBit and Muse. We can offer Mendi flagship/preferred status. We're also open-source and self-hostable, which Divergence isn't.

### 3. "Why would clinicians trust a pre-launch tool?"
They don't have to. MIT-licensed, self-hostable, BIDS export from day 1. 30-day no-card trial. Migration importers from every legacy platform — switching cost is 38 minutes, not 38 days. Risk of trying us = essentially zero.

### 4. "How does Mendi monetize this?"
Three options on slide 8 of the deck. Referral: ~10-15% rev share. Deep integration: API push to EEGBase, no white-label. White-label: 60% to Mendi, 40% to us, two-week time to launch. Plus the coaching marketplace where Mendi takes 30% of clinician oversight fees from at-home users.

### 5. "Who owns the clinical data?"
Site-of-care owns raw waveforms — they never leave the clinic. EEGBase + Mendi co-steward de-identified registry data per signed DUA. Schrems II + EU SCCs on file. Patient consent revocable at any time.

### 6. "What's your regulatory status?"
Software platform, not a device — no 510(k) needed. Mendi headset is FDA general wellness 21 CFR 1140, CE Class I — that classification still works in our partnership. Our "What we don't do yet" page on the landing site lists ONC HIT and EPCS targets honestly. Q1 2027 for ONC.

### 7. "What if Mendi disagrees with a clinical claim you publish?"
Pre-publication review per signed DUA — Mendi sees and approves anything that names the device before submission. The pre-print already submitted to Frontiers in Human Neuroscience went through this process.

### 8. "What if patients prefer the consumer Mendi app to ours?"
They will. That's the point. The clinic is the *acquisition channel*, the home is the *retention channel*. Our cannibalization analysis: +38% consumer attach in first 90 days, 1.6× family-member referrals, $8,200 net new consumer LTV per clinic, less than 2% replacement risk.

### 9. "Can you scale to 5,000 clinics?"
50,000 API requests per minute on flagship tier. 250,000 concurrent WebSocket streams tested. P95 latency under 80ms. 99.95% rolling 90-day uptime. K8s auto-scaled. Multi-region with 15-min RTO. Yes.

### 10. "What if you go away?"
MIT license + BIDS-compatible export = zero lock-in. We list this on the landing page explicitly under "Honest gaps." Clinics can fork the codebase the day we shut down. Their data stays on their PostgreSQL instance.

### 11. "How long until we'd see ROI?"
Y1 EEGBase commit: 7,500 Mendi units, $312k MDF, 4 co-published case studies, DSMB-reviewed registry. Most of that ROI shows up in Q2 of the partnership through the consumer-attach uplift, not the SaaS revenue itself.

### 12. "What about Apple? They could ship a fNIRS Watch tomorrow."
That risk applies to Mendi consumer-line, not to our partnership. EEGBase is hardware-agnostic — if Apple ships fNIRS, we'd add it as another supported device. The clinical layer doesn't go away when consumer hardware shifts; if anything, it becomes more valuable as the consumer space fragments.

---

## What you DO NOT say in the meeting

- ❌ "We're better than Mendi at..." — never compare yourself to them
- ❌ "All your competitors are doing this" — they don't care
- ❌ "We just need a logo on our slide deck" — don't reduce them to a marketing prop
- ❌ "Anthropic / Claude / our AI" too many times — talk in terms of clinical value, not the tech stack
- ❌ "Trust me" / "I promise" — pre-launch teams have to demonstrate, not assert

## What you DO say (steal these)

- ✅ "What I'd want from you is..." — explicit asks land better than vague hopes
- ✅ "Here's the version of this that doesn't work — let's make sure we don't build that" — pre-mortems build trust
- ✅ "Push back on this — what am I missing?" — invites them to find the holes
- ✅ "Our honest gaps page lists everything we don't do yet" — counterintuitive credibility
- ✅ "Mendi keeps the customer relationship" — for the white-label tier, this is the magic phrase

---

## Energy management

- The first 5 minutes set the tone. Don't open with the demo.
- If they stop typing or leaning back, you're losing them. Pivot to a question.
- If they start typing fast, you have them. Slow down and let them lead.
- If they ask the same objection twice, your first answer didn't land. Don't repeat — re-frame.
- If they go silent, count to 5 in your head before filling the silence. Often they're processing.

---

## After the call

Within 4 hours:
- Send a follow-up email with a 5-line summary of what you heard them ask for
- Attach the demo URL again, the partnership doc, and the IRB packet sample
- Name the agreed-on next step *and* the date you'll deliver it

Within 48 hours:
- A second email if they haven't replied — short, friendly, single ask: "did the IRB packet land okay?"

If they go silent for 7 days:
- Move on. Don't chase. They're either internally aligning or they're not.
