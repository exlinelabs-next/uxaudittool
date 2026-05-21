import { ScoreBar, ScoreNumber, scoreLabel } from './ScoreBar';
import { RadarChart } from './RadarChart';
import type { AuditCategories } from '@/lib/audit/types';

const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO', trust: 'Trust', ux: 'UX',
  performance: 'Performance', mobile: 'Mobile', accessibility: 'Accessibility',
};

interface SummaryPanelProps {
  overallScore: number;
  categories: Partial<AuditCategories>;
  url: string;
  scannedAt?: string;
  shareUrl?: string;
  isPartial?: boolean;
}

export function SummaryPanel({ overallScore, categories, url, scannedAt, shareUrl, isPartial }: SummaryPanelProps) {
  const scores: Partial<Record<string, number>> = {};
  let totalChecks = 0, totalFail = 0, totalWarn = 0, totalPass = 0;

  for (const [key, cat] of Object.entries(categories)) {
    if (cat && !cat.unavailable) {
      scores[key] = cat.score;
      totalChecks += cat.checks.length;
      totalFail   += cat.checks.filter(c => c.status === 'fail').length;
      totalWarn   += cat.checks.filter(c => c.status === 'warning').length;
      totalPass   += cat.checks.filter(c => c.status === 'pass').length;
    }
  }

  const dateStr = scannedAt
    ? new Date(scannedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: '1px solid var(--wb-border)', background: 'var(--wb-surface)' }}
    >
      {/* Top bar: URL + meta */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--wb-border)', background: 'var(--wb-surface-2)', fontSize: 13 }}
      >
        <span className="font-mono font-medium" style={{ color: 'var(--wb-text)' }}>{url}</span>
        {dateStr && <span style={{ color: 'var(--wb-muted)', fontSize: 12 }}>Scanned {dateStr}</span>}
        {isPartial && (
          <span
            className="px-2 py-0.5 rounded text-xs animate-pulse"
            style={{ background: 'color-mix(in srgb, var(--wb-warning) 12%, transparent)', color: 'var(--wb-warning)', border: '1px solid color-mix(in srgb, var(--wb-warning) 20%, transparent)' }}
          >
            Loading performance data...
          </span>
        )}
        {shareUrl && (
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded transition-opacity hover:opacity-80"
            style={{ background: 'var(--wb-border)', color: 'var(--wb-muted)' }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Copy share link
          </button>
        )}
      </div>

      {/* Main content: score left, radar middle, category bars right */}
      <div className="flex flex-col md:flex-row">

        {/* Overall score */}
        <div
          className="flex flex-col items-center justify-center gap-3 px-8 py-6"
          style={{ borderRight: '1px solid var(--wb-border)', minWidth: 160 }}
        >
          <ScoreNumber score={overallScore} size="lg" />
          <div className="flex flex-col items-center gap-1 w-full">
            <div className="w-full">
              <ScoreBar score={overallScore} height={5} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--wb-muted)' }}>
              {scoreLabel(overallScore)}
            </span>
          </div>

          {/* Issue summary */}
          <div className="grid grid-cols-3 gap-2 w-full mt-1">
            {[
              { count: totalFail, label: 'Fail',  color: 'var(--wb-critical)' },
              { count: totalWarn, label: 'Warn',  color: 'var(--wb-warning)'  },
              { count: totalPass, label: 'Pass',  color: 'var(--wb-pass)'     },
            ].map(({ count, label, color }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-base font-bold font-mono" style={{ color }}>{count}</span>
                <span className="text-xs" style={{ color: 'var(--wb-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--wb-dim)' }}>{totalChecks} checks</span>
        </div>

        {/* Radar chart */}
        <div
          className="flex items-center justify-center p-4"
          style={{ borderRight: '1px solid var(--wb-border)' }}
        >
          <RadarChart scores={scores} />
        </div>

        {/* Category score bars */}
        <div className="flex-1 flex flex-col justify-center px-5 py-4 gap-2.5">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const cat = (categories as Record<string, { score: number; unavailable?: boolean } | undefined>)[key];
            const score = cat && !cat.unavailable ? cat.score : null;
            return (
              <div key={key} className="flex items-center gap-3">
                <span
                  className="font-medium shrink-0"
                  style={{ fontSize: 13, color: 'var(--wb-muted)', width: 92 }}
                >
                  {label}
                </span>
                {score !== null ? (
                  <ScoreBar score={score} height={4} showLabel />
                ) : (
                  <div className="flex-1 h-1 rounded-full animate-pulse" style={{ background: 'var(--wb-dim)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
