'use client';

import { useAudit } from '../lib/hooks/useAudit';
import { AuditInput } from '../components/audit/AuditInput';
import { AuditReport } from '../components/audit/AuditReport';

export default function AuditPage() {
  const { state, runAudit, reset } = useAudit('__API_URL__');
  const hasResult = state.status === 'partial' || state.status === 'complete';

  return (
    <main className="flex flex-col min-h-screen" style={{ background: 'var(--wb-bg)' }}>
      <section className="flex flex-col items-center text-center px-4 pt-20 pb-12 gap-6">
        <div className="flex flex-col gap-3 max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight" style={{ color: 'var(--wb-text)' }}>
            Is your website <span style={{ color: 'var(--wb-accent)' }}>losing customers</span>?
          </h1>
          <p className="text-base sm:text-lg" style={{ color: 'var(--wb-muted)' }}>
            Get a free instant audit across SEO, performance, trust, mobile and accessibility. No signup required.
          </p>
        </div>

        <div className="w-full max-w-xl">
          <AuditInput onSubmit={runAudit} status={state.status} error={state.error} />
        </div>

        {!hasResult && (
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-2">
            {[{ value: '51', label: 'checks run' }, { value: '6', label: 'categories' }, { value: '~20s', label: 'average time' }].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-xl font-bold" style={{ color: 'var(--wb-accent)' }}>{value}</span>
                <span className="text-xs" style={{ color: 'var(--wb-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {hasResult && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-mono" style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)', color: 'var(--wb-muted)' }}>
              {state.url}
            </span>
            <button onClick={reset} className="text-xs px-3 py-1 rounded-full font-medium transition-opacity hover:opacity-80" style={{ background: 'var(--wb-border)', color: 'var(--wb-text)' }}>
              New audit
            </button>
          </div>
        )}
      </section>

      <div className="flex-1 px-4">
        <AuditReport state={state} ctaHref="__CTA_HREF__" ctaLabel="__CTA_LABEL__" />
      </div>
    </main>
  );
}
