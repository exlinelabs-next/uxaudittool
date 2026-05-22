'use client';

import { useState, useCallback } from 'react';
import type { AuditCategories, CategoryKey, AuditStreamEvent } from '@/lib/audit/types';

export type AuditStatus = 'idle' | 'running' | 'complete' | 'error';

export interface AuditState {
  status: AuditStatus;
  url: string;
  categories: Partial<AuditCategories>;
  overallScore: number;
  shareUrl?: string;
  scannedAt?: string;
  error: string | null;
}

const INITIAL: AuditState = {
  status: 'idle',
  url: '',
  categories: {},
  overallScore: 0,
  error: null,
};

/**
 * Low-level SSE consumer. Calls `onCategory` for each category event,
 * `onDone` when finished, and `onError` on fatal errors.
 * Returns once the stream ends (or errors).
 */
async function streamAudit(
  apiUrl: string,
  body: Record<string, unknown>,
  onCategory: (key: CategoryKey, result: import('@/lib/audit/types').CategoryResult) => void,
  onDone: (event: import('@/lib/audit/types').AuditDoneEvent) => void,
  onError: (msg: string) => void,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    onError('Could not reach the audit server. Check your connection.');
    return;
  }

  if (!res.ok) {
    try {
      const data = await res.json();
      onError(data.error ?? 'Something went wrong.');
    } catch {
      onError('Something went wrong.');
    }
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError('Streaming not supported in this browser.');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6)) as AuditStreamEvent;
          if (event.type === 'category') onCategory(event.key, event.result);
          else if (event.type === 'done') onDone(event);
          else if (event.type === 'error') onError(event.error);
        } catch {
          // malformed event — skip
        }
      }
    }
  } catch {
    // Stream cut — state is handled by the caller
  }
}

export function useAudit(apiUrl = '/api/audit') {
  const [state, setState] = useState<AuditState>(INITIAL);

  /** Run a full audit across all 6 categories. */
  const runAudit = useCallback(
    async (url: string) => {
      setState({ status: 'running', url, categories: {}, overallScore: 0, error: null });

      await streamAudit(
        apiUrl,
        { url },
        (key, result) =>
          setState(s => ({ ...s, categories: { ...s.categories, [key]: result } })),
        event =>
          setState(s => ({
            ...s,
            status: 'complete',
            overallScore: event.overallScore,
            shareUrl: event.shareUrl,
            scannedAt: event.scannedAt,
          })),
        msg =>
          setState(s => ({
            ...s,
            // If we already have some results don't hard-error, just note it
            status: Object.keys(s.categories).length > 0 ? s.status : 'error',
            error: msg,
          })),
      );
    },
    [apiUrl],
  );

  /**
   * Re-run a single category without touching the rest.
   * The category is removed from state first so its skeleton shows while loading.
   */
  const retryCategory = useCallback(
    async (key: CategoryKey) => {
      const url = state.url;
      if (!url) return;

      // Clear just this category so the skeleton re-appears
      setState(s => {
        const cats = { ...s.categories };
        delete cats[key];
        return { ...s, categories: cats, error: null };
      });

      await streamAudit(
        apiUrl,
        { url, onlyCategory: key },
        (k, result) =>
          setState(s => ({ ...s, categories: { ...s.categories, [k]: result } })),
        // done from single-category retry carries overallScore: 0 — ignore it
        () => {},
        msg =>
          setState(s => ({ ...s, error: msg })),
      );
    },
    [apiUrl, state.url],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { state, runAudit, retryCategory, reset };
}
