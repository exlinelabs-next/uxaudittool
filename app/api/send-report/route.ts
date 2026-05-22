import { NextRequest, NextResponse } from 'next/server';
import { generateMarkdown, generatePdfHtml } from '@/lib/export';
import type { AuditCategories } from '@/lib/audit/types';

const BREVO_API  = 'https://api.brevo.com/v3/smtp/email';
const FROM_NAME  = process.env.MAIL_FROM_NAME    ?? 'Exline Labs';
const FROM_EMAIL = process.env.MAIL_FROM_ADDRESS ?? 'hello@exlinelabs.com';

async function sendViaBrevo(opts: {
  to: string;
  subject: string;
  html: string;
  attachmentName: string;
  attachmentContent: string; // base64
  attachmentType: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not set');

  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: opts.to }],
      subject:     opts.subject,
      htmlContent: opts.html,
      attachment:  [{ name: opts.attachmentName, content: opts.attachmentContent }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO', trust: 'Trust & Credibility', ux: 'UX Signals',
  performance: 'Performance', mobile: 'Mobile', accessibility: 'Accessibility',
};
const ORDER = ['seo', 'trust', 'ux', 'performance', 'mobile', 'accessibility'] as const;

function scoreColor(s: number) {
  return s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#c0392b';
}
function scoreLabel(s: number) {
  return s >= 80 ? 'Good' : s >= 60 ? 'Needs work' : 'Poor';
}

