# Developer Brief: Live UX Audit Preview Tool
**Project:** Exline Labs / Webbeet  
**Prepared by:** Tharsh  
**Timeline:** 5 working days  
**Type:** Public-facing lead generation tool

---

## 1. Overview

A public-facing web tool embedded on the Webbeet site. A visitor enters their website URL, hits analyse, and receives an automated audit report scored across six categories. No login required. The tool runs 24/7 as a lead magnet - prospects self-qualify, see real problems on their site, and are prompted to book a discovery call.

---

## 2. User Flow

```
Landing on tool page
      ↓
Enter website URL
      ↓
Click "Analyse my site"
      ↓
Loading state (5-10 seconds while checks run)
      ↓
Report page - scored findings across 6 categories
      ↓
CTA: "Want the full audit? Book a discovery call"
```

---

## 3. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14 (App Router) | Deploy to Vercel, free tier sufficient |
| Styling | Tailwind CSS | Match Webbeet brand tokens |
| Performance data | Google PageSpeed Insights API | Free, no billing setup needed for low volume |
| HTML parsing | Cheerio | Server-side, lightweight |
| Accessibility checks | axe-core | Run via `@axe-core/puppeteer` in API route |
| PDF / sharing | None for MVP | Out of scope for week one |
| Analytics | Already on Webbeet via GTM | Fire custom event on each audit run |
| Deployment | Vercel | Push from GitHub, auto-deploy |

---

## 4. Architecture

```
Browser (React UI)
      ↓  POST /api/audit { url }
Next.js API Route (server-side)
      ├── fetch PageSpeed Insights API
      ├── fetch target URL HTML → Cheerio parse
      ├── run axe-core checks (via Puppeteer)
      └── return consolidated JSON result
      ↓
React renders report from JSON
```

All third-party fetches happen server-side. This avoids CORS issues and keeps API keys off the client.

---

## 5. Audit Categories and Checks

### 5.1 Performance
Source: Google PageSpeed Insights API (free, no billing required at low volume)

- Overall performance score (0-100)
- First Contentful Paint
- Largest Contentful Paint
- Total page size
- Render-blocking resources flag

**API call:**
```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url={encoded_url}
  &strategy=mobile
  &key={PAGESPEED_API_KEY}
```

Get the API key from: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Enable "PageSpeed Insights API" → Create credentials → API key. Free quota is 25,000 requests/day.

---

### 5.2 SEO Basics
Source: HTML parse via Cheerio (server-side fetch of the target URL)

| Check | Pass condition |
|-------|---------------|
| Title tag present | `<title>` exists and is not empty |
| Title length | Between 30-60 characters |
| Meta description present | `<meta name="description">` exists |
| Meta description length | Between 120-160 characters |
| H1 present | At least one `<h1>` on the page |
| H1 count | Only one `<h1>` (multiple is a warning) |
| Canonical tag | `<link rel="canonical">` present |
| Open Graph tags | `og:title` and `og:description` present |

---

### 5.3 Accessibility
Source: axe-core via `@axe-core/puppeteer`

Run axe on the rendered page (not just raw HTML - Puppeteer loads it in a headless browser so JS-rendered content is included).

Key violations to surface:
- Images missing `alt` text
- Form inputs missing labels
- Colour contrast failures
- Missing `lang` attribute on `<html>`
- Links with no discernible text (e.g. icon-only links with no aria-label)

Return: violation count by severity (critical, serious, moderate).

---

### 5.4 Mobile
Source: PageSpeed Insights API (same call as Performance, use `strategy=mobile`)

- Mobile performance score
- `viewport` meta tag present (from Cheerio parse)
- Mobile-friendly pass/fail (from PageSpeed `mobile-friendly` audit)

---

### 5.5 UX Signals
Source: Cheerio HTML parse

| Check | Pass condition |
|-------|---------------|
| Primary CTA present | Button or link with common CTA text patterns (Get started, Book, Contact, Buy, Sign up) |
| Above-fold content | At least one `<h1>` or `<h2>` in the first 1000 chars of body |
| Cookie/consent banner | Look for common class/id patterns (`cookie`, `consent`, `gdpr`) |
| Navigation present | `<nav>` element or `role="navigation"` exists |
| Footer present | `<footer>` element exists |

Note: CTA detection is heuristic - flag as informational, not a hard fail.

---

### 5.6 Trust
Source: Cheerio HTML parse + URL inspection

| Check | Pass condition |
|-------|---------------|
| HTTPS | URL starts with `https://` |
| Privacy policy link | Anchor text or href containing `privacy` |
| Contact info visible | Page contains phone number pattern or email address |
| Copyright notice | Footer contains `©` or `copyright` |

---

## 6. Scoring Logic

Each category returns a score: **pass**, **warning**, or **fail** per check.

Aggregate to a category-level score:

```javascript
function categoryScore(checks) {
  const total = checks.length;
  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  const score = ((passed + warnings * 0.5) / total) * 100;
  return Math.round(score);
}
```

Display a score badge per category: 80-100 = green, 50-79 = amber, 0-49 = red.

Overall score = average of all six category scores.

---

## 7. API Route Spec

**Endpoint:** `POST /api/audit`

**Request body:**
```json
{ "url": "https://example.com" }
```

**Validation:**
- URL must start with `http://` or `https://`
- Must resolve (test with a HEAD request before full analysis)
- Return 400 with `{ error: "Invalid or unreachable URL" }` on failure

