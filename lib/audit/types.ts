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

export interface AuditResult {
  url: string;
  scannedAt: string;
  overallScore: number;
  timedOut?: boolean;
  categories: {
    performance: CategoryResult;
    seo?: CategoryResult;
    accessibility?: CategoryResult;
    mobile?: CategoryResult;
    ux?: CategoryResult;
    trust?: CategoryResult;
  };
}
