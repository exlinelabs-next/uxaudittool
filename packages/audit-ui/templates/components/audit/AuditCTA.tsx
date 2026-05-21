export function AuditCTA({
  href = '__CTA_HREF__',
  label = '__CTA_LABEL__',
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div
      className="rounded-xl px-6 py-8 flex flex-col items-center text-center gap-4"
      style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)' }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold" style={{ color: 'var(--wb-text)' }}>
          Want us to fix these issues for you?
        </p>
        <p className="text-sm" style={{ color: 'var(--wb-muted)' }}>
          Our team will walk through your audit and show you exactly how to improve your site.
        </p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95"
        style={{ background: 'var(--wb-accent)', color: '#000' }}
      >
        {label}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}
