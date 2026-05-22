import type { AuditState } from '@/lib/hooks/useAudit';
import type { AuditCategories, CategoryKey } from '@/lib/audit/types';
import { ALL_CATEGORY_KEYS } from '@/lib/audit/types';
import { SummaryPanel } from './SummaryPanel';
import { CategoryAccordion, CategoryAccordionSkeleton } from './CategoryAccordion';
import { AuditCTA } from './AuditCTA';
import { ScreenshotGuard } from '@/components/ScreenshotGuard';

interface AuditReportProps {
  state: AuditState;
  ctaHref?: string;
  ctaLabel?: string;
  onRerun?: () => void;
  onRetryCategory?: (key: CategoryKey) => void;
}

export function AuditReport({ state, ctaHref, ctaLabel, onRerun, onRetryCategory }: AuditReportProps) {
  const { status, categories, overallScore, scannedAt, shareUrl } = state;

  if (status === 'idle') return null;

  const isRunning = status === 'running';
  const loadedCount = Object.keys(categories).length;

  // Compute a live overall while still running (average of what's loaded so far)
  const displayScore = overallScore > 0
    ? overallScore
    : loadedCount === 0
      ? 0
      : Math.round(
          Object.values(categories as Record<string, import('@/lib/audit/types').CategoryResult>)
            .filter(c => !c.unavailable && c.checks.length > 0)
            .reduce((s, c, _, a) => s + c.score / a.length, 0),
        );

  return (
    <ScreenshotGuard>
    <section className="w-full flex flex-col gap-3 pb-12">

      {/* Summary panel */}
      <SummaryPanel
        overallScore={displayScore}
        categories={categories}
        url={state.url}
        scannedAt={scannedAt}
        shareUrl={shareUrl}
        isPartial={isRunning}
        onRerun={onRerun}
      />

      {/* Per-category progress strip — shown while any category is still loading */}
      {isRunning && loadedCount < ALL_CATEGORY_KEYS.length && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded text-xs"
          style={{ border: '1px solid var(--wb-border)', background: 'var(--wb-surface)' }}
        >
          {/* Spinner */}
          <span
            className="shrink-0 rounded-full border-2"
            style={{
              width: 16, height: 16,
              borderColor: 'var(--wb-border)',
              borderTopColor: 'var(--wb-warning)',
              animation: 'spin 0.9s linear infinite',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--wb-muted)' }}>
            Analysing&hellip;&ensp;
            <span style={{ color: 'var(--wb-text)', fontWeight: 600 }}>
              {loadedCount} of {ALL_CATEGORY_KEYS.length}
            </span>
            &nbsp;categories done
          </span>
        </div>
      )}

      {/* Accordion sections — one per category, skeleton while not yet loaded */}
      <div className="flex flex-col gap-2 mt-1">
        {ALL_CATEGORY_KEYS.map(key => {
          const data = (categories as Partial<Record<CategoryKey, import('@/lib/audit/types').CategoryResult>>)[key];
          return data
            ? <CategoryAccordion
                key={key}
                category={key}
                result={data}
                onRetry={onRetryCategory ? () => onRetryCategory(key) : undefined}
              />
            : <CategoryAccordionSkeleton key={key} category={key} />;
        })}
      </div>

      {/* CTA — only once fully complete */}
      {status === 'complete' && (
        <AuditCTA href={ctaHref} label={ctaLabel} />
      )}
    </section>
    </ScreenshotGuard>
  );
}
