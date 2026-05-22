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

/**
 * Exline Labs official logo (from exlinelabs.com/images/exlinelabs-logo.svg).
 * Scaled to 200×74 for the PDF header — preserves the 640×238 aspect ratio.
 * Inlined so the PDF works without a network request (blob URLs block external resources).
 */
const EXLINE_LOGO_SVG = `<svg width="200" height="74" viewBox="0 0 640 238" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.40587 214.389V237.392H0V214.389H4.40587Z" fill="#332658"/>
<path d="M43.6279 237.392H43.1559L27.9871 223.722V237.392H23.6127V214.389H24.0848L39.2221 228.31V214.389H43.6279V237.392Z" fill="#332658"/>
<path d="M82.5223 237.392H82.0502L66.8814 223.722V237.392H62.507V214.389H62.9791L78.1164 228.31V214.389H82.5223V237.392Z" fill="#332658"/>
<path d="M112.164 237.832C104.958 237.832 100.237 232.49 100.237 225.891C100.237 219.323 104.958 213.949 112.164 213.949C119.403 213.949 124.123 219.323 124.123 225.891C124.123 232.49 119.403 237.832 112.164 237.832ZM112.164 218.066C108.01 218.066 104.611 221.743 104.611 225.891C104.611 230.07 108.01 233.747 112.164 233.747C116.35 233.747 119.717 230.07 119.717 225.891C119.717 221.743 116.35 218.066 112.164 218.066Z" fill="#332658"/>
<path d="M155.187 214.389H160.065L149.113 237.392H148.862L137.941 214.389H142.788L148.987 227.745L155.187 214.389Z" fill="#332658"/>
<path d="M175.345 237.392H170.561L182.331 214.389H182.772L194.542 237.392H189.758L187.964 233.778H177.107L175.345 237.392ZM182.551 223L179.247 229.944H185.824L182.551 223Z" fill="#332658"/>
<path d="M223.193 214.389V218.286H216.615V237.392H212.209V218.286H205.601V214.389H223.193Z" fill="#332658"/>
<path d="M245.257 214.389V237.392H240.851V214.389H245.257Z" fill="#332658"/>
<path d="M275.227 237.832C268.02 237.832 263.3 232.49 263.3 225.891C263.3 219.323 268.02 213.949 275.227 213.949C282.465 213.949 287.186 219.323 287.186 225.891C287.186 232.49 282.465 237.832 275.227 237.832ZM275.227 218.066C271.073 218.066 267.674 221.743 267.674 225.891C267.674 230.07 271.073 233.747 275.227 233.747C279.413 233.747 282.78 230.07 282.78 225.891C282.78 221.743 279.413 218.066 275.227 218.066Z" fill="#332658"/>
<path d="M324.941 237.392H324.469L309.3 223.722V237.392H304.926V214.389H305.398L320.535 228.31V214.389H324.941V237.392Z" fill="#332658"/>
<path d="M383.542 218.286H370.985V224.037H382.125V227.933H370.985V233.495H383.542V237.392H366.61V214.389H383.542V218.286Z" fill="#332658"/>
<path d="M400.177 237.392L408.737 226.016L399.989 214.389H405.496L411.475 222.685L417.455 214.389H422.931L414.213 226.016L422.773 237.392H417.266L411.475 229.379L405.685 237.392H400.177Z" fill="#332658"/>
<path d="M439.513 214.389H449.08C454.618 214.389 457.954 217.846 457.954 222.56C457.954 227.305 454.965 230.541 449.048 230.541H443.918V237.392H439.513V214.389ZM443.918 226.645H449.331C451.975 226.645 453.548 224.822 453.548 222.56C453.548 220.234 451.912 218.286 449.174 218.286H443.918V226.645Z" fill="#332658"/>
<path d="M479.094 233.495H491.273V237.392H474.688V214.389H479.094V233.495Z" fill="#332658"/>
<path d="M517.83 237.832C510.623 237.832 505.903 232.49 505.903 225.891C505.903 219.323 510.623 213.949 517.83 213.949C525.068 213.949 529.789 219.323 529.789 225.891C529.789 232.49 525.068 237.832 517.83 237.832ZM517.83 218.066C513.676 218.066 510.277 221.743 510.277 225.891C510.277 230.07 513.676 233.747 517.83 233.747C522.016 233.747 525.383 230.07 525.383 225.891C525.383 221.743 522.016 218.066 517.83 218.066Z" fill="#332658"/>
<path d="M556.278 230.07H551.903V237.392H547.529V214.389H557.977C562.666 214.389 565.908 217.657 565.908 222.308C565.908 225.765 564.019 228.876 561.124 229.662L566.883 237.392H561.628L556.278 230.07ZM551.903 218.286V226.236H556.939C560.652 226.236 561.533 224.225 561.533 222.277C561.533 220.046 560.18 218.286 556.939 218.286H551.903Z" fill="#332658"/>
<path d="M600.957 218.286H588.4V224.037H599.541V227.933H588.4V233.495H600.957V237.392H584.026V214.389H600.957V218.286Z" fill="#332658"/>
<path d="M628.45 237.392H619.355V214.389H628.45C635.846 214.389 640 218.851 640 225.891C640 232.898 635.972 237.392 628.45 237.392ZM623.761 218.349V233.432H628.45C631.692 233.432 635.563 232.301 635.563 225.922C635.563 219.511 631.66 218.349 628.45 218.349H623.761Z" fill="#332658"/>
<path d="M237.609 193.001V0.0429688H285.715V153.286H342.937V193.001H237.609Z" fill="url(#el_g0)"/>
<path d="M350.199 193.001V0.0429688H398.28L470.706 108.902V0.0429688H518.822V193.001H470.706L398.28 84.089V193.001H350.199Z" fill="url(#el_g1)"/>
<path d="M293.09 145.913V0.0429688H342.932V145.913H293.09Z" fill="url(#el_g2)"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H113.905V46.1626H0V0Z" fill="url(#el_g3)"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M0 73.4045H113.905V119.599H0V73.4045Z" fill="url(#el_g3)"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M0 146.84H113.905V193.003H0V146.84Z" fill="url(#el_g3)"/>
<path d="M282.572 0H222.773L155.258 96.5173L222.773 193.003H282.572L215.057 96.5173L282.572 0Z" fill="url(#el_g6)"/>
<path d="M81.7148 0H141.514L209.029 96.5173L141.514 193.003H81.7148L149.23 96.5173L81.7148 0Z" fill="url(#el_g7)"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M526.106 0.0429688H639.995V46.1187H526.106V0.0429688Z" fill="url(#el_g8)"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M526.106 73.3093H639.995V119.417H526.106V73.3093Z" fill="url(#el_g8)"/>
<path d="M526.09 193.001H530.202V146.894H526.09V193.001Z" fill="url(#el_g8)"/>
<path d="M538.112 186.685H551.082V189.843C551.082 192.938 551.082 193.001 551.81 193.001C552.538 193.001 552.601 192.811 553.582 186.432C554.404 181.316 560.13 149.989 560.7 147.431C560.826 146.925 560.13 146.894 549.469 146.894H538.112V186.685Z" fill="url(#el_g8)"/>
<path d="M572.152 147.431C573.291 152.168 580.187 191.074 580.187 192.685C580.187 192.875 581.073 193.001 582.244 193.001H584.3V146.894H578.163C572.468 146.894 572.025 146.925 572.152 147.431Z" fill="url(#el_g8)"/>
<path d="M601.067 147.178C602.744 147.715 604.515 148.82 605.464 149.957C607.078 151.883 607.394 153.557 607.394 159.81C607.394 166.252 607.046 167.421 604.642 169.095C603.44 169.947 603.345 170.105 603.819 170.358C604.863 170.926 606.192 172.316 606.793 173.484C607.331 174.495 607.394 175.379 607.394 180.148C607.394 187 607.046 188.422 604.863 190.506C604.041 191.327 602.744 192.18 601.984 192.464C600.656 192.938 601.004 192.938 608.976 192.969C617.233 193.001 617.359 193.001 616.41 192.432C614.86 191.485 613.468 189.653 612.93 187.885C612.614 186.779 612.456 184.916 612.456 182.042V177.811L620.523 178L620.681 182.011C620.871 186.811 620.997 187.064 623.781 187.253C625.395 187.379 625.743 187.285 626.565 186.59C627.451 185.832 627.483 185.674 627.578 182.548C627.672 180.653 627.546 178.79 627.324 178.063C626.787 176.232 624.762 174.242 620.808 171.621C616.853 169.031 614.354 166.568 613.31 164.358C612.677 163 612.614 162.336 612.614 157.631V152.42L613.595 150.683C614.227 149.546 615.081 148.599 616.062 147.904L617.581 146.894L608.944 146.925C604.167 146.925 600.624 147.052 601.067 147.178Z" fill="url(#el_g8)"/>
<path d="M631.279 147.431C632.671 148.157 633.936 149.42 634.632 150.778C635.392 152.231 635.929 156.305 635.803 159.526L635.708 161.894L627.641 162.084V158.736C627.641 154.599 627.23 153.431 625.585 152.894C624.098 152.389 622.389 152.673 621.44 153.557C620.744 154.22 620.681 154.505 620.681 157.536C620.681 159.779 620.839 161.105 621.124 161.673C621.851 163.063 624.098 164.989 627.609 167.295C633.177 170.926 634.98 173.263 635.613 177.59C635.993 180.369 635.708 186.495 635.075 188.264C634.474 190.001 633.399 191.359 631.912 192.243L630.646 193.001H639.979V146.894H635.17C630.551 146.925 630.362 146.957 631.279 147.431Z" fill="url(#el_g8)"/>
<path d="M592.272 160.063L592.367 166.631L594.835 166.568C596.48 166.537 597.587 166.347 598.061 166.031C599.2 165.274 599.58 163.379 599.422 158.926C599.295 155.136 599.264 155.01 598.409 154.284C597.65 153.62 597.239 153.526 594.866 153.526H592.209L592.272 160.063Z" fill="url(#el_g8)"/>
<path d="M566.299 158.168C566.299 158.357 565.635 162.526 564.844 167.421C564.053 172.316 563.421 176.453 563.421 176.611C563.421 176.769 564.781 176.895 566.426 176.895C568.071 176.895 569.431 176.832 569.431 176.737C569.431 176.421 566.584 158.768 566.458 158.263C566.394 158.01 566.331 157.947 566.299 158.168Z" fill="url(#el_g8)"/>
<path d="M592.209 186.685H594.423C597.207 186.685 598.757 186.085 599.074 184.885C599.2 184.411 599.327 182.042 599.327 179.674C599.327 175.347 599.327 175.316 598.441 174.463C597.65 173.674 597.334 173.579 594.898 173.453L592.209 173.358V186.685Z" fill="url(#el_g8)"/>
<path d="M561.712 187.127C561.428 189.085 561.111 191.201 560.985 191.864L560.795 193.001H572.057L571.867 192.117C571.773 191.643 571.456 189.527 571.14 187.38L570.539 183.527H562.25L561.712 187.127Z" fill="url(#el_g8)"/>
<defs>
<linearGradient id="el_g0" x1="237.608" y1="0.049" x2="342.82" y2="193.053" gradientUnits="userSpaceOnUse"><stop stop-color="#1B0D3C"/><stop offset="0.25" stop-color="#1B0D3C"/><stop offset="1" stop-color="#564980"/></linearGradient>
<linearGradient id="el_g1" x1="389.703" y1="0.039" x2="389.703" y2="192.997" gradientUnits="userSpaceOnUse"><stop stop-color="#1B0D3C"/><stop offset="0.25" stop-color="#1B0D3C"/><stop offset="1" stop-color="#564980"/></linearGradient>
<linearGradient id="el_g2" x1="318.013" y1="0.049" x2="318.013" y2="145.935" gradientUnits="userSpaceOnUse"><stop stop-color="#1B0D3C"/><stop offset="0.2" stop-color="#1B0D3C"/><stop offset="1" stop-color="#564980"/></linearGradient>
<linearGradient id="el_g3" x1="113.921" y1="-0.013" x2="-0.091" y2="192.932" gradientUnits="userSpaceOnUse"><stop stop-color="#1B0D3C"/><stop offset="0.25" stop-color="#1B0D3C"/><stop offset="1" stop-color="#564980"/></linearGradient>
<linearGradient id="el_g6" x1="218.915" y1="0" x2="218.915" y2="193.003" gradientUnits="userSpaceOnUse"><stop stop-color="#7509B3"/><stop offset="0.5" stop-color="#6E00AE"/><stop offset="1" stop-color="#6600A0"/></linearGradient>
<linearGradient id="el_g7" x1="177.801" y1="193.022" x2="177.801" y2="-0.017" gradientUnits="userSpaceOnUse"><stop stop-color="#6F30FE"/><stop offset="0.5" stop-color="#682DF0"/><stop offset="1" stop-color="#783DFF"/></linearGradient>
<linearGradient id="el_g8" x1="639.995" y1="0.03" x2="526.293" y2="193.101" gradientUnits="userSpaceOnUse"><stop stop-color="#1B0D3C"/><stop offset="0.25" stop-color="#1B0D3C"/><stop offset="1" stop-color="#564980"/></linearGradient>
</defs>
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
      <span class="cat-score" style="color:${scoreColor}">${cat.score}<span style="font-size:14pt;color:#555"> / 100</span></span>
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
      return `<tr><td>${lbl}</td><td style="color:#666">—</td><td style="color:#666">Unavailable</td><td style="color:#666">—</td></tr>`;
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
          <span style="font-size:10pt;color:#666;font-weight:500">Unavailable — timed out or blocked</span>
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
    color: #444;
    margin-top: 3px;
    font-weight: 500;
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
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #555;
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
    color: #444;
    margin-top: 2px;
    font-weight: 600;
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
    color: #333;
    padding-bottom: 6px;
    border-bottom: 2px solid #e5e5e5;
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
    font-weight: 700;
    color: #333;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #d0d0d0;
  }
  td {
    padding: 7px 10px;
    vertical-align: top;
    border-bottom: 1px solid #e8e8e8;
    color: #1a1a1a;
  }
  tr:last-child td { border-bottom: none; }
  .td-check  { width: 22%; font-weight: 600; color: #1a1a1a; }
  .td-pts    { width: 8%;  font-family: 'Courier New', monospace; font-size: 8pt; font-weight: 700; white-space: nowrap; }
  .td-status { width: 8%;  }
  .td-value  { width: 24%; }
  .td-notes  { width: 38%; color: #444; }
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
    color: #666;
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
      <p style="font-size:8pt;color:#555;margin-top:6px;font-weight:500">exlinelabs.com</p>
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
          <div style="font-size:7.5pt;color:#555;font-weight:600">Fail</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:16pt;font-weight:800;color:#d97706">${totalWarn}</div>
          <div style="font-size:7.5pt;color:#555;font-weight:600">Warn</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:16pt;font-weight:800;color:#16a34a">${totalPass}</div>
          <div style="font-size:7.5pt;color:#555;font-weight:600">Pass</div>
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
