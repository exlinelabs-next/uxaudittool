import type { AuditState } from '@/lib/hooks/useAudit';
import { OverallScore } from './OverallScore';
import { CategoryCard, CategoryCardSkeleton } from './CategoryCard';
import { AuditCTA } from './AuditCTA';

const FAST_CATEGORIES  = ['seo', 'trust', 'ux'] as const;
const SLOW_CATEGORIES  = ['performance', 'mobile', 'accessibility'] as const;
const ALL_CATEGORIES   = [...FAST_CATEGORIES, ...SLOW_CATEGORIES];

interface AuditReportProps {
  state: AuditState;
  ctaHref?: string;
  ctaLabel?: string;
}

export function AuditReport({ state, ctaHref, ctaLabel }: AuditReportProps) {
  const { status, partial, result } = state;

  const allCategories = result
    ? { ...partial, ...result.categories }
    : partial ?? {};

  const overallScore = result?.overallScore ?? null;
  const shareUrl = result?.shareUrl;

  const showReport = status === 'partial' || status === 'complete';

  if (!showReport) return null;

  return (
    <section className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-16">
      {/* Score header */}
      <div
        className="rounded-xl px-6 py-8 flex flex-col items-center gap-4"
        style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)' }}
      >
        {overallScore !== null ? (
          <>
            <OverallScore score={overallScore} />
            {status === 'partial' && (
              <p className="text-xs animate-pulse" style={{ color: 'var(--wb-muted)' }}>
                Loading performance, mobile and accessibility...
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-36 h-36 rounded-full animate-pulse" style={{ background: 'var(--wb-border)' }} />
            <p className="text-xs animate-pulse" style={{ color: 'var(--wb-muted)' }}>
              Calculating score...
            </p>
          </div>
        )}

        {shareUrl && (
          <div className="flex items-center gap-2 w-full max-w-sm">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg font-mono truncate"
              style={{
                background: 'var(--wb-card-2)',
                border: '1px solid var(--wb-border)',
                color: 'var(--wb-muted)',
              }}
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--wb-border)', color: 'var(--wb-text)' }}
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {/* Phase 1 categories - arrive fast */}
      <div className="flex flex-col gap-3">
        {FAST_CATEGORIES.map(cat => {
          const data = (allCategories as Record<string, import('@/lib/audit/types').CategoryResult>)[cat];
          return data
            ? <CategoryCard key={cat} category={cat} result={data} />
            : <CategoryCardSkeleton key={cat} category={cat} />;
        })}
      </div>

      {/* Phase 2 categories - arrive after PageSpeed */}
      <div className="flex flex-col gap-3">
        {SLOW_CATEGORIES.map(cat => {
          const data = (allCategories as Record<string, import('@/lib/audit/types').CategoryResult>)[cat];
          return data
            ? <CategoryCard key={cat} category={cat} result={data} />
            : <CategoryCardSkeleton key={cat} category={cat} />;
        })}
      </div>

      {/* CTA - only show once fully complete */}
      {status === 'complete' && (
        <AuditCTA href={ctaHref} label={ctaLabel} />
      )}
    </section>
  );
}
