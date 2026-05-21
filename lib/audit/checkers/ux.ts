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

  // --- Contact form ---
  const hasForm = $('form').length > 0;
  const hasContactForm =
    hasForm &&
    ($('input[type="email"]').length > 0 ||
      $('textarea').length > 0 ||
      /contact|enquir|get.?in.?touch|message/i.test($('form').text()));

  checks.push({
    id: 'contact-form',
    label: 'Contact / lead form',
    value: hasContactForm ? 'Found' : 'Not detected',
    status: hasContactForm ? 'pass' : 'warning',
    description:
      'A contact or lead form gives visitors a direct way to get in touch and convert.',
  });

  // --- Social proof ---
  const bodyText = $('body').text();
  const hasSocialProof =
    /testimonial|review|rating|stars|trusted by|clients|customers|case.?stud/i.test(bodyText);

  checks.push({
    id: 'social-proof',
    label: 'Social proof signals',
    value: hasSocialProof ? 'Detected' : 'Not detected',
    status: hasSocialProof ? 'pass' : 'warning',
    description:
      'Testimonials, reviews, or client logos build trust and increase conversion rates.',
  });

  // --- Social media links ---
  const socialPatterns = /facebook\.com|twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com|tiktok\.com/i;
  const socialLinks: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (socialPatterns.test(href)) {
      const match = href.match(/(?:facebook|twitter|x\.com|linkedin|instagram|youtube|tiktok)/i);
      if (match && !socialLinks.includes(match[0].toLowerCase())) {
        socialLinks.push(match[0].toLowerCase());
      }
    }
  });

  checks.push({
    id: 'social-links',
    label: 'Social media links',
    value: socialLinks.length > 0 ? socialLinks.join(', ') : 'None found',
    status: socialLinks.length > 0 ? 'pass' : 'warning',
    description:
      'Links to social profiles show an active online presence and give visitors more ways to connect.',
  });

  // --- Live chat widget ---
  const chatPatterns =
    /intercom|drift|crisp|freshchat|tidio|zendesk|hubspot|tawk|livechat|olark/i;
  const hasChatScript = $('script[src]').toArray().some(el =>
    chatPatterns.test($(el).attr('src') ?? '')
  );
  const hasChatId = $('[id*="intercom"],[id*="drift"],[id*="crisp"],[class*="chat-widget"],[id*="tidio"],[id*="tawk"]').length > 0;
  const hasChat = hasChatScript || hasChatId;

  checks.push({
    id: 'live-chat',
    label: 'Live chat / support widget',
    value: hasChat ? 'Detected' : 'Not detected',
    status: hasChat ? 'pass' : 'warning',
    description:
      'Live chat tools (Intercom, Drift, Crisp etc.) can significantly improve conversion rates.',
  });

  return { score: categoryScore(checks), checks };
}
