import { NextRequest, NextResponse } from 'next/server';
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
import type { AuditResult, CategoryResult } from '@/lib/audit/types';

const AUDIT_TIMEOUT_MS = 25_000;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function computeOverallScore(categories: AuditResult['categories']): number {
  const scores = Object.values(categories)
    .filter((c): c is CategoryResult => !!c && !c.unavailable && c.checks.length > 0)
    .map(c => c.score);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export async function POST(request: NextRequest) {
  // --- Rate limit ---
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "You've run several audits recently. Try again in an hour." },
      { status: 429 }
    );
  }

  // --- Parse + validate URL ---
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const rawUrl = body.url?.trim() ?? '';
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    return NextResponse.json(
      { error: 'Please enter a valid website URL including https://' },
      { status: 400 }
    );
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return NextResponse.json(
      { error: 'Please enter a valid website URL including https://' },
      { status: 400 }
    );
  }

  // --- Reachability check ---
  try {
    const headRes = await fetch(url.toString(), {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebAuditBot/1.0)' },
    });
    if (headRes.status === 403) {
      return NextResponse.json(
        { error: 'This site blocked our request. Some sites restrict automated access.' },
        { status: 422 }
      );
    }
    if (headRes.status >= 400 && headRes.status !== 405) {
      return NextResponse.json(
        { error: "We couldn't reach that URL. Check it's live and try again." },
        { status: 422 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "We couldn't reach that URL. Check it's live and try again." },
      { status: 422 }
    );
  }

  // --- Run all checkers ---
  let timedOut = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

  const timeoutPromise = new Promise<never>((_, reject) =>
    controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')))
  );

  const runCheckers = async (): Promise<AuditResult['categories']> => {
    // Fetch shared data sources in parallel - one PageSpeed call, one HTML fetch
    const [pageSpeedResult, htmlResult] = await Promise.allSettled([
      fetchPageSpeedData(url.toString(), controller.signal),
      fetchHtml(url.toString(), controller.signal),
    ]);

    const pageSpeedData =
      pageSpeedResult.status === 'fulfilled' ? pageSpeedResult.value : null;
    const htmlData = htmlResult.status === 'fulfilled' ? htmlResult.value : null;

    // Run all 6 checkers in parallel using shared data
    const [performance, seo, trust, ux, mobile, accessibility] = await Promise.allSettled([
      pageSpeedData
        ? Promise.resolve(runPerformanceChecks(pageSpeedData))
        : Promise.reject('No PageSpeed data'),

      htmlData
        ? Promise.resolve(runSeoChecks(htmlData.$))
        : Promise.reject('No HTML'),

      htmlData
        ? Promise.resolve(runTrustChecks(url.toString(), htmlData.$))
        : Promise.reject('No HTML'),

      htmlData
        ? Promise.resolve(runUxChecks(htmlData.$))
        : Promise.reject('No HTML'),

      pageSpeedData && htmlData
        ? Promise.resolve(runMobileChecks(pageSpeedData, htmlData.$))
        : Promise.reject('No data'),

      runAccessibilityChecks(url.toString(), controller.signal),
    ]);

    return {
      performance:
        performance.status === 'fulfilled' ? performance.value : unavailableCategory(),
      seo: seo.status === 'fulfilled' ? seo.value : unavailableCategory(),
      trust: trust.status === 'fulfilled' ? trust.value : unavailableCategory(),
      ux: ux.status === 'fulfilled' ? ux.value : unavailableCategory(),
      mobile: mobile.status === 'fulfilled' ? mobile.value : unavailableCategory(),
      accessibility:
        accessibility.status === 'fulfilled' ? accessibility.value : unavailableCategory(),
    };
  };

  let categories: AuditResult['categories'];
  try {
    categories = await Promise.race([runCheckers(), timeoutPromise]);
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.message === 'TIMEOUT') {
      timedOut = true;
      categories = {
        performance: unavailableCategory(),
        seo: unavailableCategory(),
        trust: unavailableCategory(),
        ux: unavailableCategory(),
        mobile: unavailableCategory(),
        accessibility: unavailableCategory(),
      };
    } else {
      return NextResponse.json(
        { error: 'Something went wrong running the audit. Please try again.' },
        { status: 500 }
      );
    }
  }

  const result: AuditResult = {
    url: url.toString(),
    scannedAt: new Date().toISOString(),
    overallScore: computeOverallScore(categories),
    ...(timedOut && { timedOut: true }),
    categories,
  };

  // Save to Supabase and attach share URL - non-blocking, audit works without it
  try {
    const shareId = await saveAuditResult(result);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
    result.shareId = shareId;
    result.shareUrl = `${baseUrl}/audit/${shareId}`;
  } catch {
    // Supabase unavailable or not configured - continue without share link
  }

  return NextResponse.json(result);
}
