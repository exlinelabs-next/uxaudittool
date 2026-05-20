import type { CheerioAPI } from 'cheerio';
import { categoryScore } from '../scoring';
import type { AuditCheck, CategoryResult } from '../types';

const CTA_PATTERN =
  /get started|book|contact us|buy|sign up|free trial|learn more|schedule|request|enquire|get in touch|try for free|start free|see plans/i;

const COOKIE_SELECTOR =
  '[class*="cookie"], [class*="consent"], [class*="gdpr"], [id*="cookie"], [id*="consent"], [id*="gdpr"]';

export function runUxChecks($: CheerioAPI): CategoryResult {
  const checks: AuditCheck[] = [];

  // --- Primary CTA ---
  let ctaText = '';
  $('a, button').each((_, el) => {
    if (ctaText) return;
    const text = $(el).text().trim();
    if (CTA_PATTERN.test(text)) ctaText = text.slice(0, 50);
  });

  checks.push({
    id: 'cta',
    label: 'Primary CTA present',
    value: ctaText ? `"${ctaText}"` : 'Not detected',
    status: ctaText ? 'pass' : 'warning',
    description:
      'A clear call-to-action guides visitors toward the next step. Heuristic check - verify manually.',
  });

  // --- Above-fold heading ---
  const bodyHtml = $('body').html() ?? '';
  const first1000 = bodyHtml.slice(0, 1000);
  const hasAboveFold = /<h[12]/i.test(first1000);

  checks.push({
    id: 'above-fold',
    label: 'Heading above the fold',
    value: hasAboveFold ? 'H1 or H2 in first content' : 'No heading detected early',
    status: hasAboveFold ? 'pass' : 'warning',
    description:
      'A headline near the top tells visitors immediately what the page is about.',
  });

  // --- Cookie / consent banner ---
  const hasCookieElement = $(COOKIE_SELECTOR).length > 0;
  const hasCookieText = /cookie|consent|gdpr/i.test(bodyHtml);
  const hasCookieBanner = hasCookieElement || hasCookieText;

  checks.push({
    id: 'cookie-banner',
    label: 'Cookie consent banner',
    value: hasCookieBanner ? 'Detected' : 'Not detected',
    status: hasCookieBanner ? 'pass' : 'warning',
    description: 'Required under GDPR for EU visitors. May be loaded dynamically - verify manually.',
  });

  // --- Navigation ---
  const hasNav = $('nav, [role="navigation"]').length > 0;

  checks.push({
    id: 'navigation',
    label: 'Navigation present',
    value: hasNav ? 'Found' : 'Not found',
    status: hasNav ? 'pass' : 'fail',
    description: 'Clear navigation helps visitors find what they need quickly.',
  });

  // --- Footer ---
  const hasFooter = $('footer').length > 0;

  checks.push({
    id: 'footer',
    label: 'Footer present',
    value: hasFooter ? 'Found' : 'Not found',
    status: hasFooter ? 'pass' : 'warning',
    description: 'A footer typically contains contact info, legal links, and secondary navigation.',
  });

  return { score: categoryScore(checks), checks };
}
