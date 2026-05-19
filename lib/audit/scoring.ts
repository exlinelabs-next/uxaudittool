import type { AuditCheck, CategoryResult } from './types';

export function scoreStatus(score: number | null): 'pass' | 'warning' | 'fail' {
  if (score === null) return 'pass';
  if (score >= 0.9) return 'pass';
  if (score >= 0.5) return 'warning';
  return 'fail';
}

export function categoryScore(checks: AuditCheck[]): number {
  const total = checks.length;
  if (total === 0) return 0;
  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  return Math.round(((passed + warnings * 0.5) / total) * 100);
}

export function unavailableCategory(): CategoryResult {
  return { score: 0, checks: [], unavailable: true };
}
