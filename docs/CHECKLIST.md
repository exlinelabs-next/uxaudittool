# Webbeet UX Audit Tool - Build Checklist

Progress tracker for the 5-day MVP build.

---

## Day 1 - Project Setup + Performance API

### Setup
- [x] Next.js 14 scaffolded (App Router, TypeScript, Tailwind)
- [x] Dependencies installed: cheerio, puppeteer-core, @sparticuz/chromium, @axe-core/puppeteer
- [x] Git repo initialised
- [x] CLAUDE.md and project docs in place
- [x] `.env.local` created with `PAGESPEED_API_KEY`
- [x] `.env.local` added to `.gitignore` (verified - covered by `.env*`)

### API Route - Foundation
- [x] `POST /api/audit` route created
- [x] URL validation (must start with http/https)
- [x] HEAD request reachability check before full analysis
- [x] 400/422 errors with user-friendly messages on invalid/unreachable URL
- [x] 25s timeout with `timedOut: true` partial response (shared AbortController passed to all checkers)
- [x] IP-based rate limiting (5/hour, in-memory)

### Performance Category
- [x] PageSpeed Insights API call (`strategy=mobile`)
- [x] Extract: overall score, FCP, LCP, total page size, render-blocking flag
- [x] Map to pass/warning/fail per check
- [x] Graceful fallback if PageSpeed API fails (flag as unavailable, return other checks)

---

## Day 2 - SEO + Trust Checks

### SEO Category (Cheerio)
- [x] Server-side fetch of target URL HTML (shared fetcher in `lib/audit/fetchers/html.ts`)
- [x] Title tag present + length check (30-60 chars)
- [x] Meta description present + length check (120-160 chars)
- [x] H1 present + count check (warn if multiple)
- [x] Canonical tag present
- [x] Open Graph tags (og:title + og:description)

### Trust Category (Cheerio + URL)
- [x] HTTPS check (URL starts with https://)
- [x] Privacy policy link (anchor text/href containing "privacy")
- [x] Contact info (phone pattern or email address in HTML)
- [x] Copyright notice (footer contains © or "copyright")

---

## Day 3 - Accessibility + UX Signals

### Accessibility Category (axe-core + Puppeteer)
- [x] Puppeteer launch via CHROMIUM_EXECUTABLE_PATH (local) / @sparticuz/chromium (prod)
- [x] axe-core run on rendered page (not raw HTML)
- [x] Extract violations: images missing alt, form inputs missing labels, colour contrast, missing lang attr, links with no text
- [x] Return violation count by severity (critical, serious, moderate)

### UX Signals Category (Cheerio)
- [x] Primary CTA detection (button/link with CTA text patterns)
- [x] Above-fold content check (h1/h2 in first 1000 chars of body)
- [x] Cookie/consent banner detection (class/id patterns: cookie, consent, gdpr)
- [x] Navigation present (`<nav>` or `role="navigation"`)
- [x] Footer present (`<footer>`)

### Mobile Category (PageSpeed + Cheerio)
- [x] Mobile performance score (from shared PageSpeed response)
- [x] Viewport meta tag present (Cheerio)
- [x] Content width, tap targets, font size (from PageSpeed audits)

### Scoring Logic
- [x] Per-check status: pass / warning / fail
- [x] Category score formula: `((passed + warnings * 0.5) / total) * 100`
- [x] Overall score: average of all 6 category scores (excludes unavailable categories)
- [x] Score bands defined: 80-100 good, 50-79 needs work, 0-49 poor

---

## Day 4 - Frontend UI

### Pages
- [ ] `/audit` page - URL input + results

### Components
- [ ] `AuditInput.tsx` - URL input form + submit button
- [ ] `AuditLoading.tsx` - loading state with animated step list
- [ ] `AuditReport.tsx` - full results layout
- [ ] `CategoryCard.tsx` - per-category score card
- [ ] `CheckRow.tsx` - individual check with pass/warn/fail badge
- [ ] `OverallScore.tsx` - large score display at top
- [ ] `AuditCTA.tsx` - bottom CTA block ("Book a free discovery call")

### Loading State Steps
- [ ] "Fetching your site..."
- [ ] "Running performance checks..."
- [ ] "Checking SEO signals..."
- [ ] "Testing accessibility..."
- [ ] "Analysing trust factors..."
- [ ] "Building your report..."

### Design
- [ ] Webbeet brand tokens applied (lime accent, black/off-white bg)
- [ ] Score badge colours correct (green/amber/red)
- [ ] Clean, professional report layout
- [ ] No em-dashes in any copy

---

## Day 5 - QA, Error States, Deploy

### Error Handling (all user-facing, no raw errors)
- [ ] Invalid URL message
- [ ] Site unreachable / 404 message
- [ ] Site blocks bots (403) message
- [ ] Timeout message + partial results
- [ ] PageSpeed API failure - show other checks, flag perf unavailable
- [ ] Rate limit hit message

### QA
- [ ] Mobile responsive UI tested
- [ ] All 6 audit categories tested end-to-end
- [ ] Error states tested
- [ ] Rate limiting tested

### Deployment (Railway - decided Day 2)
- [ ] Repo pushed to GitHub (private)
- [ ] `nixpacks.toml` added to install system Chromium (replaces @sparticuz/chromium)
- [ ] Railway project created + connected to GitHub
- [ ] Environment variables set in Railway dashboard (`PAGESPEED_API_KEY`, rate limit vars)
- [ ] `CHROMIUM_EXECUTABLE_PATH` removed for prod (Railway uses system Chromium)
- [ ] Deployed and live
- [ ] Custom domain set (e.g. `audit.webbeet.studio`)
- [ ] Postman Production environment updated with live Railway URL

### Analytics
- [ ] GTM custom event fires on each audit run

---

## Out of Scope (Week 2+)

- User accounts / saved reports
- PDF export
- Email capture gate before results
- Historical comparisons
- Scheduled re-audits
- Subpage crawling
- Share report via unique URL (Supabase + UUID)
- GTM events per category score
