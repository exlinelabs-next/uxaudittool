export function AuditCTA({
  href = 'https://webbeet.studio/contact',
  label = 'Book a free discovery call',
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 rounded"
      style={{ border: '1px solid var(--wb-border)', background: 'var(--wb-surface)' }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--wb-text)' }}>
          Want us to fix these issues?
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--wb-muted)' }}>
          We will walk through your results and build a prioritised action plan.
        </p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold shrink-0 transition-opacity hover:opacity-90"
        style={{ background: 'var(--wb-accent)', color: '#000' }}
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}
