import puppeteer from 'puppeteer-core';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { categoryScore } from '../scoring';
import type { AuditCheck, CategoryResult } from '../types';

async function getExecutablePath(): Promise<string> {
  // Explicit override via env (local dev or custom Railway setup)
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    return process.env.CHROMIUM_EXECUTABLE_PATH;
  }

  // Railway / production - use @sparticuz/chromium
  const chromium = await import('@sparticuz/chromium');
  return chromium.default.executablePath();
}

async function getLaunchArgs(): Promise<string[]> {
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    // Local Chrome - minimal args
    return [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ];
  }
  const chromium = await import('@sparticuz/chromium');
  return chromium.default.args;
}

export async function runAccessibilityChecks(
  url: string,
  signal?: AbortSignal
): Promise<CategoryResult> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    if (signal?.aborted) throw new Error('Aborted before launch');

    const [executablePath, args] = await Promise.all([getExecutablePath(), getLaunchArgs()]);

    browser = await puppeteer.launch({
      executablePath,
      args,
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
    });

    if (signal?.aborted) throw new Error('Aborted after launch');

    const page = await browser.newPage();

    // Abort signal wires into page navigation
    const abortHandler = () => page.close().catch(() => null);
    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 20_000 });
    } catch (navErr) {
      // If navigation times out but page partially loaded, still try axe
      const isTimeout =
        navErr instanceof Error && navErr.message.toLowerCase().includes('timeout');
      if (!isTimeout) throw navErr;
    }

    if (signal?.aborted) throw new Error('Aborted after navigation');

    const results = await new AxePuppeteer(page).analyze();
    signal?.removeEventListener('abort', abortHandler);

    const violations = results.violations;
    const critical = violations.filter(v => v.impact === 'critical').length;
    const serious = violations.filter(v => v.impact === 'serious').length;
    const moderate = violations.filter(v => v.impact === 'moderate').length;

    // Specific violation lookups
    const altViolation = violations.find(v => v.id === 'image-alt');
    const labelViolation = violations.find(v => v.id === 'label');
    const contrastViolation = violations.find(v => v.id === 'color-contrast');
    const langViolation = violations.find(v => v.id === 'html-has-lang');
    const linkViolation = violations.find(v => v.id === 'link-name');

    const checks: AuditCheck[] = [
      {
        id: 'a11y-critical',
        label: 'Critical violations',
        value: critical === 0 ? 'None' : `${critical} found`,
        status: critical === 0 ? 'pass' : 'fail',
        description: 'Critical issues make content completely inaccessible for some users.',
      },
      {
        id: 'a11y-serious',
        label: 'Serious violations',
        value: serious === 0 ? 'None' : `${serious} found`,
        status: serious === 0 ? 'pass' : serious <= 2 ? 'warning' : 'fail',
        description: 'Serious issues significantly impair access for users with disabilities.',
      },
      {
        id: 'a11y-moderate',
        label: 'Moderate violations',
        value: moderate === 0 ? 'None' : `${moderate} found`,
        status: moderate === 0 ? 'pass' : moderate <= 3 ? 'warning' : 'fail',
        description: 'Moderate issues create difficulty but workarounds may exist.',
      },
      {
        id: 'a11y-alt',
        label: 'Images have alt text',
        value: altViolation
          ? `${altViolation.nodes.length} image${altViolation.nodes.length !== 1 ? 's' : ''} missing alt text`
          : 'All images have alt text',
        status: altViolation ? 'fail' : 'pass',
        description: 'Alt text is essential for screen reader users and when images fail to load.',
      },
      {
        id: 'a11y-labels',
        label: 'Form inputs have labels',
        value: labelViolation
          ? `${labelViolation.nodes.length} input${labelViolation.nodes.length !== 1 ? 's' : ''} missing label`
          : 'All inputs are labelled',
        status: labelViolation ? 'fail' : 'pass',
        description: 'Labels allow screen readers to identify form fields correctly.',
      },
      {
        id: 'a11y-contrast',
        label: 'Colour contrast',
        value: contrastViolation
          ? `${contrastViolation.nodes.length} element${contrastViolation.nodes.length !== 1 ? 's' : ''} with low contrast`
          : 'Contrast passes',
        status: contrastViolation
          ? contrastViolation.nodes.length <= 3
            ? 'warning'
            : 'fail'
          : 'pass',
        description: 'Sufficient colour contrast ensures text is readable for low-vision users.',
      },
      {
        id: 'a11y-lang',
        label: 'HTML lang attribute',
        value: langViolation ? 'Missing lang attribute' : 'Language declared',
        status: langViolation ? 'fail' : 'pass',
        description: 'The lang attribute helps screen readers use correct pronunciation.',
      },
      {
        id: 'a11y-links',
        label: 'Links have discernible text',
        value: linkViolation
          ? `${linkViolation.nodes.length} link${linkViolation.nodes.length !== 1 ? 's' : ''} with no text`
          : 'All links have text',
        status: linkViolation ? 'fail' : 'pass',
        description: 'Icon-only links need an aria-label so screen readers can describe them.',
      },
    ];

    return { score: categoryScore(checks), checks };
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
}
