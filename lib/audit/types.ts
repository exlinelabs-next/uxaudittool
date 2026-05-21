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

export interface AuditResult {
  url: string;
  scannedAt: string;
  overallScore: number;
  shareId?: string;
  shareUrl?: string;
  categories: AuditCategories;
}

// --- Streaming event types (Server-Sent Events) ---

/** Phase 1: fast HTML-based results arrive within ~5s */
export interface AuditPartialEvent {
  type: 'partial';
  categories: Pick<AuditCategories, 'seo' | 'trust' | 'ux'>;
}

/** Phase 2: PageSpeed + accessibility results, plus the final score and share link */
export interface AuditCompleteEvent {
  type: 'complete';
  categories: Pick<AuditCategories, 'performance' | 'mobile' | 'accessibility'>;
  overallScore: number;
  shareId?: string;
  shareUrl?: string;
  scannedAt: string;
}

/** Emitted if a fatal error occurs before any results are ready */
export interface AuditErrorEvent {
  type: 'error';
  error: string;
  status: number;
}

export type AuditStreamEvent = AuditPartialEvent | AuditCompleteEvent | AuditErrorEvent;
