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
}

const INITIAL: AuditState = {
  status: 'idle',
  url: '',
  partial: null,
  result: null,
  error: null,
};

export function useAudit(apiUrl = '/api/audit') {
  const [state, setState] = useState<AuditState>(INITIAL);

  const runAudit = useCallback(
    async (url: string) => {
      setState({ status: 'loading', url, partial: null, result: null, error: null });

      let res: Response;
      try {
        res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      } catch {
        setState(s => ({ ...s, status: 'error', error: 'Could not reach the audit server. Check your connection.' }));
        return;
      }

      // Pre-stream errors (400 / 422 / 429) are plain JSON
      if (!res.ok) {
        try {
          const data = await res.json();
          setState(s => ({ ...s, status: 'error', error: data.error ?? 'Something went wrong.' }));
        } catch {
          setState(s => ({ ...s, status: 'error', error: 'Something went wrong.' }));
        }
        return;
      }

      // Stream SSE events
      const reader = res.body?.getReader();
      if (!reader) {
        setState(s => ({ ...s, status: 'error', error: 'Streaming not supported in this browser.' }));
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
              if (event.type === 'partial') {
                setState(s => ({ ...s, status: 'partial', partial: event.categories }));
              } else if (event.type === 'complete') {
                setState(s => ({ ...s, status: 'complete', result: event }));
              } else if (event.type === 'error') {
                setState(s => ({ ...s, status: 'error', error: event.error }));
              }
            } catch {
              // malformed event - skip
            }
          }
        }
      } catch {
        setState(s => ({
          ...s,
          status: s.status === 'partial' || s.status === 'complete' ? s.status : 'error',
          error: s.status === 'partial' || s.status === 'complete' ? null : 'Stream interrupted.',
        }));
      }
    },
    [apiUrl]
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { state, runAudit, reset };
}
