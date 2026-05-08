# EEGBase Demo Software — Static Audit (Chunk 3)

_Date: 2026-05-08_
_Reference: `eegbase-website/COMPETITIVE-BRIEF.md` and `eegbase-website/AUDIT-2026-MARKETING.md`_

This audit ran **without a dev server** to keep memory pressure low. All findings come from `Grep` and `Read`-with-offset, and all fixes were applied via `sed` or targeted `Edit`.

---

## Issues found

### High severity (SEO + branding integrity)

| # | Issue | Location |
|---|-------|----------|
| 1.1 | `eegbase.vercel.app` referenced as canonical in **sitemap.ts BASE** — Google would index Vercel preview as primary site | `src/app/sitemap.ts:3` |
| 1.2 | `eegbase.vercel.app` in **robots.txt Sitemap directive** — search engines hit wrong URL | `public/robots.txt` |
| 1.3 | `eegbase.vercel.app` in **changelog/rss.xml SITE_URL** — RSS readers + Google Discover get wrong canonical | `src/app/changelog/rss.xml/route.ts:4` |
| 1.4 | `eegbase.vercel.app` in **`.well-known/security.txt`** (6 refs) — security researchers misroute disclosures | `public/.well-known/security.txt` |
| 1.5 | `eegbase.vercel.app` in BibTeX citation, signup copy, terms copy, investors copy, sample BIDS file | 5 files in `src/app/` + `public/downloads/` |
| 2 | `github.com/eegbase/eegbase` (wrong owner — 404s) used in pitch-deck **generators** (`build-deck.js`, `build-irb-packet.js`) — would re-emit broken URL on every regeneration | `mendi-pitch/build-deck.js:143`, `mendi-pitch/build-irb-packet.js:358` |
| 3 | Same wrong GitHub URL in two pitch markdown files (external-facing) | `mendi-pitch/01-pre-meeting-email.md:28`, `mendi-pitch/04-one-pager.md:64` |

### Medium severity (code quality)

| # | Issue | Location |
|---|-------|----------|
| 4 | `dangerouslySetInnerHTML={{__html: p.target}}` used solely to render `&gt;` HTML entity — XSS-safe (data is hardcoded) but unnecessary risk pattern | `src/app/demo/DemoClient.tsx:3680` (data line 3663) |

### Inspected and clean

- ✅ No exposed secrets (sk_, api keys, password=)
- ✅ No `target="_blank"` without `rel="noopener noreferrer"` (multi-line JSX caused a false positive)
- ✅ No `<img>` or `<Image>` missing alt text
- ✅ No `@ts-ignore` (only one legitimate `@ts-expect-error` for CSS custom property)
- ✅ Only 1 honest TODO (`sessions/[id]/actions.ts:32` — Resend/SendGrid integration stub)
- ✅ Server-side `console.error` / `console.log` are intentional placeholders for email integrations
- ✅ Layout's `dangerouslySetInnerHTML` is for JSON-LD `<script>` (canonical safe pattern)

---

## Fixes applied

### Fix 1: vercel.app → eegbase.com (9 occurrences across 8 files)

```
src/app/sitemap.ts                  ✓ BASE updated
src/app/changelog/rss.xml/route.ts  ✓ SITE_URL updated
src/app/research/page.tsx           ✓ BibTeX URL
src/app/signup/page.tsx             ✓ display copy
src/app/terms/page.tsx              ✓ display copy
src/app/investors/page.tsx          ✓ display copy
public/robots.txt                   ✓ comment + Sitemap directive
public/.well-known/security.txt     ✓ 6 refs (Encryption, Acknowledgments, Canonical, Policy, Hiring, comment)
public/downloads/sub-021_ses-08_task-focus_nirs.json ✓ sample data URL
```

**Deliberately NOT fixed:** the 4 remaining `eegbase.vercel.app` references in `mendi-pitch/*.md` (pre-meeting email, voiceover script, README, one-pager) and the binary `.pptx`. These are external pitch materials that link to the **actual deployed Vercel preview**, not the brand domain. The user must update them manually when `eegbase.com` is live AND when they're ready to send a fresh round of pitches.

### Fix 2: wrong GitHub owner — pitch files + generators

```
mendi-pitch/build-deck.js           ✓ regenerator output now correct
mendi-pitch/build-irb-packet.js     ✓ regenerator output now correct
mendi-pitch/01-pre-meeting-email.md ✓
mendi-pitch/04-one-pager.md         ✓
```

**Deliberately NOT fixed:** the binary `EEGBase-Mendi-Pitch-Deck.pptx`. Re-run `node mendi-pitch/build-deck.js` to regenerate it from the now-corrected generator.

### Fix 3: removed unnecessary `dangerouslySetInnerHTML`

`src/app/demo/DemoClient.tsx`:
- Data: `target: "L &gt; R asymmetry training"` → `"L > R asymmetry training"`
- Rendering: `<div ... dangerouslySetInnerHTML={{__html: p.target}} />` → `<div ...>{p.target}</div>`

Now React handles escaping naturally — same visual output, cleaner code.

---

## Memory cost of this chunk

- Started: ~1.49 GB free
- Tools used: Grep (cheap), Read with offset (cheap), Bash sed (cheap), one targeted Edit
- **No dev server, no browser, no screenshots**
- Ended: should still have ~1.4 GB free (verify in summary)

---

## What to verify in Chunk 4 (visual audit)

Defer these to the visual chunk because they need browser inspection:

- Demo software section-by-section UX walk-through (16+ tabs in `/demo`)
- Mobile responsiveness of demo sidebar
- Dark mode contrast on AI Insights / Reports tabs
- Run `npm run build` once to verify the changes from Chunk 2 + 3 don't break the build (the Tailwind / `__dirname` bug was the key risk; it's now resolved)

---

## Files touched

`src/app/sitemap.ts`, `src/app/changelog/rss.xml/route.ts`, `src/app/research/page.tsx`, `src/app/signup/page.tsx`, `src/app/terms/page.tsx`, `src/app/investors/page.tsx`, `src/app/demo/DemoClient.tsx`, `public/robots.txt`, `public/.well-known/security.txt`, `public/downloads/sub-021_ses-08_task-focus_nirs.json`, `mendi-pitch/build-deck.js`, `mendi-pitch/build-irb-packet.js`, `mendi-pitch/01-pre-meeting-email.md`, `mendi-pitch/04-one-pager.md`.
