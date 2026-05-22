import type { AuditCategories, CategoryResult } from '@/lib/audit/types';

const CATEGORY_LABELS: Record<string, string> = {
  seo:           'SEO',
  trust:         'Trust & Credibility',
  ux:            'UX Signals',
  performance:   'Performance',
  mobile:        'Mobile',
  accessibility: 'Accessibility',
};

const ORDER = ['seo', 'trust', 'ux', 'performance', 'mobile', 'accessibility'] as const;

function scoreLabel(s: number) {
  return s >= 80 ? 'Good' : s >= 60 ? 'Needs work' : 'Poor';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hostname(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

function formatDate(scannedAt?: string) {
  const d = scannedAt ? new Date(scannedAt) : new Date();
  return d.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
}

// ── Markdown export ───────────────────────────────────────────────────────────

export function generateMarkdown(
  url: string,
  overallScore: number,
  categories: Partial<AuditCategories>,
  scannedAt?: string,
): string {
  const date  = formatDate(scannedAt);
  const label = scoreLabel(overallScore);

  // Tally totals across all available categories
  let totalFail = 0, totalWarn = 0, totalPass = 0, totalChecks = 0;
  for (const key of ORDER) {
    const cat = (categories as Record<string, CategoryResult | undefined>)[key];
    if (!cat || cat.unavailable) continue;
    totalFail   += cat.checks.filter(c => c.status === 'fail').length;
    totalWarn   += cat.checks.filter(c => c.status === 'warning').length;
    totalPass   += cat.checks.filter(c => c.status === 'pass').length;
    totalChecks += cat.checks.length;
  }

  const lines: string[] = [];

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push('# UX Audit Report');
  lines.push('');
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Site** | ${url} |`);
  lines.push(`| **Scanned** | ${date} |`);
  lines.push(`| **Overall Score** | **${overallScore} / 100** — ${label} |`);
  lines.push(`| **Powered by** | [Exline Labs](https://exlinelabs.com) via [ux-audit.exlinelabs.co.uk](https://ux-audit.exlinelabs.co.uk) |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Score summary table ────────────────────────────────────────────────────
  lines.push('## Score Summary');
  lines.push('');
  lines.push('| Category | Score | Rating | Issues |');
  lines.push('|----------|-------|--------|--------|');

  for (const key of ORDER) {
    const cat  = (categories as Record<string, CategoryResult | undefined>)[key];
    const lbl  = CATEGORY_LABELS[key];
    if (!cat || cat.unavailable) {
      lines.push(`| ${lbl} | — | Unavailable | — |`);
      continue;
    }
    const fails = cat.checks.filter(c => c.status === 'fail').length;
    const warns = cat.checks.filter(c => c.status === 'warning').length;
    const issues = [
      fails > 0 ? `${fails} fail` : '',
      warns > 0 ? `${warns} warn` : '',
    ].filter(Boolean).join(', ') || 'All passed';
    lines.push(`| ${lbl} | ${cat.score} / 100 | ${scoreLabel(cat.score)} | ${issues} |`);
  }

  lines.push('');
  lines.push(`> **${totalFail} failures, ${totalWarn} warnings, ${totalPass} passed** across ${totalChecks} checks total.`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Category sections ──────────────────────────────────────────────────────
  for (const key of ORDER) {
    const cat = (categories as Record<string, CategoryResult | undefined>)[key];
    const lbl = CATEGORY_LABELS[key];

    if (!cat) continue;

    if (cat.unavailable) {
      lines.push(`## ${lbl} — Unavailable`);
      lines.push('');
      lines.push('> This category timed out or was blocked during the audit. Re-run to retry.');
      lines.push('');
      lines.push('---');
      lines.push('');
      continue;
    }

    const fails = cat.checks.filter(c => c.status === 'fail').length;
    const warns = cat.checks.filter(c => c.status === 'warning').length;

    lines.push(`## ${lbl} — ${cat.score} / 100`);
    lines.push('');

    const issueSummary = [
      fails > 0 ? `${fails} failure${fails !== 1 ? 's' : ''}` : '',
      warns > 0 ? `${warns} warning${warns !== 1 ? 's' : ''}` : '',
    ].filter(Boolean).join(', ');
    lines.push(`> ${issueSummary || 'All checks passed.'}`);
    lines.push('');

    lines.push('| Check | Status | Value | Recommendation |');
    lines.push('|-------|--------|-------|----------------|');

    // Failures first, then warnings, then passes
    const sorted = [
      ...cat.checks.filter(c => c.status === 'fail'),
      ...cat.checks.filter(c => c.status === 'warning'),
      ...cat.checks.filter(c => c.status === 'pass'),
    ];

    for (const check of sorted) {
      const status =
        check.status === 'fail'    ? 'FAIL' :
        check.status === 'warning' ? 'WARN' : 'PASS';
      const value = (check.value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      const desc  = (check.description ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      lines.push(`| ${check.label} | ${status} | ${value} | ${desc} |`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  lines.push('*Generated by [Exline Labs](https://exlinelabs.com) — free instant website audit across 51 checks.*');
  lines.push('*Book a free discovery call at [exlinelabs.com](https://exlinelabs.com)*');

  return lines.join('\n');
}

export function downloadMarkdown(
  url: string,
  overallScore: number,
  categories: Partial<AuditCategories>,
  scannedAt?: string,
): void {
  const md   = generateMarkdown(url, overallScore, categories, scannedAt);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = href;
  a.download = `exlinelabs-ux-audit-${hostname(url)}.md`;
  a.click();
  URL.revokeObjectURL(href);
}

// ── PDF export — dedicated print HTML ────────────────────────────────────────

/** Inline SVG of the Exline Labs wordmark for embedding in the print document. */
const EXLINE_LOGO_SVG = `<svg width="130" height="28" viewBox="0 0 130 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="28" height="28" rx="5" fill="#C8F135"/>
  <text x="5" y="20" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="800" fill="#0a0a0a">EL</text>
  <text x="36" y="19" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="700" fill="#1a1a1a">Exline Labs</text>
</svg>`;

function statusCell(status: string): string {
  const color =
    status === 'fail'    ? '#c0392b' :
    status === 'warning' ? '#d97706' : '#16a34a';
  const text =
    status === 'fail'    ? 'FAIL' :
    status === 'warning' ? 'WARN' : 'PASS';
  return `<span class="badge" style="background:${color}15;color:${color};border:1px solid ${color}40">${text}</span>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderCategoryTable(key: string, cat: CategoryResult): string {
  const label  = CATEGORY_LABELS[key] ?? key;
  const ptsEach = cat.checks.length > 0 ? Math.round(100 / cat.checks.length) : 0;
  const fails  = cat.checks.filter(c => c.status === 'fail').length;
  const warns  = cat.checks.filter(c => c.status === 'warning').length;
  const sorted = [
    ...cat.checks.filter(c => c.status === 'fail'),
    ...cat.checks.filter(c => c.status === 'warning'),
    ...cat.checks.filter(c => c.status === 'pass'),
  ];

  const issueLine = [
    fails > 0 ? `<span style="color:#c0392b;font-weight:600">${fails} failure${fails !== 1 ? 's' : ''}</span>` : '',
    warns > 0 ? `<span style="color:#d97706;font-weight:600">${warns} warning${warns !== 1 ? 's' : ''}</span>` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ') || '<span style="color:#16a34a;font-weight:600">All checks passed</span>';

  const scoreColor =
    cat.score >= 80 ? '#16a34a' : cat.score >= 60 ? '#d97706' : '#c0392b';

  const rows = sorted.map((check, i) => {
    const pts =
      check.status === 'fail'    ? `-${ptsEach} pts` :
      check.status === 'warning' ? `-${Math.round(ptsEach / 2)} pts` :
      `+${ptsEach} pts`;
    const ptsColor =
      check.status === 'fail'    ? '#c0392b' :
      check.status === 'warning' ? '#d97706' : '#16a34a';
    return `
    <tr style="${i % 2 === 1 ? 'background:#f9f9f9' : ''}">
      <td class="td-check">${esc(check.label)}</td>
      <td class="td-pts" style="color:${ptsColor}">${pts}</td>
      <td class="td-status">${statusCell(check.status)}</td>
      <td class="td-value"><code>${esc(check.value ?? '')}</code></td>
      <td class="td-notes">${esc(check.description ?? '')}</td>
    </tr>`;
  }).join('');

  return `
  <section class="category">
    <div class="cat-header">
      <div>
        <span class="cat-label">${label}</span>
        <span class="cat-issues">${issueLine}</span>
      </div>
      <span class="cat-score" style="color:${scoreColor}">${cat.score}<span style="font-size:14pt;color:#888"> / 100</span></span>
    </div>
    <table>
      <thead>
        <tr>
          <th class="td-check">Check</th>
          <th class="td-pts">Impact</th>
          <th class="td-status">Status</th>
          <th class="td-value">Value</th>
          <th class="td-notes">Recommendation</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function generatePdfHtml(
  url: string,
  overallScore: number,
  categories: Partial<AuditCategories>,
  scannedAt?: string,
): string {
  const date  = formatDate(scannedAt);
  const label = scoreLabel(overallScore);
  const host  = hostname(url);

  const scoreColor =
    overallScore >= 80 ? '#16a34a' : overallScore >= 60 ? '#d97706' : '#c0392b';

  // Build score summary rows
  const summaryRows = ORDER.map(key => {
    const cat = (categories as Record<string, CategoryResult | undefined>)[key];
    const lbl = CATEGORY_LABELS[key];
    if (!cat || cat.unavailable) {
      return `<tr><td>${lbl}</td><td style="color:#999">—</td><td style="color:#999">Unavailable</td><td style="color:#999">—</td></tr>`;
    }
    const c = cat.score >= 80 ? '#16a34a' : cat.score >= 60 ? '#d97706' : '#c0392b';
    const fails = cat.checks.filter(c => c.status === 'fail').length;
    const warns = cat.checks.filter(c => c.status === 'warning').length;
    const issues = [
      fails > 0 ? `<span style="color:#c0392b">${fails} fail</span>` : '',
      warns > 0 ? `<span style="color:#d97706">${warns} warn</span>` : '',
    ].filter(Boolean).join(', ') || `<span style="color:#16a34a">All passed</span>`;
    return `<tr>
      <td>${lbl}</td>
      <td style="color:${c};font-weight:700;font-variant-numeric:tabular-nums">${cat.score} / 100</td>
      <td style="color:${c}">${scoreLabel(cat.score)}</td>
      <td>${issues}</td>
    </tr>`;
  }).join('');

  // Build category sections
  const categorySections = ORDER.map(key => {
    const cat = (categories as Record<string, CategoryResult | undefined>)[key];
    if (!cat) return '';
    if (cat.unavailable) {
      return `<section class="category">
        <div class="cat-header">
          <span class="cat-label">${CATEGORY_LABELS[key]}</span>
          <span style="font-size:10pt;color:#999;font-weight:500">Unavailable — timed out or blocked</span>
        </div>
      </section>`;
    }
    return renderCategoryTable(key, cat);
  }).join('');

  // Tally totals
  let totalFail = 0, totalWarn = 0, totalPass = 0, totalChecks = 0;
  for (const key of ORDER) {
    const cat = (categories as Record<string, CategoryResult | undefined>)[key];
    if (!cat || cat.unavailable) continue;
    totalFail   += cat.checks.filter(c => c.status === 'fail').length;
    totalWarn   += cat.checks.filter(c => c.status === 'warning').length;
    totalPass   += cat.checks.filter(c => c.status === 'pass').length;
    totalChecks += cat.checks.length;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>UX Audit Report — ${esc(host)}</title>
<style>
  @page {
    size: A4;
    margin: 16mm 18mm 20mm;
    @bottom-left   { content: "${esc(url)}"; font-size: 8pt; color: #999; }
    @bottom-right  { content: "Page " counter(page) " of " counter(pages); font-size: 8pt; color: #999; }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.55;
  }

  /* ── Document header ─────────────────────────────────────────────── */
  .doc-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 3px solid #C8F135;
    margin-bottom: 22px;
  }
  .doc-header-left h1 {
    font-size: 18pt;
    font-weight: 800;
    color: #0a0a0a;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .doc-header-left p {
    font-size: 9pt;
    color: #666;
    margin-top: 3px;
  }
  .doc-header-right {
    text-align: right;
  }

  /* ── Meta strip ──────────────────────────────────────────────────── */
  .meta-strip {
    display: flex;
    gap: 0;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 20px;
    break-inside: avoid;
  }
  .meta-cell {
    flex: 1;
    padding: 10px 14px;
    border-right: 1px solid #e5e5e5;
  }
  .meta-cell:last-child { border-right: none; }
  .meta-label {
    font-size: 7.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #999;
    margin-bottom: 3px;
  }
  .meta-value {
    font-size: 10pt;
    font-weight: 600;
    color: #1a1a1a;
    word-break: break-all;
  }
  .meta-score {
    font-size: 20pt;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: ${scoreColor};
    line-height: 1;
  }
  .meta-score-label {
    font-size: 8.5pt;
    color: #888;
    margin-top: 2px;
  }

  /* ── Score summary table ─────────────────────────────────────────── */
  .summary-section {
    margin-bottom: 24px;
    break-inside: avoid;
  }
  .section-title {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #555;
    padding-bottom: 6px;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 10px;
  }

  /* ── Category sections ───────────────────────────────────────────── */
  .category {
    margin-bottom: 20px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    overflow: hidden;
    /* Don't avoid breaks on whole section — that creates blank-page gaps.
       Instead keep the header glued to the first data row (below). */
  }
  .cat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #f8f8f8;
    border-bottom: 1px solid #e5e5e5;
    break-inside: avoid;
    break-after: avoid; /* Keep header glued to first table row */
  }
  .cat-label {
    font-size: 11pt;
    font-weight: 700;
    color: #0a0a0a;
    margin-right: 12px;
  }
  .cat-issues {
    font-size: 8.5pt;
  }
  .cat-score {
    font-size: 18pt;
    font-weight: 800;
    letter-spacing: -0.03em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── Tables ──────────────────────────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }
  thead tr {
    background: #f2f2f2;
    break-inside: avoid;
    break-after: avoid;
  }
  tr { break-inside: avoid; }
  th {
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
    color: #555;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e0e0e0;
  }
  td {
    padding: 7px 10px;
    vertical-align: top;
    border-bottom: 1px solid #efefef;
  }
  tr:last-child td { border-bottom: none; }
  .td-check  { width: 22%; font-weight: 500; color: #1a1a1a; }
  .td-pts    { width: 8%;  font-family: 'Courier New', monospace; font-size: 8pt; font-weight: 600; white-space: nowrap; }
  .td-status { width: 8%;  }
  .td-value  { width: 24%; }
  .td-notes  { width: 38%; color: #555; }
  code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 7.5pt;
    color: #444;
    word-break: break-all;
  }
  .badge {
    display: inline-block;
    padding: 1px 7px;
    border-radius: 3px;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  /* ── Footer CTA ──────────────────────────────────────────────────── */
  .cta-box {
    margin-top: 24px;
    padding: 14px 18px;
    border: 2px solid #C8F135;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    break-inside: avoid;
  }
  .cta-box p { font-size: 9.5pt; color: #333; }
  .cta-box a {
    font-size: 10pt;
    font-weight: 700;
    color: #0a0a0a;
    background: #C8F135;
    padding: 7px 16px;
    border-radius: 4px;
    text-decoration: none;
    white-space: nowrap;
  }
  .doc-footer {
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 8pt;
    color: #aaa;
  }
</style>
<!-- Auto-trigger print when the document is fully loaded -->
<script>window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 500); });</script>
</head>
<body>

  <!-- ── Document header ────────────────────────────────────────────────── -->
  <div class="doc-header">
    <div class="doc-header-left">
      <h1>Website UX Audit</h1>
      <p>Comprehensive analysis across 6 categories — ${totalChecks} checks</p>
    </div>
    <div class="doc-header-right">
      ${EXLINE_LOGO_SVG}
      <p style="font-size:8pt;color:#999;margin-top:4px">ux-audit.exlinelabs.co.uk</p>
    </div>
  </div>

  <!-- ── Meta strip ─────────────────────────────────────────────────────── -->
  <div class="meta-strip">
    <div class="meta-cell">
      <div class="meta-label">Audited site</div>
      <div class="meta-value">${esc(url)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Scan date</div>
      <div class="meta-value">${date}</div>
    </div>
    <div class="meta-cell" style="flex:0 0 auto;min-width:130px;text-align:center">
      <div class="meta-label">Overall score</div>
      <div class="meta-score">${overallScore}</div>
      <div class="meta-score-label">${label}</div>
    </div>
    <div class="meta-cell" style="flex:0 0 auto;min-width:140px">
      <div class="meta-label">Issue summary</div>
      <div style="display:flex;gap:16px;margin-top:4px">
        <div style="text-align:center">
          <div style="font-size:16pt;font-weight:800;color:#c0392b">${totalFail}</div>
          <div style="font-size:7.5pt;color:#999">Fail</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:16pt;font-weight:800;color:#d97706">${totalWarn}</div>
          <div style="font-size:7.5pt;color:#999">Warn</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:16pt;font-weight:800;color:#16a34a">${totalPass}</div>
          <div style="font-size:7.5pt;color:#999">Pass</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Score summary ──────────────────────────────────────────────────── -->
  <div class="summary-section">
    <div class="section-title">Score Summary</div>
    <table>
      <thead>
        <tr>
          <th style="width:30%">Category</th>
          <th style="width:18%">Score</th>
          <th style="width:18%">Rating</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>${summaryRows}</tbody>
    </table>
  </div>

  <!-- ── Category detail sections ───────────────────────────────────────── -->
  <div class="section-title">Detailed Results</div>
  <div style="margin-top:12px">
    ${categorySections}
  </div>

  <!-- ── CTA ────────────────────────────────────────────────────────────── -->
  <div class="cta-box">
    <div>
      <p><strong>Want us to fix these issues?</strong></p>
      <p style="color:#666;font-size:8.5pt;margin-top:2px">We will walk through your results and build a prioritised action plan.</p>
    </div>
    <a href="https://exlinelabs.com">Book a free discovery call</a>
  </div>

  <!-- ── Footer ─────────────────────────────────────────────────────────── -->
  <div class="doc-footer">
    <span>Generated by Exline Labs &mdash; exlinelabs.com</span>
    <span>${esc(url)} &mdash; ${date}</span>
  </div>

</body>
</html>`;
}

export function exportPdf(
  url: string,
  overallScore: number,
  categories: Partial<AuditCategories>,
  scannedAt?: string,
): void {
  const html    = generatePdfHtml(url, overallScore, categories, scannedAt);
  const blob    = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  // Open as a regular link — not blocked by popup blockers.
  // The HTML embeds a <script> that auto-triggers window.print() on load.
  const a = document.createElement('a');
  a.href   = blobUrl;
  a.target = '_blank';
  a.rel    = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Keep the blob alive long enough for the new tab to load, then release it
  setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}
