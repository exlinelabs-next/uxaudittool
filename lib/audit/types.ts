export type CheckStatus = 'pass' | 'warning' | 'fail';

export interface AuditCheck {
  id: string;
  label: string;
  value: string;
  status: CheckStatus;
  description: string;
}

export interface CategoryResult {
  score: number;
  checks: AuditCheck[];
  unavailable?: boolean;
}

export interface AuditCategories {
  performance: CategoryResult;
  seo: CategoryResult;
  trust: CategoryResult;
  ux: CategoryResult;
  mobile: CategoryResult;
  accessibility: CategoryResult;
}

export type CategoryKey = keyof AuditCategories;

export const ALL_CATEGORY_KEYS: CategoryKey[] = [
  'seo', 'trust', 'ux', 'performance', 'mobile', 'accessibility',
];

export interface AuditResult {
  url: string;
  scannedAt: string;
  overallScore: number;
  shareId?: string;
  shareUrl?: string;
  categories: AuditCategories;
}

// ── Streaming event types (Server-Sent Events) ────────────────────────────────

/** One category's result, emitted as soon as that category's checks finish. */
export interface CategoryEvent {
  type: 'category';
  key: CategoryKey;
  result: CategoryResult;
}

/** Emitted once all categories are done. Carries overall score + share link. */
export interface AuditDoneEvent {
  type: 'done';
  overallScore: number;
  shareId?: string;
  shareUrl?: string;
  scannedAt: string;
}

/** Fatal error before any results are ready. */
export interface AuditErrorEvent {
  type: 'error';
  error: string;
  status: number;
}

export type AuditStreamEvent = CategoryEvent | AuditDoneEvent | AuditErrorEvent;

// Keep legacy aliases so the static audit page stays unchanged
export type AuditPartialEvent = { type: 'partial'; categories: Pick<AuditCategories, 'seo' | 'trust' | 'ux'> };
export type AuditCompleteEvent = {
  type: 'complete';
  categories: Pick<AuditCategories, 'performance' | 'mobile' | 'accessibility'>;
  overallScore: number;
  shareId?: string;
  shareUrl?: string;
  scannedAt: string;
};
