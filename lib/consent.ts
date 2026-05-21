'use client';

import { useState, useEffect } from 'react';

export type ConsentState = 'pending' | 'accepted' | 'declined';

const KEY = 'wb-cookie-consent';

export function getStoredConsent(): ConsentState {
  if (typeof window === 'undefined') return 'pending';
  const v = localStorage.getItem(KEY);
  if (v === 'accepted' || v === 'declined') return v;
  return 'pending';
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState>('pending');

  useEffect(() => {
    setConsent(getStoredConsent());
  }, []);

  function accept() {
    localStorage.setItem(KEY, 'accepted');
    setConsent('accepted');
  }

  function decline() {
    localStorage.setItem(KEY, 'declined');
    setConsent('declined');
  }

  function reset() {
    localStorage.removeItem(KEY);
    setConsent('pending');
  }

  return { consent, accept, decline, reset };
}
