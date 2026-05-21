import type { CheerioAPI } from 'cheerio';
import { scoreStatus, categoryScore } from '../scoring';
import type { AuditCheck, CategoryResult } from '../types';
import type { PageSpeedResponse } from '../fetchers/pagespeed';

export function runMobileChecks(data: PageSpeedResponse, $: CheerioAPI): CategoryResult {
  const audits = data.lighthouseResult?.audits ?? {};
  const mobileScore: number = data.lighthouseResult?.categories?.performance?.score ?? 0;

  const tapTargets = audits['tap-targets'] ?? {};
  const fontSize = audits['font-size'] ?? {};
  const contentWidth = audits['content-width'] ?? {};

  // --- Viewport meta tag (from Cheerio) ---
  const viewport = $('meta[name="viewport"]').attr('content')?.trim();

  // --- Mobile performance score ---
  const checks: AuditCheck[] = [
    {
      id: 'mobile-score',
      label: 'Mobile performance score',
      value: `${Math.round(mobileScore * 100)} / 100`,
      status: scoreStatus(mobileScore),
      description: 'Overall Lighthouse performance score measured on a mobile device.',
    },
    {
      id: 'viewport',
      label: 'Viewport meta tag',
      value: viewport ?? 'Missing',
      status: viewport ? 'pass' : 'fail',
      description:
        'The viewport meta tag is required for correct rendering on mobile screens.',
    },
    {
      id: 'content-width',
      label: 'Content fits screen width',
      value:
        contentWidth.score === null || contentWidth.score === 1
          ? 'Content fits'
          : 'Content overflows',
      status: contentWidth.score === null || contentWidth.score === 1 ? 'pass' : 'fail',
      description: 'Content should not require horizontal scrolling on mobile.',
    },
    {
      id: 'tap-targets',
      label: 'Tap targets sized correctly',
      value: tapTargets.displayValue ?? (tapTargets.score !== 0 ? 'Properly sized' : 'Too small'),
      status: scoreStatus(tapTargets.score ?? null),
      description: 'Buttons and links need to be large enough to tap accurately on mobile.',
    },
    {
      id: 'font-size',
      label: 'Text readable on mobile',
      value: fontSize.displayValue ?? (fontSize.score !== 0 ? 'Readable' : 'Text may be too small'),
      status: scoreStatus(fontSize.score ?? null),
      description: 'Text should be at least 16px so it is readable without zooming.',
    },
    {
      id: 'touch-icon',
      label: 'Apple touch icon',
      value: $('link[rel="apple-touch-icon"]').length > 0 ? 'Found' : 'Not found',
      status: $('link[rel="apple-touch-icon"]').length > 0 ? 'pass' : 'warning',
      description:
        'The apple-touch-icon is used when a user adds the site to their home screen on iOS.',
    },
  ];

  return { score: categoryScore(checks), checks };
}
