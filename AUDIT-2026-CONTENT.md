# EEGBase Demo Software — Content Audit (Chunk 4-lite)

_Date: 2026-05-08_
_Method: Explore subagent (isolated context, no main-conversation memory cost) → 5 findings → 3 fixes applied + 2 deferred._

## Fixes applied

| # | File | Change |
|---|---|---|
| 1 | `src/app/investors/page.tsx:57` | "public repo since **2025**" → "since **2026**" |
| 2 | `src/app/page.tsx:73, 90` | "Is **patient** data safe?" → "Is **client** data safe?" + body copy. Aligns FAQ with the "client" term used everywhere else in the app. |
| 3 | `src/app/demo/page.tsx` | Added `export const metadata` with title + description + robots directives. The most-trafficked page in the app was missing SEO metadata. |

## Deferred (with reasoning)

- **20+ other pages without metadata exports** — the subagent flagged 58 of 96 pages. Top-priority page (`/demo`) is now done. The remaining are mostly internal/admin pages (`portal/*`, `clients/*`, `sessions/*`) that are `Disallow`ed in `robots.txt`, so SEO impact is negligible. Defer to a follow-up sweep that batches metadata across only public marketing pages.
- **"mock clients/sessions" labelling consistency** — `investors/page.tsx` says "10 mock clients · 88 mock sessions" while marketing landing says "10 clients · 88 fNIRS sessions pre-loaded". Both work for their audiences (investors want explicit "mock" framing; marketing buries it as "pre-loaded"). Stylistic, not a bug.

## What the subagent verified clean

- All 16 demo tabs accounted for, no broken/inconsistent counts (page.tsx says 16, investors says 16, comparison data referenced 16 — all consistent)
- All 18 FAQ questions verified for content correctness
- No broken internal links (`<Link href="/foo">` to non-existent routes)
- No exposed secrets
- No stale `vercel.app` URLs (all fixed in Chunk 3)
- "ONC HIT 2025 Edition" and "Q4 2025" are external-standard references, not stale dates — left intentionally

## Memory cost

Subagent ran in isolated context: read ~50 files, returned a 30-line report. Main conversation context was unaffected.
