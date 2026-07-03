import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import { generatePdfHtml } from '@/lib/export';
import { getBrowserConfig } from '@/lib/audit/browser';
import type { AuditCategories } from '@/lib/audit/types';

export async function POST(req: NextRequest) {
  let body: {
    url?: unknown;
    overallScore?: unknown;
    categories?: unknown;
    scannedAt?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { url, overallScore, categories, scannedAt } = body;

  if (typeof url !== 'string' || !url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }
  if (typeof overallScore !== 'number') {
    return NextResponse.json({ error: 'Missing overallScore' }, { status: 400 });
  }
  if (!categories || typeof categories !== 'object') {
    return NextResponse.json({ error: 'Missing categories' }, { status: 400 });
  }

  const cats = categories as Partial<AuditCategories>;
  const scannedAtStr = typeof scannedAt === 'string' ? scannedAt : undefined;

  let html: string;
  try {
    html = generatePdfHtml(url, overallScore, cats, scannedAtStr);
  } catch {
    return NextResponse.json({ error: 'Failed to generate report content' }, { status: 500 });
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    const { executablePath, args } = await getBrowserConfig();

    const LAUNCH_TIMEOUT_MS = 30_000;
    browser = await Promise.race([
      puppeteer.launch({
        executablePath,
        args,
        headless: 'shell',
        defaultViewport: { width: 1280, height: 800 },
        timeout: LAUNCH_TIMEOUT_MS,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Chromium launch timed out after ${LAUNCH_TIMEOUT_MS}ms`)), LAUNCH_TIMEOUT_MS)
      ),
    ]);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 20_000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    const filename = `exlinelabs-ux-audit-${(() => {
      try { return new URL(url).hostname; } catch { return 'report'; }
    })()}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[report-pdf] generation failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
}
