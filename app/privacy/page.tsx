import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Privacy Policy - Webbeet UX Audit',
  description: 'Privacy policy for the Webbeet UX Audit tool by Exline Labs.',
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--wb-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{ background: 'var(--wb-bg)', borderBottom: '1px solid var(--wb-border)' }}
      >
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center gap-3">
          <a href="/" className="text-sm font-bold tracking-tight shrink-0" style={{ color: 'var(--wb-text)', textDecoration: 'none' }}>
            web<span style={{ color: 'var(--wb-accent)' }}>beet</span>
            <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--wb-muted)' }}>UX Audit</span>
          </a>
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: 'var(--wb-muted)', marginBottom: '2.5rem' }}>
          Last updated: May 2025 &mdash; Exline Labs
        </p>

        {[
          {
            title: '1. Who we are',
            body: 'This tool is operated by Exline Labs. Contact us at info@exlinelabs.com with any privacy queries.',
          },
          {
            title: '2. What data we collect',
            body: 'When you run an audit, we process the URL you submit server-side to fetch and analyse its content. We do not store the full HTML of audited pages beyond the request lifetime. Audit results (scores, check outcomes) are stored temporarily in our database to power shareable report links. We store your IP address for rate-limiting only and do not link it to audit results.',
          },
          {
            title: '3. Analytics cookies (Google Analytics 4)',
            body: 'With your explicit consent we load Google Analytics 4 to understand how the tool is used (pages visited, audit completion rates, geographic region). No personally identifiable information is sent. Analytics are loaded only after you click "Accept" on the cookie banner. You can withdraw consent at any time via the "Cookie preferences" link in the footer.',
          },
          {
            title: '4. Local storage',
            body: 'We store your theme preference (light/dark) in localStorage under the key "wb-theme". This never leaves your device. Your cookie consent choice is stored in localStorage under "wb-cookie-consent".',
          },
          {
            title: '5. Data sharing',
            body: 'We do not sell or share your data with third parties except as necessary to operate the service (Supabase for result storage, Google Analytics if consented). All processors are GDPR-compliant.',
          },
          {
            title: '6. Data retention',
            body: 'Shared audit reports are stored for up to 30 days and then automatically deleted. Rate-limit counters are stored in memory and reset hourly.',
          },
          {
            title: '7. Your rights',
            body: 'Under UK GDPR you have the right to access, correct, or delete your data. Since audit results are anonymous (stored by random ID, not linked to an account), deletion requests can be made by emailing us with the share link URL.',
          },
          {
            title: '8. Contact',
            body: 'For any privacy questions contact us at info@exlinelabs.com.',
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--wb-text)', marginBottom: '0.5rem' }}>
              {title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--wb-muted)', lineHeight: 1.7 }}>
              {body}
            </p>
          </section>
        ))}
      </main>
    </div>
  );
}
