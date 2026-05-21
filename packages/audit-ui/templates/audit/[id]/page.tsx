import { getAuditResult } from '@/lib/audit/store';
import { SummaryPanel } from '@/components/audit/SummaryPanel';
import { CategoryAccordion } from '@/components/audit/CategoryAccordion';
import { AuditCTA } from '@/components/audit/AuditCTA';
import type { AuditCategories } from '@/lib/audit/types';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getAuditResult(id);
  if (!result) return { title: 'Audit not found' };
  return {
    title: `UX Audit: ${result.url}`,
    description: `Website audit report for ${result.url}. Overall score: ${result.overallScore}/100.`,
  };
}

export default async function AuditReportPage({ params }: Props) {
  const { id } = await params;
  const result = await getAuditResult(id);

  if (!result) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 gap-4" style={{ background: 'var(--wb-bg)' }}>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--wb-text)' }}>Report not found</h1>
        <p className="text-sm" style={{ color: 'var(--wb-muted)' }}>This link may have expired or the ID is incorrect.</p>
        <a
          href="/"
          className="mt-2 px-5 py-2.5 rounded font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--wb-accent)', color: '#000' }}
        >
          Run a new audit
        </a>
      </main>
    );
  }

  const ALL_CATEGORIES = ['seo', 'trust', 'ux', 'performance', 'mobile', 'accessibility'] as const;
  const categories = result.categories as unknown as Partial<AuditCategories>;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--wb-bg)' }}>
      <header
        className="sticky top-0 z-10 px-4 sm:px-6 py-3 flex items-center gap-4"
        style={{ background: 'var(--wb-bg)', borderBottom: '1px solid var(--wb-border)' }}
      >
        <a href="/" className="text-sm font-bold tracking-tight shrink-0" style={{ color: 'var(--wb-text)' }}>
          UX Audit
        </a>
        <a
          href="/"
          className="ml-auto px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--wb-surface)', border: '1px solid var(--wb-border)', color: 'var(--wb-muted)' }}
        >
          Run new audit
        </a>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-4 max-w-5xl mx-auto w-full">
        <section className="w-full flex flex-col gap-3 pb-12">
          <SummaryPanel
            overallScore={result.overallScore}
            categories={categories}
            url={result.url}
            scannedAt={result.scannedAt}
          />

          <div className="flex flex-col gap-2 mt-1">
            {ALL_CATEGORIES.map(cat => {
              const data = (categories as Record<string, import('@/lib/audit/types').CategoryResult | undefined>)[cat];
              return data ? <CategoryAccordion key={cat} category={cat} result={data} /> : null;
            })}
          </div>

          <AuditCTA href="__CTA_HREF__" label="__CTA_LABEL__" />
        </section>
      </main>
    </div>
  );
}
