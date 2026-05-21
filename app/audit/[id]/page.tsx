import { getAuditResult } from '@/lib/audit/store';
import { CategoryCard } from '@/components/audit/CategoryCard';
import { OverallScore } from '@/components/audit/OverallScore';
import { AuditCTA } from '@/components/audit/AuditCTA';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getAuditResult(id);
  if (!result) return { title: 'Audit not found - Webbeet' };
  return {
    title: `UX Audit: ${result.url} - Webbeet`,
    description: `Website audit report for ${result.url}. Overall score: ${result.overallScore}/100.`,
  };
}

export default async function AuditReportPage({ params }: Props) {
  const { id } = await params;
  const result = await getAuditResult(id);

  if (!result) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 gap-4" style={{ background: 'var(--wb-bg)' }}>
        <p className="text-4xl">🔍</p>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--wb-text)' }}>Report not found</h1>
        <p className="text-sm" style={{ color: 'var(--wb-muted)' }}>This link may have expired or the ID is incorrect.</p>
        <a
          href="/"
          className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--wb-accent)', color: '#000' }}
        >
          Run a new audit
        </a>
      </main>
    );
  }

  const ALL_CATEGORIES = ['seo', 'trust', 'ux', 'performance', 'mobile', 'accessibility'];
  const scannedDate = new Date(result.scannedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main className="flex flex-col min-h-screen px-4 pb-16" style={{ background: 'var(--wb-bg)' }}>
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full pt-10 pb-8 flex flex-col gap-1">
        <a href="/" className="text-sm font-bold tracking-tight" style={{ color: 'var(--wb-text)' }}>
          web<span style={{ color: 'var(--wb-accent)' }}>beet</span>
        </a>
        <h1 className="text-xl font-semibold mt-4" style={{ color: 'var(--wb-text)' }}>
          Audit report
        </h1>
        <div className="flex flex-wrap gap-3 mt-1">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-mono"
            style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)', color: 'var(--wb-muted)' }}
          >
            {result.url}
          </span>
          <span className="text-xs" style={{ color: 'var(--wb-muted)', lineHeight: '1.75rem' }}>
            {scannedDate}
          </span>
        </div>
      </div>

      {/* Overall score */}
      <div className="max-w-2xl mx-auto w-full mb-6">
        <div
          className="rounded-xl px-6 py-8 flex justify-center"
          style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)' }}
        >
          <OverallScore score={result.overallScore} />
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-3 mb-6">
        {ALL_CATEGORIES.map(cat => {
          const data = (result.categories as unknown as Record<string, import('@/lib/audit/types').CategoryResult>)[cat];
          if (!data) return null;
          return <CategoryCard key={cat} category={cat} result={data} />;
        })}
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto w-full">
        <AuditCTA />
      </div>
    </main>
  );
}