function buildEmailHtml(
  url: string,
  overallScore: number,
  categories: Partial<AuditCategories>,
  format: 'md' | 'pdf',
): string {
  const color = scoreColor(overallScore);

  const categoryRows = ORDER.map(key => {
    const cat = (categories as Record<string, { score: number; unavailable?: boolean; checks: { status: string }[] } | undefined>)[key];
    if (!cat || cat.unavailable) {
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:13px">${CATEGORY_LABELS[key]}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#999">Unavailable</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#999">—</td>
      </tr>`;
    }
    const c = scoreColor(cat.score);
    const fails = cat.checks.filter(ch => ch.status === 'fail').length;
    const warns = cat.checks.filter(ch => ch.status === 'warning').length;
    const issues = fails + warns > 0
      ? `${fails > 0 ? `${fails} fail` : ''}${fails > 0 && warns > 0 ? ', ' : ''}${warns > 0 ? `${warns} warn` : ''}`
      : 'All passed';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;font-weight:500;color:#1a1a1a">${CATEGORY_LABELS[key]}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;font-weight:700;color:${c}">${cat.score}/100 — ${scoreLabel(cat.score)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#555">${issues}</td>
    </tr>`;
  }).join('');

  const attachmentNote = format === 'pdf'
    ? 'The attached <strong>.html file</strong> is your full audit report. Open it in Chrome or Safari and press <strong>Cmd+P</strong> (Mac) or <strong>Ctrl+P</strong> (Windows), then choose &ldquo;Save as PDF&rdquo; to get a print-ready PDF.'
    : 'The attached <strong>.txt file</strong> is your full audit report in Markdown format. Open it in any Markdown viewer, Notion, or rename it to <strong>.md</strong> for full syntax highlighting.';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e5e5">

      <!-- Header -->
      <tr>
        <td style="background:#0a0a0a;padding:24px 28px;border-bottom:3px solid #C8F135">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#C8F135">Exline Labs</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.02em">Website UX Audit Report</p>
          <p style="margin:4px 0 0;font-size:12px;color:#aaa">${url}</p>
        </td>
      </tr>

      <!-- Score badge -->
      <tr>
        <td style="padding:24px 28px;border-bottom:1px solid #e5e5e5;text-align:center">
          <div style="display:inline-block;padding:16px 32px;border:2px solid ${color};border-radius:8px">
            <p style="margin:0;font-size:42px;font-weight:800;color:${color};letter-spacing:-0.04em;line-height:1">${overallScore}</p>
            <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.06em">${scoreLabel(overallScore)}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#777">Overall score</p>
          </div>
        </td>
      </tr>

      <!-- Category breakdown -->
      <tr>
        <td style="padding:20px 28px 8px">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#555">Category Breakdown</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:6px;overflow:hidden;border-collapse:collapse">
            <thead>
              <tr style="background:#f8f8f8">
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e5e5">Category</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e5e5">Score</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e5e5">Issues</th>
              </tr>
            </thead>
            <tbody>${categoryRows}</tbody>
          </table>
        </td>
      </tr>

      <!-- Attachment note -->
      <tr>
        <td style="padding:16px 28px;margin-bottom:0">
          <div style="background:#f8f8f8;border:1px solid #e5e5e5;border-radius:6px;padding:14px 16px">
            <p style="margin:0;font-size:13px;color:#333;line-height:1.6">${attachmentNote}</p>
          </div>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:16px 28px 28px">
          <div style="background:#0a0a0a;border-radius:8px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="margin:0;font-size:13px;font-weight:700;color:#fff">Want us to fix these issues?</p>
              <p style="margin:4px 0 0;font-size:11px;color:#888">We will build a prioritised action plan for your site.</p>
            </div>
            <a href="https://exlinelabs.com" style="display:inline-block;margin-left:16px;padding:9px 18px;background:#C8F135;color:#0a0a0a;font-size:12px;font-weight:700;text-decoration:none;border-radius:5px;white-space:nowrap;flex-shrink:0">
              Book a call
            </a>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 28px;background:#f8f8f8;border-top:1px solid #e5e5e5;text-align:center">
          <p style="margin:0;font-size:11px;color:#999">Generated by <a href="https://exlinelabs.com" style="color:#777;text-decoration:none">Exline Labs</a> &mdash; <a href="https://ux-audit.exlinelabs.co.uk" style="color:#777;text-decoration:none">ux-audit.exlinelabs.co.uk</a></p>
          <p style="margin:4px 0 0;font-size:11px;color:#bbb">You received this because you requested your audit report. No further emails will be sent.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  if (!process.env.BREVO_API_KEY) {
    return NextResponse.json({ error: 'Email delivery not configured' }, { status: 503 });
  }

  let body: {
    email?: unknown;
    format?: unknown;
    url?: unknown;
    overallScore?: unknown;
    categories?: unknown;
    scannedAt?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, format, url, overallScore, categories, scannedAt } = body;

  // Basic validation
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (format !== 'md' && format !== 'pdf') {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }
  if (typeof url !== 'string' || !url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }
  if (typeof overallScore !== 'number') {
    return NextResponse.json({ error: 'Missing overallScore' }, { status: 400 });
  }
  if (!categories || typeof categories !== 'object') {
    return NextResponse.json({ error: 'Missing categories' }, { status: 400 });
  }

  const cats = categories as Partial<AuditCategories>;
  const scannedAtStr = typeof scannedAt === 'string' ? scannedAt : undefined;

  // Generate attachment content
  let attachmentContent: string;
  let attachmentFilename: string;
  let attachmentType: string;

  try {
    if (format === 'md') {
      attachmentContent  = generateMarkdown(url, overallScore, cats, scannedAtStr);
      attachmentFilename = `ux-audit-${new URL(url).hostname.replace(/[^a-z0-9-]/gi, '-')}.txt`;
      attachmentType     = 'text/plain';
    } else {
      attachmentContent  = generatePdfHtml(url, overallScore, cats, scannedAtStr);
      attachmentFilename = `ux-audit-${new URL(url).hostname.replace(/[^a-z0-9-]/gi, '-')}.html`;
      attachmentType     = 'text/html';
    }
  } catch {
    return NextResponse.json({ error: 'Failed to generate report content' }, { status: 500 });
  }

  const subject = `Your UX Audit Report - ${url}`;
  const emailHtml = buildEmailHtml(url, overallScore, cats, format);

  try {
    await sendViaBrevo({
      to:                email,
      subject,
      html:              emailHtml,
      attachmentName:    attachmentFilename,
      attachmentContent: Buffer.from(attachmentContent, 'utf-8').toString('base64'),
      attachmentType,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-report] Brevo error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
