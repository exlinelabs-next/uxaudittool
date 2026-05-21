import type { AuditCheck } from '@/lib/audit/types';
import { ScorePill } from './ScorePill';

const BORDER: Record<string, string> = {
  pass:    'var(--wb-pass)',
  warning: 'var(--wb-warn)',
  fail:    'var(--wb-fail)',
};

export function CheckRow({ check }: { check: AuditCheck }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3 px-4 py-3 rounded-lg"
      style={{
        background: 'var(--wb-card-2)',
        borderLeft: `3px solid ${BORDER[check.status]}`,
      }}
    >
      {/* Label + pill */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-sm font-medium truncate" style={{ color: 'var(--wb-text)' }}>
          {check.label}
        </span>
        <ScorePill status={check.status} />
      </div>

      {/* Value */}
      <span
        className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
        style={{
          background: 'var(--wb-border)',
          color: 'var(--wb-muted)',
          maxWidth: '220px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={check.value}
      >
        {check.value}
      </span>

      {/* Description */}
      <p className="text-xs sm:text-right sm:max-w-xs" style={{ color: 'var(--wb-muted)' }}>
        {check.description}
      </p>
    </div>
  );
}
