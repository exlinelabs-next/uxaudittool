import type { CheerioAPI } from 'cheerio';
import { categoryScore } from '../scoring';
import type { AuditCheck, CategoryResult } from '../types';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d[\d\s\-() ]{6,}\d)/;

export function runTrustChecks(url: string, $: CheerioAPI): CategoryResult {
  const checks: AuditCheck[] = [];

  // --- HTTPS ---
  const isHttps = url.startsWith('https://');
  checks.push({
    id: 'https',
    label: 'HTTPS',
    value: isHttps ? 'Secure (https)' : 'Not secure (http)',
    status: isHttps ? 'pass' : 'fail',
    description: 'HTTPS encrypts data in transit and is a confirmed Google ranking signal.',
  });

  // --- Privacy policy link ---
  let privacyFound = false;
  $('a').each((_, el) => {
    const href = $(el).attr('href')?.toLowerCase() ?? '';
    const text = $(el).text().toLowerCase();
    if (href.includes('privacy') || text.includes('privacy')) {
      privacyFound = true;
    }
  });

  checks.push({
    id: 'privacy-policy',
    label: 'Privacy policy link',
    value: privacyFound ? 'Found' : 'Not found',
    status: privacyFound ? 'pass' : 'warning',
    description:
      'A privacy policy is legally required under GDPR and builds visitor trust.',
  });

  // --- Contact information ---
  const bodyText = $('body').text();
  const hasEmail = EMAIL_REGEX.test(bodyText);
  const hasPhone = PHONE_REGEX.test(bodyText);
  const hasContact = hasEmail || hasPhone;

  checks.push({
    id: 'contact-info',
    label: 'Contact information',
    value: hasContact
      ? [hasEmail && 'email', hasPhone && 'phone'].filter(Boolean).join(' + ') + ' found'
      : 'Not found',
    status: hasContact ? 'pass' : 'warning',
    description: 'Visible contact details build credibility and trust with potential customers.',
  });

  // --- Copyright notice ---
  const footerText = $('footer').text();
  const hasCopyright =
    footerText.includes('©') ||
    footerText.toLowerCase().includes('copyright');

  checks.push({
    id: 'copyright',
    label: 'Copyright notice',
    value: hasCopyright ? 'Found in footer' : 'Not found',
    status: hasCopyright ? 'pass' : 'warning',
    description: 'A copyright notice signals an actively maintained, professional site.',
  });

  // --- Terms of service ---
  let termsFound = false;
  $('a').each((_, el) => {
    const href = $(el).attr('href')?.toLowerCase() ?? '';
    const text = $(el).text().toLowerCase();
    if (
      href.includes('terms') ||
      text.includes('terms') ||
      text.includes('terms of service') ||
      text.includes('terms & conditions') ||
      text.includes('terms and conditions')
    ) {
      termsFound = true;
    }
  });

  checks.push({
    id: 'terms',
    label: 'Terms of service',
    value: termsFound ? 'Found' : 'Not found',
    status: termsFound ? 'pass' : 'warning',
    description:
      'Terms of service protect your business legally and show visitors you operate professionally.',
  });

  // --- Physical address ---
  const bodyText = $('body').text();
  const addressPattern = /\b\d{1,5}\s+\w+.{0,30}(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|way|close|court|ct|place|pl)\b/i;
  const hasPostcode = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}|\d{5}(-\d{4})?)\b/i.test(bodyText);
  const hasAddress = addressPattern.test(bodyText) || hasPostcode;

  checks.push({
    id: 'physical-address',
    label: 'Physical address',
    value: hasAddress ? 'Found' : 'Not detected',
    status: hasAddress ? 'pass' : 'warning',
    description:
      'A physical address builds credibility and is important for local SEO and trust.',
  });

  // --- Social media presence ---
  const socialPatterns = /facebook\.com|twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com|tiktok\.com/i;
  let socialCount = 0;
  const foundSocials: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (socialPatterns.test(href)) {
      const match = href.match(/(?:facebook|twitter|x\.com|linkedin|instagram|youtube|tiktok)/i);
      if (match && !foundSocials.includes(match[0].toLowerCase())) {
        foundSocials.push(match[0].toLowerCase());
        socialCount++;
      }
    }
  });

  checks.push({
    id: 'social-presence',
    label: 'Social media presence',
    value: foundSocials.length > 0 ? foundSocials.join(', ') : 'No social links found',
    status: foundSocials.length >= 2 ? 'pass' : foundSocials.length === 1 ? 'warning' : 'warning',
    description:
      'Active social profiles signal a legitimate, engaged business to visitors.',
  });

  return { score: categoryScore(checks), checks };
}
