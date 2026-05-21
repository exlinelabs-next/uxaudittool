import { scoreStatus, categoryScore } from '../scoring';
import type { AuditCheck, CategoryResult } from '../types';
import type { PageSpeedResponse } from '../fetchers/pagespeed';

export function runPerformanceChecks(data: PageSpeedResponse): CategoryResult {
  const audits = data.lighthouseResult?.audits ?? {};
  const perfScore: number = data.lighthouseResult?.categories?.performance?.score ?? 0;

  const fcp = audits['first-contentful-paint'] ?? {};
  const lcp = audits['largest-contentful-paint'] ?? {};
  const weight = audits['total-byte-weight'] ?? {};
  const blocking = audits['render-blocking-resources'] ?? {};

  const hasBlockingResources =
    blocking.score !== null && blocking.score !== undefined && blocking.score < 1;
  const blockingCount = blocking.details?.items?.length ?? 0;

  const checks: AuditCheck[] = [
    {
      id: 'perf-score',
      label: 'Performance score',
      value: `${Math.round(perfScore * 100)} / 100`,
      status: scoreStatus(perfScore),
      description:
        perfScore >= 0.9
          ? 'Great overall performance'
          : perfScore >= 0.5
            ? 'Some performance issues - worth addressing'
            : 'Significant performance issues detected',
    },
    {
      id: 'fcp',
      label: 'First Contentful Paint',
      value: fcp.displayValue ?? 'N/A',
      status: scoreStatus(fcp.score ?? null),
      description: 'Time until first content appears. Aim for under 1.8s.',
    },
    {
      id: 'lcp',
      label: 'Largest Contentful Paint',
      value: lcp.displayValue ?? 'N/A',
      status: scoreStatus(lcp.score ?? null),
      description: 'Time until the largest element loads. Aim for under 2.5s.',
    },
    {
      id: 'page-size',
      label: 'Total page size',
      value: weight.displayValue ?? 'N/A',
      status: scoreStatus(weight.score ?? null),
      description: 'Keep total page weight under 1.6 MB for best performance.',
    },
    {
      id: 'render-blocking',
      label: 'Render-blocking resources',
      value: hasBlockingResources
        ? `${blockingCount} resource${blockingCount !== 1 ? 's' : ''} detected`
        : 'None detected',
      status: hasBlockingResources ? 'fail' : 'pass',
      description: 'Render-blocking resources delay the initial page paint.',
    },
    {
      id: 'cls',
      label: 'Cumulative Layout Shift',
      value: audits['cumulative-layout-shift']?.displayValue ?? 'N/A',
      status: scoreStatus(audits['cumulative-layout-shift']?.score ?? null),
      description: 'Measures how much the page layout shifts unexpectedly. Aim for under 0.1.',
    },
    {
      id: 'tbt',
      label: 'Total Blocking Time',
      value: audits['total-blocking-time']?.displayValue ?? 'N/A',
      status: scoreStatus(audits['total-blocking-time']?.score ?? null),
      description: 'Time the main thread was blocked during page load. Aim for under 200ms.',
    },
    {
      id: 'modern-images',
      label: 'Modern image formats',
      value: (() => {
        const items = audits['uses-optimized-images']?.details?.items ?? [];
        const webpItems = audits['uses-webp-images']?.details?.items ?? [];
        const total = items.length + webpItems.length;
        return total === 0 ? 'Images are optimised' : `${total} image${total !== 1 ? 's' : ''} could use WebP/AVIF`;
      })(),
      status: (() => {
        const items = audits['uses-optimized-images']?.details?.items ?? [];
        const webpItems = audits['uses-webp-images']?.details?.items ?? [];
        const total = items.length + webpItems.length;
        return total === 0 ? 'pass' : total <= 3 ? 'warning' : 'fail';
      })(),
      description: 'WebP and AVIF images are significantly smaller than JPEG/PNG, improving load times.',
    },
  ];

  return { score: categoryScore(checks), checks };
}
