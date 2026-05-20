import { load, type CheerioAPI } from 'cheerio';

export interface FetchedHtml {
  $: CheerioAPI;
  raw: string;
}

export async function fetchHtml(url: string, signal?: AbortSignal): Promise<FetchedHtml> {
  const res = await fetch(url, {
    signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; WebAuditBot/1.0; +https://webbeet.studio)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) throw new Error(`HTML fetch responded with ${res.status}`);

  const raw = await res.text();
  const $ = load(raw);
  return { $, raw };
}
