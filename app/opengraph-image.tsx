import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Webbeet - Free Website UX Audit Tool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 100px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 40, left: 40, width: 28, height: 28, borderTop: '3px solid #C8F135', borderLeft: '3px solid #C8F135', opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: 40, right: 40, width: 28, height: 28, borderTop: '3px solid #C8F135', borderRight: '3px solid #C8F135', opacity: 0.7 }} />
        <div style={{ position: 'absolute', bottom: 40, left: 40, width: 28, height: 28, borderBottom: '3px solid #C8F135', borderLeft: '3px solid #C8F135', opacity: 0.7 }} />
        <div style={{ position: 'absolute', bottom: 40, right: 40, width: 28, height: 28, borderBottom: '3px solid #C8F135', borderRight: '3px solid #C8F135', opacity: 0.7 }} />

        {/* Eyebrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 32,
          background: 'rgba(200,241,53,0.08)',
          border: '1px solid rgba(200,241,53,0.25)',
          borderRadius: 999,
          padding: '6px 16px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8F135' }} />
          <span style={{ fontSize: 16, color: '#C8F135', fontWeight: 600 }}>
            Free - No signup - Instant results
          </span>
        </div>

        {/* Logo */}
        <div style={{ fontSize: 28, fontWeight: 700, color: '#e2e2e6', marginBottom: 24, letterSpacing: '-0.02em' }}>
          web<span style={{ color: '#C8F135' }}>beet</span>
          <span style={{ marginLeft: 12, fontSize: 18, fontWeight: 400, color: '#6b6b72' }}>UX Audit</span>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 62,
          fontWeight: 800,
          color: '#e2e2e6',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: 28,
          maxWidth: 900,
        }}>
          Is your website
          <span style={{ color: '#C8F135' }}> losing customers?</span>
        </div>

        {/* Sub */}
        <div style={{ fontSize: 22, color: '#6b6b72', maxWidth: 700, lineHeight: 1.5 }}>
          51 checks across SEO, performance, trust, mobile and accessibility. Free and instant.
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 40, marginTop: 52 }}>
          {[['51', 'checks'], ['6', 'categories'], ['~20s', 'average time'], ['100%', 'free']].map(([v, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#e2e2e6', letterSpacing: '-0.02em' }}>{v}</span>
              <span style={{ fontSize: 13, color: '#3a3a3f', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
