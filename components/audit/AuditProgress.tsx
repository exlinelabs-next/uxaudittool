/**
 * Two-phase progress tracker shown while Phase 2 (performance/mobile/accessibility)
 * is still being fetched. Disappears once status === 'complete'.
 */
export function AuditProgress() {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 py-3 rounded text-xs"
      style={{
        border: '1px solid var(--wb-border)',
        background: 'var(--wb-surface)',
      }}
    >
      {/* Label */}
      <span className="font-medium shrink-0" style={{ color: 'var(--wb-muted)' }}>
        Audit progress
      </span>

      {/* Steps */}
      <div className="flex items-center gap-0 flex-1 min-w-0">

        {/* Phase 1 - complete */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="flex items-center justify-center rounded-full text-xs font-bold"
            style={{
              width: 20, height: 20,
              background: 'color-mix(in srgb, var(--wb-pass) 15%, transparent)',
              color: 'var(--wb-pass)',
              border: '1px solid color-mix(in srgb, var(--wb-pass) 30%, transparent)',
            }}
          >
            ✓
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-medium" style={{ color: 'var(--wb-text)' }}>SEO, Trust, UX</span>
            <span style={{ color: 'var(--wb-pass)', fontSize: 10 }}>Complete</span>
          </div>
        </div>

        {/* Connector */}
        <div
          className="flex-1 mx-3 h-px min-w-4"
          style={{ background: 'var(--wb-border)' }}
        />

        {/* Phase 2 - in progress */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Animated spinner ring */}
          <span
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 20, height: 20,
              border: '2px solid var(--wb-border)',
              borderTopColor: 'var(--wb-warning)',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <div className="flex flex-col leading-tight">
            <span className="font-medium" style={{ color: 'var(--wb-text)' }}>Performance, Mobile, Accessibility</span>
            <span className="animate-pulse" style={{ color: 'var(--wb-warning)', fontSize: 10 }}>
              Running PageSpeed + accessibility checks...
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
