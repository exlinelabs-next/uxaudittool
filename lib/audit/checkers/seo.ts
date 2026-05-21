import type { CheerioAPI } from 'cheerio';
import { categoryScore } from '../scoring';
import type { AuditCheck, CategoryResult } from '../types';

export function runSeoChecks($: CheerioAPI): CategoryResult {
  const checks: AuditCheck[] = [];

  // --- Title tag ---
  const title = $('title').first().text().trim();
  const titleLen = title.length;

  checks.push({
    id: 'title-present',
    label: 'Title tag',
    value: title ? `"${title.slice(0, 50)}${title.length > 50 ? '...' : ''}"` : 'Missing',
    status: title ? 'pass' : 'fail',
    description: 'Every page needs a unique, descriptive title tag.',
  });

  checks.push({
    id: 'title-length',
    label: 'Title length',
    value: title ? `${titleLen} characters` : 'No title',
    status: !title ? 'fail' : titleLen >= 30 && titleLen <= 60 ? 'pass' : 'warning',
    description: 'Aim for 30-60 characters. Too short lacks context, too long gets cut off in search results.',
  });

  // --- Meta description ---
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const descLen = metaDesc.length;

  checks.push({
    id: 'meta-desc-present',
    label: 'Meta description',
    value: metaDesc
      ? `"${metaDesc.slice(0, 60)}${metaDesc.length > 60 ? '...' : ''}"`
      : 'Missing',
    status: metaDesc ? 'pass' : 'fail',
    description: 'Meta descriptions improve click-through rates from search results.',
  });

  checks.push({
    id: 'meta-desc-length',
    label: 'Meta description length',
    value: metaDesc ? `${descLen} characters` : 'No description',
    status: !metaDesc ? 'fail' : descLen >= 120 && descLen <= 160 ? 'pass' : 'warning',
    description: 'Aim for 120-160 characters. Longer descriptions get truncated in search results.',
  });

  // --- H1 ---
  const h1s = $('h1');
  const h1Count = h1s.length;
  const h1Text = h1s.first().text().trim();

  checks.push({
    id: 'h1-present',
    label: 'H1 heading',
    value: h1Count > 0 ? `"${h1Text.slice(0, 50)}${h1Text.length > 50 ? '...' : ''}"` : 'Missing',
    status: h1Count > 0 ? 'pass' : 'fail',
    description: 'Every page should have one H1 heading that describes its content.',
  });

  checks.push({
    id: 'h1-count',
    label: 'Single H1',
    value:
      h1Count === 0 ? 'No H1 found' : h1Count === 1 ? '1 H1 tag' : `${h1Count} H1 tags found`,
    status: h1Count === 1 ? 'pass' : h1Count === 0 ? 'fail' : 'warning',
    description: 'Multiple H1 tags can confuse search engines. Aim for exactly one.',
  });

  // --- Canonical ---
  const canonical = $('link[rel="canonical"]').attr('href')?.trim();

  checks.push({
    id: 'canonical',
    label: 'Canonical tag',
    value: canonical ?? 'Missing',
    status: canonical ? 'pass' : 'warning',
    description: 'Canonical tags prevent duplicate content issues across similar pages.',
  });

  // --- Open Graph ---
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim();
  const ogBoth = !!(ogTitle && ogDesc);
  const ogEither = !!(ogTitle || ogDesc);

  checks.push({
    id: 'og-tags',
    label: 'Open Graph tags',
    value: ogBoth
      ? 'og:title + og:description present'
      : ogEither
        ? `Only ${ogTitle ? 'og:title' : 'og:description'} present`
        : 'Both missing',
    status: ogBoth ? 'pass' : ogEither ? 'warning' : 'fail',
    description:
      'Open Graph tags control how your page appears when shared on social media.',
  });

  // --- Structured data (JSON-LD) ---
  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;

  checks.push({
    id: 'structured-data',
    label: 'Structured data (JSON-LD)',
    value: hasJsonLd ? 'Found' : 'Not found',
    status: hasJsonLd ? 'pass' : 'warning',
    description:
      'Structured data helps search engines understand your content and can unlock rich results.',
  });

  // --- Robots noindex ---
  const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() ?? '';
  const isNoIndex = robotsMeta.includes('noindex');

  checks.push({
    id: 'robots-noindex',
    label: 'Robots noindex',
    value: isNoIndex ? 'Page is set to noindex' : 'Indexable',
    status: isNoIndex ? 'fail' : 'pass',
    description:
      'A noindex directive prevents search engines from indexing this page.',
  });

  // --- Twitter Card tags ---
  const twitterCard = $('meta[name="twitter:card"]').attr('content')?.trim();
  const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim();
  const twitterDesc = $('meta[name="twitter:description"]').attr('content')?.trim();
  const twitterComplete = !!(twitterCard && twitterTitle && twitterDesc);
  const twitterPartial = !!(twitterCard || twitterTitle || twitterDesc);

  checks.push({
    id: 'twitter-card',
    label: 'Twitter Card tags',
    value: twitterComplete
      ? 'twitter:card, title and description present'
      : twitterPartial
        ? 'Partially configured'
        : 'Not found',
    status: twitterComplete ? 'pass' : twitterPartial ? 'warning' : 'warning',
    description:
      'Twitter Card tags control how your page looks when shared on X / Twitter.',
  });

  // --- Favicon ---
  const hasFavicon =
    $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;

  checks.push({
    id: 'favicon',
    label: 'Favicon',
    value: hasFavicon ? 'Found' : 'Not found',
    status: hasFavicon ? 'pass' : 'warning',
    description:
      'A favicon appears in browser tabs and bookmarks, reinforcing brand recognition.',
  });

  // --- Image alt text coverage ---
  const allImages = $('img');
  const totalImages = allImages.length;
  const missingAlt = allImages.filter((_, el) => !$(el).attr('alt')).length;
  const altCoverage = totalImages === 0 ? null : Math.round(((totalImages - missingAlt) / totalImages) * 100);

  checks.push({
    id: 'image-alt-coverage',
    label: 'Image alt text coverage',
    value: totalImages === 0
      ? 'No images found'
      : `${altCoverage}% (${missingAlt} of ${totalImages} missing)`,
    status: totalImages === 0
      ? 'pass'
      : missingAlt === 0
        ? 'pass'
        : missingAlt <= 2
          ? 'warning'
          : 'fail',
    description:
      'Alt text on images is essential for SEO and screen reader accessibility.',
  });

  return { score: categoryScore(checks), checks };
}
