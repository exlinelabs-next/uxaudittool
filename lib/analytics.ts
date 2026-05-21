/**
 * Thin wrapper around gtag so the rest of the app never imports gtag directly.
 * Events are silently dropped if GA has not loaded (consent declined / no GA_ID).
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

/* ── Typed audit events ───────────────────────────────────────────────────── */

export function trackAuditStarted(url: string) {
  trackEvent('audit_started', {
    // Only send the hostname, never the full URL (privacy)
    site_domain: (() => { try { return new URL(url).hostname; } catch { return 'unknown'; } })(),
  });
}

export function trackAuditCompleted(score: number, durationMs: number) {
  trackEvent('audit_completed', {
    overall_score: score,
    score_band: score >= 80 ? 'good' : score >= 50 ? 'needs_work' : 'poor',
    duration_s: Math.round(durationMs / 1000),
  });
}

export function trackAuditErrored(reason: string) {
  trackEvent('audit_error', { reason });
}

export function trackShareCopied() {
  trackEvent('share_link_copied');
}
