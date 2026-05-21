import type { CheckStatus } from '@/lib/audit/types';

const CONFIG: Record<CheckStatus, { label: string; color: string }> = {
  pass:    { label: 'Pass',    color: 'var(--wb-pass)'     },
  warning: { label: 'Warning', color: 'var(--wb-warning)'  },
  fail:    { label: 'Fail',    color: 'var(--wb-critical)' },
};

export function StatusDot({ status }: { status: CheckStatus }) {
  const { color } = CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

export function StatusBadge({ status }: { status: CheckStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
}
