'use client';

import { useState } from 'react';
import type { CategoryResult } from '@/lib/audit/types';
import { CheckRow } from './CheckRow';

const CATEGORY_LABELS: Record<string, string> = {
  seo:           'SEO',
  trust:         'Trust & Credibility',
  ux:            'UX Signals',
  performance:   'Performance',
  mobile:        'Mobile',
  accessibility: 'Accessibility',
};

const CATEGORY_ICONS: Record<string, string> = {
  seo:           '🔍',
  trust:         '🛡',
  ux:            '✦',
  performance:   '⚡',
  mobile:        '📱',
  accessibility: '♿',
};

function scoreColor(score: number) {
  if (score >= 80) return 'var(--wb-pass)';
  if (score >= 50) return 'var(--wb-warn)';
  return 'var(--wb-fail)';
}

/** Skeleton shown while a category is still loading */
export function CategoryCardSkeleton({ category }: { category: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)' }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{CATEGORY_ICONS[category] ?? '○'}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--wb-text)' }}>
            {CATEGORY_LABELS[category] ?? category}
          </span>
        </div>
        <div
          className="w-10 h-5 rounded-full animate-pulse"
          style={{ background: 'var(--wb-border)' }}
        />
      </div>
      <div className="px-5 pb-4 flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-10 rounded-lg animate-pulse"
            style={{ background: 'var(--wb-card-2)', animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CategoryCard({
  category,
  result,
}: {
  category: string;
  result: CategoryResult;
}) {
  const label = CATEGORY_LABELS[category] ?? category;
  const icon  = CATEGORY_ICONS[category] ?? '○';

  const fails   = result.checks.filter(c => c.status === 'fail').length;
  const warns   = result.checks.filter(c => c.status === 'warning').length;
  const color   = scoreColor(result.score);

  // Default expanded if there are any failures
  const [open, setOpen] = useState(fails > 0);

  if (result.unavailable) {
    return (
      <div
        className="rounded-xl px-5 py-4 flex items-center gap-3"
        style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)' }}
      >
        <span className="text-lg opacity-40">{icon}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--wb-muted)' }}>{label}</span>
        <span className="ml-auto text-xs" style={{ color: 'var(--wb-muted)' }}>Unavailable</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)' }}
    >
      {/* Header - click to expand/collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--wb-text)' }}>{label}</span>
          {fails > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--wb-fail) 15%, transparent)', color: 'var(--wb-fail)' }}>
              {fails} issue{fails !== 1 ? 's' : ''}
            </span>
          )}
          {fails === 0 && warns > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--wb-warn) 15%, transparent)', color: 'var(--wb-warn)' }}>
              {warns} warning{warns !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-bold" style={{ color }}>
            {result.score}
            <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--wb-muted)' }}>/100</span>
          </span>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ color: 'var(--wb-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Checks list */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {result.checks.map(check => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}
