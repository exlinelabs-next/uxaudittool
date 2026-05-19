@AGENTS.md

# Webbeet UX Audit Preview Tool

Public-facing lead gen tool for Webbeet. Visitor enters a URL, gets an automated audit report scored across 6 categories, then is prompted to book a discovery call.

## Project Docs

- Full brief: `docs/ux-audit-preview-tool-brief.md`
- Progress checklist: `docs/CHECKLIST.md`

## Stack

- Next.js 14+ App Router, TypeScript, Tailwind CSS
- Cheerio (server-side HTML parsing)
- puppeteer-core + @sparticuz/chromium (axe-core accessibility checks, Vercel-compatible)
- Google PageSpeed Insights API (free, key in env)
- In-memory IP rate limiting (5 audits/IP/hour)

## Environment Variables

```
PAGESPEED_API_KEY=
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX=5
```

Never commit `.env.local`.

## Brand Tokens

- Accent: `#C8F135` (electric lime)
- Background: black / off-white
- Score green: `#C8F135`, amber: `#F5A623`, red: `#E84545`
- No em-dashes anywhere - short hyphens only
- CTA text: "Book a free discovery call"

## API Route

`POST /api/audit { url }` - returns consolidated JSON with 6 category scores.
15-second timeout, returns partial results with `timedOut: true` on breach.

## Key Constraints

- All third-party fetches are server-side only (no API keys on client)
- Puppeteer uses puppeteer-core + @sparticuz/chromium (not full puppeteer) for Vercel compatibility
- Homepage only for MVP - no subpage crawling