**Response shape:**
```json
{
  "url": "https://example.com",
  "scannedAt": "2025-01-01T10:00:00Z",
  "overallScore": 72,
  "categories": {
    "performance": {
      "score": 65,
      "checks": [
        { "id": "fcp", "label": "First Contentful Paint", "value": "2.1s", "status": "warning", "description": "Aim for under 1.8s" }
      ]
    },
    "seo": { "score": 90, "checks": [...] },
    "accessibility": { "score": 55, "checks": [...] },
    "mobile": { "score": 80, "checks": [...] },
    "ux": { "score": 70, "checks": [...] },
    "trust": { "score": 75, "checks": [...] }
  }
}
```

**Timeout:** Set a 15-second timeout on the full audit. If it exceeds, return partial results with a `"timedOut": true` flag.

**Rate limiting:** Add basic IP-based rate limiting - max 5 audits per IP per hour. Use `next-rate-limit` or a simple in-memory store for the MVP. This prevents abuse and keeps PageSpeed API usage within free quota.

---

## 8. Environment Variables

Create a `.env.local` file (never commit to Git):

```
PAGESPEED_API_KEY=your_key_here
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX=5
```

---

## 9. Frontend Components

### Pages
- `/audit` - Main tool page (URL input + results)

### Components

```
/components/audit/
  ├── AuditInput.tsx        - URL input form + submit button
  ├── AuditLoading.tsx      - Loading state with progress steps
  ├── AuditReport.tsx       - Full results layout
  ├── CategoryCard.tsx      - Per-category score card
  ├── CheckRow.tsx          - Individual check with pass/warn/fail badge
  ├── OverallScore.tsx      - Large score display at top of report
  └── AuditCTA.tsx          - Bottom CTA block (book a call)
```

### Loading State
Show a step-by-step progress list while the audit runs (even if faked with a timer - the real API call is one request). Example steps:
- Fetching your site...
- Running performance checks...
- Checking SEO signals...
- Testing accessibility...
- Analysing trust factors...
- Building your report...

This makes the wait feel purposeful and sets expectation of thoroughness.

---

## 10. Brand / Design Notes

Webbeet brand tokens:
- Accent: `#C8F135` (electric lime)
- Background: Black / off-white
- No em-dashes anywhere - short hyphens only
- No agency language in body copy
- CTA: "Book a free discovery call"

Score badges:
- Green: `#C8F135` on dark background
- Amber: `#F5A623`
- Red: `#E84545`

Keep the UI clean and direct. The report should feel like a professional deliverable, not a toy.

---

## 11. Error Handling

Handle these cases gracefully with user-facing messages (not raw errors):

| Scenario | Message to show |
|----------|----------------|
| URL invalid / not a URL | "Please enter a valid website URL including https://" |
| Site unreachable / 404 | "We couldn't reach that URL. Check it's live and try again." |
| Site blocks bots (403) | "This site blocked our request. Some sites restrict automated access." |
| Timeout | "The audit took too long. We've returned partial results." |
| PageSpeed API failure | Show all other checks, flag performance as unavailable |
| Rate limit hit | "You've run several audits recently. Try again in an hour." |

---

## 12. What's Out of Scope for Week One

Do not build these in week one - keep it focused:

- User accounts / saved reports
- PDF export
- Email capture / lead form gate
- Historical comparisons
- Scheduled re-audits
- Subpage crawling (homepage only for MVP)
- CMS integration

---

## 13. Day-by-Day Plan

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Project setup, Next.js scaffold, PageSpeed API integration, URL validation | `/api/audit` returns performance data |
| 2 | Cheerio HTML fetch + SEO and Trust check logic | SEO + Trust checks working in API route |
| 3 | axe-core Puppeteer integration, accessibility checks, UX signal checks | All 6 categories returning data |
| 4 | Frontend - report UI, score cards, check rows, loading state | Full report renders in browser |
| 5 | Mobile QA, error states, rate limiting, deploy to Vercel, GTM event | Live on Vercel, linked from Webbeet |

---

## 14. Dependencies to Install

```bash
npx create-next-app@latest ux-audit-tool --typescript --tailwind --app
cd ux-audit-tool

npm install cheerio
npm install @axe-core/puppeteer puppeteer
npm install next-rate-limit
```

Puppeteer on Vercel requires the `puppeteer-core` + `@sparticuz/chromium` combo due to Vercel's serverless constraints:

```bash
npm install puppeteer-core @sparticuz/chromium
```

Use this instead of full Puppeteer in the API route:

```javascript
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

---

## 15. Deployment

1. Push repo to GitHub (private)
2. Connect to Vercel - import project, auto-detect Next.js
3. Add environment variables in Vercel dashboard (Settings → Environment Variables)
4. Deploy - Vercel handles build and CDN automatically
5. Set custom domain via Vercel dashboard (e.g. `audit.webbeet.studio`)

Vercel free tier supports this comfortably. Puppeteer / Chromium on serverless has a cold start - acceptable for this use case.

---

## 16. Post-Launch (Week Two Onwards)

Nice-to-haves to prioritise after the MVP is live:

- Email capture before showing results (optional gate)
- Share report via unique URL (store result in Supabase with a UUID)
- PDF download of report
- GTM events per category score for analytics segmentation
- Subpage sampling (run 3 pages, average the scores)
