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
  CategoryKey,
  AuditStreamEvent,
} from '@/lib/audit/types';

// Per-operation timeouts.
const HTML_TIMEOUT_MS       = 12_000;
const PAGESPEED_TIMEOUT_MS  = 120_000;
const A11Y_TIMEOUT_MS       =  90_000;

const encoder = new TextEncoder();

function sseEvent(data: AuditStreamEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function computeOverallScore(categories: Partial<AuditCategories>): number {
  const scores = Object.values(categories)
    .filter((c): c is import('@/lib/audit/types').CategoryResult => !!c && !c.unavailable && c.checks.length > 0)
    .map(c => c.score);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function getSiteOrigin(request: NextRequest): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (envBase) return envBase;
  const forwarded =
    request.headers.get('x-forwarded-proto') && request.headers.get('x-forwarded-host')
      ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('x-forwarded-host')}`
      : null;
  if (forwarded) return forwarded;
  return new URL(request.url).origin;
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
  const origin = request.headers.get('origin') ?? request.headers.get('referer');
  if (!origin) return true;
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

function isLocalhostUrl(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
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

  // --- Parse + validate body ---
  let body: { url?: string; onlyCategory?: CategoryKey };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const onlyCategory = body.onlyCategory ?? null;
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

  const scannedAt = new Date().toISOString();
  const urlStr = url.toString();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: AuditStreamEvent) => {
        try { controller.enqueue(sseEvent(event)); } catch { /* stream closed */ }
      };

      // ── Single-category retry ──────────────────────────────────────────────
      if (onlyCategory) {
        try {
          switch (onlyCategory) {
            case 'seo':
            case 'trust':
            case 'ux': {
              const html = await fetchHtml(urlStr, AbortSignal.timeout(HTML_TIMEOUT_MS)).catch(() => null);
              const result = html
                ? onlyCategory === 'seo'   ? runSeoChecks(html.$)
                : onlyCategory === 'trust' ? runTrustChecks(urlStr, html.$)
                                           : runUxChecks(html.$)
                : unavailableCategory();
              emit({ type: 'category', key: onlyCategory, result });
              break;
            }
            case 'performance': {
              const ps = await fetchPageSpeedData(urlStr, AbortSignal.timeout(PAGESPEED_TIMEOUT_MS)).catch(() => null);
              emit({ type: 'category', key: 'performance', result: ps ? runPerformanceChecks(ps) : unavailableCategory() });
              break;
            }
            case 'mobile': {
              const [ps, html] = await Promise.all([
                fetchPageSpeedData(urlStr, AbortSignal.timeout(PAGESPEED_TIMEOUT_MS)).catch(() => null),
                fetchHtml(urlStr, AbortSignal.timeout(HTML_TIMEOUT_MS)).catch(() => null),
              ]);
              emit({ type: 'category', key: 'mobile', result: ps && html ? runMobileChecks(ps, html.$) : unavailableCategory() });
              break;
            }
            case 'accessibility': {
              const a11y = await runAccessibilityChecks(urlStr, AbortSignal.timeout(A11Y_TIMEOUT_MS)).catch(() => null);
              emit({ type: 'category', key: 'accessibility', result: a11y ?? unavailableCategory() });
              break;
            }
          }
        } catch {
          emit({ type: 'category', key: onlyCategory, result: unavailableCategory() });
        }
        emit({ type: 'done', overallScore: 0, scannedAt });
        controller.close();
        return;
      }

      // ── Full audit — all categories run in parallel, each emits when ready ─
      //
      // Dependency graph:
      //   HTML  → SEO, Trust, UX
      //   HTML + PageSpeed → Mobile
      //   PageSpeed → Performance
      //   Puppeteer → Accessibility (fully independent)
      //
      // We kick off all three fetches simultaneously, then emit each category
      // the moment its dependencies resolve — no category waits for another.

      const collected: Partial<AuditCategories> = {};

      const htmlP       = fetchHtml(urlStr, AbortSignal.timeout(HTML_TIMEOUT_MS)).catch(() => null);
      const pageSpeedP  = fetchPageSpeedData(urlStr, AbortSignal.timeout(PAGESPEED_TIMEOUT_MS)).catch(() => null);
      const a11yP       = runAccessibilityChecks(urlStr, AbortSignal.timeout(A11Y_TIMEOUT_MS)).catch(() => null);

      // HTML group — SEO, Trust, UX (fastest, ~1-3s)
      const htmlGroup = htmlP.then(html => {
        const seo   = html ? runSeoChecks(html.$)               : unavailableCategory();
        const trust = html ? runTrustChecks(urlStr, html.$)     : unavailableCategory();
        const ux    = html ? runUxChecks(html.$)                : unavailableCategory();
        emit({ type: 'category', key: 'seo',   result: seo   });
        emit({ type: 'category', key: 'trust', result: trust });
        emit({ type: 'category', key: 'ux',    result: ux    });
        collected.seo = seo; collected.trust = trust; collected.ux = ux;
        return html;
      });

      // PageSpeed group — Performance immediately, Mobile once HTML also done
      const pageSpeedGroup = Promise.all([pageSpeedP, htmlGroup]).then(([ps, html]) => {
        const perf   = ps              ? runPerformanceChecks(ps)           : unavailableCategory();
        const mobile = ps && html      ? runMobileChecks(ps, html.$)        : unavailableCategory();
        emit({ type: 'category', key: 'performance', result: perf   });
        emit({ type: 'category', key: 'mobile',      result: mobile });
        collected.performance = perf; collected.mobile = mobile;
      });

      // Accessibility — fully independent
      const a11yGroup = a11yP.then(a11y => {
        const result = a11y ?? unavailableCategory();
        emit({ type: 'category', key: 'accessibility', result });
        collected.accessibility = result;
      });

      // Wait for everything, then emit the final done event
      await Promise.allSettled([htmlGroup, pageSpeedGroup, a11yGroup]);

      const overallScore = computeOverallScore(collected);

      let shareId: string | undefined;
      let shareUrl: string | undefined;
      try {
        shareId = await saveAuditResult({
          url: urlStr, scannedAt, overallScore,
          categories: collected as AuditCategories,
        });
        shareUrl = `${getSiteOrigin(request)}/audit/${shareId}`;
      } catch { /* non-fatal */ }

      emit({ type: 'done', overallScore, shareId, shareUrl, scannedAt });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
