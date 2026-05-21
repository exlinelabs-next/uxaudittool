'use client';

import { useState, useCallback } from 'react';
import type { AuditPartialEvent, AuditCompleteEvent } from '@/lib/audit/types';

export type AuditStatus = 'idle' | 'loading' | 'partial' | 'complete' | 'error';

export interface AuditState {
  status: AuditStatus;
  url: string;
  partial: AuditPartialEvent['categories'] | null;
  result: AuditCompleteEvent | null;
  error: string | null;
  retryingSlowPhase?: boolean;
}

const INITIAL: AuditState = {
  status: 'idle',
  url: '',
  partial: null,
  result: null,
  error: null,
};

async function streamAudit(
  apiUrl: string,
  body: Record<string, unknown>,
  onPartial: (cats: AuditPartialEvent['categories']) => void,
  onComplete: (event: AuditCompleteEvent) => void,
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
          const event = JSON.parse(line.slice(6));
          if (event.type === 'partial') onPartial(event.categories);
          else if (event.type === 'complete') onComplete(event);
          else if (event.type === 'error') onError(event.error);
        } catch {
          // malformed event - skip
        }
      }
    }
  } catch {
    // Stream cut - caller handles residual state
  }
}

export function useAudit(apiUrl = '/api/audit') {
  const [state, setState] = useState<AuditState>(INITIAL);

  const runAudit = useCallback(
    async (url: string) => {
      setState({ status: 'loading', url, partial: null, result: null, error: null });

      await streamAudit(
        apiUrl,
        { url },
        cats  => setState(s => ({ ...s, status: 'partial', partial: cats })),
        event => setState(s => ({ ...s, status: 'complete', result: event, retryingSlowPhase: false })),
        msg   => setState(s => ({
          ...s,
          status: s.status === 'partial' || s.status === 'complete' ? s.status : 'error',
          error: s.status === 'partial' || s.status === 'complete' ? null : msg,
        })),
      );
    },
    [apiUrl]
  );

  /** Re-run only the slow phase (Performance, Mobile, Accessibility).
   *  Fast phase results (SEO, Trust, UX) are kept intact. */
  const retrySlowPhase = useCallback(
    async () => {
      const url = state.url;
      if (!url) return;

      // Keep fast results but clear slow ones and show skeletons
      setState(s => ({
        ...s,
        status: 'partial',
        result: null,
        error: null,
        retryingSlowPhase: true,
      }));

      await streamAudit(
        apiUrl,
        { url, onlySlowPhase: true },
        () => { /* no partial event from slow-only */ },
        event => setState(s => ({ ...s, status: 'complete', result: event, retryingSlowPhase: false })),
        msg   => setState(s => ({ ...s, error: msg, retryingSlowPhase: false })),
      );
    },
    [apiUrl, state.url]
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { state, runAudit, retrySlowPhase, reset };
}
