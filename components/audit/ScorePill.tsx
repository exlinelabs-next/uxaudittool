import type { CheckStatus } from '@/lib/audit/types';

const CONFIG: Record<CheckStatus, { label: string; icon: string; color: string }> = {
  pass:    { label: 'Pass',    icon: '✓', color: 'var(--wb-pass)' },
  warning: { label: 'Warning', icon: '△', color: 'var(--wb-warn)' },
  fail:    { label: 'Fail',    icon: '✕', color: 'var(--wb-fail)' },
};

export function ScorePill({ status }: { status: CheckStatus }) {
  const { label, icon, color } = CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}
