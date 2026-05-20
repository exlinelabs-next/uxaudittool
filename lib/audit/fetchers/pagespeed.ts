const PAGESPEED_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export interface LighthouseAudit {
  score: number | null;
  displayValue?: string;
  numericValue?: number;
  details?: { items?: unknown[] };
}

export interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number };
    };
    audits: Record<string, LighthouseAudit>;
  };
}

export async function fetchPageSpeedData(
  url: string,
  signal?: AbortSignal
): Promise<PageSpeedResponse> {
  const key = process.env.PAGESPEED_API_KEY;
  const endpoint = `${PAGESPEED_URL}?url=${encodeURIComponent(url)}&strategy=mobile&key=${key}`;
  const res = await fetch(endpoint, { signal });
  if (!res.ok) throw new Error(`PageSpeed API responded with ${res.status}`);
  return res.json();
}
