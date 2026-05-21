import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/audit/rate-limit';
import { fetchPageSpeedData } from '@/lib/audit/fetchers/pagespeed';
import { fetchHtml } from '@/lib/audit/fetchers/html';
import { runPerformanceChecks } from '@/lib/audit/checkers/performance';
import { runSeoChecks } from '@/lib/audit/checkers/seo';
import { runTrustChecks } from '@/lib/audit/checkers/trust';
import { runUxChecks } from '@/lib/audit/checkers/ux';
import { runMobileChecks } from '@/lib/audit/checkers/mobile';
import { runAccessibilityChecks } from '@/lib/audit/checkers/accessibility';
import { unavailableCategory } from '@/lib/audit/scoring';
import { saveAuditResult } from '@/lib/audit/store';
import type {
  AuditCategories,
  AuditStreamEvent,
} from '@/lib/audit/types';

// Per-operation timeouts. PageSpeed is the slowest - large/complex sites can take 50s+.
const HTML_TIMEOUT_MS = 10_000;
const PAGESPEED_TIMEOUT_MS = 90_000;
const A11Y_TIMEOUT_MS = 35_000;

const encoder = new TextEncoder();

function sseEvent(data: AuditStreamEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function computeOverallScore(categories: AuditCategories): number {
  const scores = Object.values(categories)
    .filter(c => !c.unavailable && c.checks.length > 0)
    .map(c => c.score);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Origins allowed to call the audit API
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://ux-audit.exlinelabs.co.uk',
  'https://ux-audit.exlinelabs.co.uk',
  'https://exlinelabs.com',
  'https://www.exlinelabs.com',
];

function isAllowedOrigin(request: NextRequest): boolean {
  // Allow requests with no Origin header (e.g. direct server-to-server, curl)
  // only when running locally - in production we enforce strictly.
  const origin = request.headers.get('origin') ?? request.headers.get('referer');
  if (!origin) {
    // No origin means a same-origin navigation or server context - allow it
    return true;
  }
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

function isLocalhostUrl(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function getSiteOrigin(request: NextRequest): string {
  // Prefer explicit env var (useful if behind a proxy), then fall back to
  // deriving the origin from the incoming request URL so share links always
  // work regardless of where the app is deployed.
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (envBase) return envBase;

  const forwarded = request.headers.get('x-forwarded-proto') && request.headers.get('x-forwarded-host')
    ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('x-forwarded-host')}`
    : null;
  if (forwarded) return forwarded;

  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  // --- Origin check ---
  if (!isAllowedOrigin(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorised origin.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- Rate limit ---
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "You've run several audits recently. Try again in an hour." }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- Parse + validate URL ---
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const rawUrl = body.url?.trim() ?? '';
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    return new Response(
      JSON.stringify({ error: 'Please enter a valid website URL including https://' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Please enter a valid website URL including https://' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- Reachability check (skipped for localhost) ---
  if (!isLocalhostUrl(url)) {
    try {
      const headRes = await fetch(url.toString(), {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(8_000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebAuditBot/1.0)' },
      });
      if (headRes.status === 403) {
        return new Response(
          JSON.stringify({ error: 'This site blocked our request. Some sites restrict automated access.' }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (headRes.status >= 400 && headRes.status !== 405) {
        return new Response(
          JSON.stringify({ error: "We couldn't reach that URL. Check it's live and try again." }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "We couldn't reach that URL. Check it's live and try again." }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // --- Stream the audit in two phases ---
  const scannedAt = new Date().toISOString();
  const urlStr = url.toString();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Start all three slow fetches simultaneously ────────────────────
        // HTML is fast (~1-3s). PageSpeed and accessibility are slow (20-90s).
        // We kick off all three at once so PageSpeed doesn't wait for HTML.
        const htmlPromise = fetchHtml(urlStr, AbortSignal.timeout(HTML_TIMEOUT_MS));
        const pageSpeedPromise = fetchPageSpeedData(urlStr, AbortSignal.timeout(PAGESPEED_TIMEOUT_MS));
        const a11yPromise = runAccessibilityChecks(urlStr, AbortSignal.timeout(A11Y_TIMEOUT_MS));

        // ── Phase 1: fast HTML-based checks (SEO, trust, UX) ──────────────
        // Await only HTML - PageSpeed is already running in the background.
        // Send partial results to the client as soon as HTML finishes (~1-3s).
        const htmlResult = await htmlPromise;

        const fastCategories = {
          seo: runSeoChecks(htmlResult.$),
          trust: runTrustChecks(urlStr, htmlResult.$),
          ux: runUxChecks(htmlResult.$),
        };

        controller.enqueue(sseEvent({ type: 'partial', categories: fastCategories }));

        // ── Phase 2: slow checks (PageSpeed + accessibility) ──────────────
        // Both are already in flight - just wait for whichever finishes last.
        // Each has its own timeout so a slow site doesn't block the other.
        const [pageSpeedResult, a11yResult] = await Promise.allSettled([
          pageSpeedPromise,
          a11yPromise,
        ]);

        const pageSpeedData =
          pageSpeedResult.status === 'fulfilled' ? pageSpeedResult.value : null;

        const slowCategories = {
          performance: pageSpeedData
            ? runPerformanceChecks(pageSpeedData)
            : unavailableCategory(),
          mobile: pageSpeedData
            ? runMobileChecks(pageSpeedData, htmlResult.$)
            : unavailableCategory(),
          accessibility:
            a11yResult.status === 'fulfilled' ? a11yResult.value : unavailableCategory(),
        };

        const allCategories: AuditCategories = { ...fastCategories, ...slowCategories };
        const overallScore = computeOverallScore(allCategories);

        // Save full result to Supabase for shareable link (non-blocking)
        let shareId: string | undefined;
        let shareUrl: string | undefined;
        try {
          shareId = await saveAuditResult({ url: urlStr, scannedAt, overallScore, categories: allCategories });
          shareUrl = `${getSiteOrigin(request)}/audit/${shareId}`;
        } catch {
          // Supabase unavailable - audit still works without share link
        }

        controller.enqueue(
          sseEvent({ type: 'complete', categories: slowCategories, overallScore, shareId, shareUrl, scannedAt })
        );

      } catch {
        // HTML fetch failed (bot block, bad HTML, etc.) - fall through to slow checks
        // and return whatever we can get from PageSpeed alone.
        try {
          const [pageSpeedResult, a11yResult] = await Promise.allSettled([
            fetchPageSpeedData(urlStr, AbortSignal.timeout(PAGESPEED_TIMEOUT_MS)),
            runAccessibilityChecks(urlStr, AbortSignal.timeout(A11Y_TIMEOUT_MS)),
          ]);

          const pageSpeedData =
            pageSpeedResult.status === 'fulfilled' ? pageSpeedResult.value : null;

          // Without HTML we can't run mobile (needs Cheerio viewport check),
          // so mark seo/trust/ux/mobile as unavailable and return what we have.
          const allCategories: AuditCategories = {
            seo: unavailableCategory(),
            trust: unavailableCategory(),
            ux: unavailableCategory(),
            performance: pageSpeedData ? runPerformanceChecks(pageSpeedData) : unavailableCategory(),
            mobile: unavailableCategory(),
            accessibility: a11yResult.status === 'fulfilled' ? a11yResult.value : unavailableCategory(),
          };

          const overallScore = computeOverallScore(allCategories);

          let shareId: string | undefined;
          let shareUrl: string | undefined;
          try {
            shareId = await saveAuditResult({ url: urlStr, scannedAt, overallScore, categories: allCategories });
            shareUrl = `${getSiteOrigin(request)}/audit/${shareId}`;
          } catch { /* non-fatal */ }

          controller.enqueue(
            sseEvent({
              type: 'complete',
              categories: {
                performance: allCategories.performance,
                mobile: allCategories.mobile,    // unavailable (no HTML)
                accessibility: allCategories.accessibility,
              },
              overallScore,
              shareId,
              shareUrl,
              scannedAt,
            })
          );
        } catch {
          controller.enqueue(
            sseEvent({ type: 'error', error: 'Something went wrong running the audit. Please try again.', status: 500 })
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering so events flush immediately
    },
  });
}
