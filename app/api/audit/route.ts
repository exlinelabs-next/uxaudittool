import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/audit/rate-limit';
import { runPerformanceChecks } from '@/lib/audit/checkers/performance';
import { unavailableCategory } from '@/lib/audit/scoring';
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
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "You've run several audits recently. Try again in an hour." },
      { status: 429 }
    );
  }

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

  // Reachability check before running the full audit
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
    // 405 = site doesn't allow HEAD - that's fine, proceed
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

  let timedOut = false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

  const timeoutPromise = new Promise<never>((_, reject) =>
    controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')))
  );

  const runCheckers = async (): Promise<AuditResult['categories']> => {
    const [performance] = await Promise.allSettled([
      runPerformanceChecks(url.toString(), controller.signal),
      // seo, trust added Day 2
      // accessibility, mobile, ux added Day 3
    ]);

    return {
      performance: performance.status === 'fulfilled' ? performance.value : unavailableCategory(),
    };
  };

  let categories: AuditResult['categories'];
  try {
    categories = await Promise.race([runCheckers(), timeoutPromise]);
    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof Error && err.message === 'TIMEOUT') {
      timedOut = true;
      categories = { performance: unavailableCategory() };
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

  return NextResponse.json(result);
}
