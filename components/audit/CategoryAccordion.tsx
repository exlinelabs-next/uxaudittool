'use client';

import { useState } from 'react';
import type { CategoryResult } from '@/lib/audit/types';
import { StatusBadge, StatusDot } from './StatusBadge';
import { ScoreBar } from './ScoreBar';

const CATEGORY_LABELS: Record<string, string> = {
  seo:           'SEO',
  trust:         'Trust & Credibility',
  ux:            'UX Signals',
  performance:   'Performance',
  mobile:        'Mobile',
  accessibility: 'Accessibility',
};

/** Skeleton shown while a category is loading */
export function CategoryAccordionSkeleton({ category }: { category: string }) {
  return (
    <div style={{ border: '1px solid var(--wb-border)', borderRadius: 6 }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--wb-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--wb-dim)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--wb-muted)' }}>
            {CATEGORY_LABELS[category] ?? category}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--wb-dim)' }} />
          <div className="w-6 h-4 rounded animate-pulse" style={{ background: 'var(--wb-dim)' }} />
        </div>
      </div>
    </div>
  );
}

export function CategoryAccordion({
  category,
  result,
  defaultOpen,
}: {
  category: string;
  result: CategoryResult;
  defaultOpen?: boolean;
}) {
  const label   = CATEGORY_LABELS[category] ?? category;
  const fails   = result.checks.filter(c => c.status === 'fail');
  const warns   = result.checks.filter(c => c.status === 'warning');
  const passes  = result.checks.filter(c => c.status === 'pass');

  // Sort checks: fails → warnings → passes
  const sorted  = [...fails, ...warns, ...passes];

  const [open, setOpen] = useState(defaultOpen ?? fails.length > 0);

  if (result.unavailable) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded"
        style={{ border: '1px solid var(--wb-border)', color: 'var(--wb-muted)' }}
      >
        <span className="text-xs">{label}</span>
        <span className="ml-auto text-xs">Unavailable</span>
      </div>
    );
  }

  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: '1px solid var(--wb-border)' }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{
          background: open ? 'var(--wb-surface)' : 'transparent',
          borderBottom: open ? '1px solid var(--wb-border)' : 'none',
        }}
      >
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{
            color: 'var(--wb-muted)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Label */}
        <span className="flex-1 text-left" style={{ fontSize: 14, fontWeight: 600, color: 'var(--wb-text)' }}>
          {label}
        </span>

        {/* Issue pills */}
        <div className="hidden sm:flex items-center gap-2">
          {fails.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: 'var(--wb-critical)', background: 'color-mix(in srgb, var(--wb-critical) 10%, transparent)' }}>
              {fails.length} fail
            </span>
          )}
          {warns.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: 'var(--wb-warning)', background: 'color-mix(in srgb, var(--wb-warning) 10%, transparent)' }}>
              {warns.length} warn
            </span>
          )}
          {fails.length === 0 && warns.length === 0 && (
            <span className="text-xs" style={{ color: 'var(--wb-pass)' }}>All passed</span>
          )}
        </div>

        {/* Score + bar */}
        <div className="flex items-center gap-2 shrink-0 w-28">
          <ScoreBar score={result.score} height={3} />
          <span className="text-xs font-mono font-semibold tabular-nums" style={{ color: 'var(--wb-muted)', minWidth: 22, textAlign: 'right' }}>
            {result.score}
          </span>
        </div>
      </button>

      {/* Check table */}
      {open && (
        <div style={{ background: 'var(--wb-surface)' }}>
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--wb-border)' }}>
                {['Check', 'Status', 'Value', 'Notes'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium"
                    style={{ color: 'var(--wb-muted)', background: 'var(--wb-surface-2)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((check, i) => (
                <tr
                  key={check.id}
                  style={{
                    borderBottom: i < sorted.length - 1 ? '1px solid var(--wb-border)' : 'none',
                    background: i % 2 === 0 ? 'transparent' : 'var(--wb-surface-2)',
                  }}
                >
                  {/* Check name */}
                  <td className="px-4 py-2.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--wb-text)', width: '28%' }}>
                    <div className="flex items-center gap-2">
                      <StatusDot status={check.status} />
                      {check.label}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2.5" style={{ width: '12%' }}>
                    <StatusBadge status={check.status} />
                  </td>

                  {/* Value */}
                  <td className="px-4 py-2.5" style={{ width: '28%' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-geist-mono, monospace)',
                        color: check.status === 'fail' ? 'var(--wb-critical)'
                          : check.status === 'warning' ? 'var(--wb-warning)'
                          : 'var(--wb-muted)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {check.value}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: 'var(--wb-muted)', width: '32%' }}>
                    {check.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
