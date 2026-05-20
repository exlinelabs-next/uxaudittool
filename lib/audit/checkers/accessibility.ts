import puppeteer from 'puppeteer-core';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { categoryScore } from '../scoring';
import type { AuditCheck, CategoryResult } from '../types';

const SANDBOX_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

interface BrowserConfig {
  executablePath: string;
  args: string[];
}

async function getBrowserConfig(): Promise<BrowserConfig> {
  // 1. Explicit env var - local dev (Brave, Chrome, etc.)
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    return { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: SANDBOX_ARGS };
  }

  // 2. System Chromium on PATH - Railway (installed via nixpacks.toml)
  try {
    const { execSync } = await import('child_process');
    const found = execSync(
      'which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome-stable 2>/dev/null',
      { encoding: 'utf-8', timeout: 3000 }
    ).trim();
    if (found) return { executablePath: found, args: SANDBOX_ARGS };
  } catch {
    // not on PATH - fall through
  }

  // 3. @sparticuz/chromium - last resort fallback
  const { default: chromium } = await import('@sparticuz/chromium');
  return { executablePath: await chromium.executablePath(), args: chromium.args };
}

export async function runAccessibilityChecks(
  url: string,
  signal?: AbortSignal
): Promise<CategoryResult> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    if (signal?.aborted) throw new Error('Aborted before launch');

    const { executablePath, args } = await getBrowserConfig();

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
