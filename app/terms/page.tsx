import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Terms of Service - Webbeet UX Audit',
  description: 'Terms of service for the Webbeet UX Audit tool by Exline Labs.',
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--wb-bg)' }}>
      <header
        className="sticky top-0 z-10"
        style={{ background: 'var(--wb-bg)', borderBottom: '1px solid var(--wb-border)' }}
      >
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center gap-3">
          <nav aria-label="Main navigation">
            <a href="/" className="text-sm font-bold tracking-tight shrink-0" style={{ color: 'var(--wb-text)', textDecoration: 'none' }}>
              web<span style={{ color: 'var(--wb-accent)' }}>beet</span>
              <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--wb-muted)' }}>UX Audit</span>
            </a>
          </nav>
          <a
            href="/"
            className="ml-auto px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--wb-surface)', border: '1px solid var(--wb-border)', color: 'var(--wb-muted)', textDecoration: 'none' }}
          >
            Back to audit
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--wb-text)', marginBottom: '0.5rem' }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: 'var(--wb-muted)', marginBottom: '2.5rem' }}>
          Last updated: May 2025 - Exline Labs
        </p>

        {[
          {
            title: '1. Acceptance',
            body: 'By using the Webbeet UX Audit tool ("the Service") you agree to these terms. If you do not agree, please do not use the Service.',
          },
          {
            title: '2. Description of service',
            body: 'The Service provides automated website analysis across SEO, performance, trust, mobile-readiness, accessibility and UX signals. Results are indicative and for informational purposes only. We make no guarantees about the completeness or accuracy of the audit results.',
          },
          {
            title: '3. Acceptable use',
            body: 'You may only audit websites that you own or have permission to test. You must not use the Service to audit websites without authorisation, to attempt to circumvent rate limits, or for any illegal purpose. We reserve the right to block access for abuse.',
          },
          {
            title: '4. Rate limits',
            body: 'To ensure fair use for all visitors, the Service applies a rate limit of 5 audits per IP address per hour. Excessive or automated usage may result in temporary or permanent restriction.',
          },
          {
            title: '5. Intellectual property',
            body: 'The Webbeet UX Audit tool is owned by Exline Labs. You may not copy, reverse-engineer, or redistribute any part of the Service without written permission.',
          },
          {
            title: '6. Disclaimer',
            body: 'The Service is provided "as is" without warranties of any kind. Exline Labs shall not be liable for any losses or damages arising from use of or reliance on the audit results.',
          },
          {
            title: '7. Changes',
            body: 'We may update these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.',
          },
          {
            title: '8. Contact',
            body: 'Questions about these terms? Email us at info@exlinelabs.com.',
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--wb-text)', marginBottom: '0.5rem' }}>
              {title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--wb-muted)', lineHeight: 1.7 }}>{body}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
