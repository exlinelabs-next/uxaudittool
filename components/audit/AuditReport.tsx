import type { AuditState } from '@/lib/hooks/useAudit';
import type { AuditCategories } from '@/lib/audit/types';
import { SummaryPanel } from './SummaryPanel';
import { CategoryAccordion, CategoryAccordionSkeleton } from './CategoryAccordion';
import { AuditCTA } from './AuditCTA';
import { AuditProgress } from './AuditProgress';

const FAST_CATS  = ['seo', 'trust', 'ux'] as const;
const SLOW_CATS  = ['performance', 'mobile', 'accessibility'] as const;
const ALL_CATS   = [...FAST_CATS, ...SLOW_CATS];

interface AuditReportProps {
  state: AuditState;
  ctaHref?: string;
  ctaLabel?: string;
}

export function AuditReport({ state, ctaHref, ctaLabel }: AuditReportProps) {
  const { status, partial, result } = state;
  if (status === 'idle' || status === 'loading') return null;

  const allCategories: Partial<AuditCategories> = { ...partial, ...result?.categories };
  const overallScore = result?.overallScore ?? (
    partial
      ? Math.round(
          Object.values(partial).filter(c => !c.unavailable && c.checks.length > 0)
            .reduce((s, c, _, a) => s + c.score / a.length, 0)
        )
      : 0
  );

  return (
    <section className="w-full flex flex-col gap-3 pb-12">

      {/* Summary panel */}
      <SummaryPanel
        overallScore={overallScore}
        categories={allCategories}
        url={state.url}
        scannedAt={result?.scannedAt}
        shareUrl={result?.shareUrl}
        isPartial={status === 'partial'}
      />

      {/* Phase 2 progress indicator - shown while performance/mobile/a11y are loading */}
      {status === 'partial' && <AuditProgress />}

      {/* Accordion sections */}
      <div className="flex flex-col gap-2 mt-1">
        {ALL_CATS.map(cat => {
          const data = (allCategories as Record<string, import('@/lib/audit/types').CategoryResult | undefined>)[cat];
          return data
            ? <CategoryAccordion key={cat} category={cat} result={data} />
            : <CategoryAccordionSkeleton key={cat} category={cat} />;
        })}
      </div>

      {/* CTA - only once complete */}
      {status === 'complete' && (
        <AuditCTA href={ctaHref} label={ctaLabel} />
      )}
    </section>
  );
}
