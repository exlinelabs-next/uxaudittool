'use client';

import { useState, useEffect, useRef } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface AvailableSlot {
  time: string; // ISO UTC string from Cal.com
}

interface BookingForm {
  name: string;
  email: string;
  timezone: string;
  notes: string;
}

interface Props {
  onClose: () => void;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── Component ──────────────────────────────────────────────────────────────── */

export function BookingModal({ onClose }: Props) {
  const today = new Date();

  /* Calendar nav */
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear]   = useState(today.getFullYear());

  /* Selected date */
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number }>({
    year: today.getFullYear(), month: today.getMonth(), day: today.getDate(),
  });

  /* Slots — only the available ones returned by Cal.com */
  const [slots, setSlots]           = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError]   = useState(false);
  const [timeFormat, setTimeFormat]   = useState<'12h' | '24h'>('12h');
  const [eventTypeId, setEventTypeId] = useState<number | null>(null);

  /* Booking form */
  const [showForm, setShowForm]                 = useState(false);
  const [selectedSlot, setSelectedSlot]         = useState<AvailableSlot | null>(null);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState('');
  const [form, setForm] = useState<BookingForm>({
    name: '', email: '', notes: '', timezone: 'UTC',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError]     = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  /* Timezone — set client-side only to avoid hydration mismatch */
  const [timezone, setTimezone] = useState('');
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    setForm(f => ({ ...f, timezone: tz }));
  }, []);

  /* Scroll lock + Escape (only close root modal if form isn't open) */
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (showForm) closeForm(); else onClose(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose, showForm]);

  /* Load today's slots on mount */
  useEffect(() => {
    fetchSlots(today.getFullYear(), today.getMonth() + 1, today.getDate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Slot fetching ───────────────────────────────────────────────────────── */

  async function fetchSlots(y: number, month1: number, day: number) {
    setLoadingSlots(true);
    setSlotsError(false);
    setSlots([]);
    const dateStr = `${y}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      const tz  = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
      const res  = await fetch(`/api/calcom/slots?date=${dateStr}&timeZone=${encodeURIComponent(tz)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEventTypeId(data.data.eventTypeId);
        setSlots(data.data.slots ?? []);
      } else {
        setSlotsError(true);
      }
    } catch {
      setSlotsError(true);
    } finally {
      setLoadingSlots(false);
    }
  }

  /* ── Calendar helpers ────────────────────────────────────────────────────── */

  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const blankDays      = Array.from({ length: firstDayOfWeek });
  const dayNumbers     = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function isPastDate(day: number) {
    const d = new Date(year, month, day); d.setHours(0, 0, 0, 0);
    const t = new Date();                 t.setHours(0, 0, 0, 0);
    return d < t;
  }
  function isToday(day: number) {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  }
  function isSelected(day: number) {
    return selectedDate.year === year && selectedDate.month === month && selectedDate.day === day;
  }

  function previousMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function handleDayClick(day: number) {
    if (isPastDate(day)) return;
    setSelectedDate({ year, month, day });
    fetchSlots(year, month + 1, day);
  }

  /* ── Time slot helpers ───────────────────────────────────────────────────── */

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: timeFormat === '12h',
    });
  }

  function selectSlot(slot: AvailableSlot) {
    const d = new Date(slot.time);
    setSelectedSlot(slot);
    setSelectedSlotLabel(
      `${d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
    );
    setBookingError(null);
    setBookingSuccess(false);
    setShowForm(true);
  }

  /* ── Booking submission ──────────────────────────────────────────────────── */

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !eventTypeId) { setBookingError('Invalid booking data. Please try again.'); return; }
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch('/api/calcom/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: selectedSlot.time, eventTypeId,
          attendee: { name: form.name, email: form.email, timeZone: form.timezone, language: 'en' },
          metadata: { notes: form.notes },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
        setTimeout(() => fetchSlots(selectedDate.year, selectedDate.month + 1, selectedDate.day), 1200);
      } else {
        setBookingError(data.message ?? 'Failed to create booking. Please try again.');
      }
    } catch {
      setBookingError('An error occurred. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  function closeForm() {
    setShowForm(false);
    setTimeout(() => {
      setForm(f => ({ ...f, name: '', email: '', notes: '' }));
      setBookingError(null); setBookingSuccess(false); setSelectedSlot(null);
    }, 300);
  }

  const selectedDateLabel = new Date(selectedDate.year, selectedDate.month, selectedDate.day)
    .toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  /* ─────────────────────────────── RENDER ────────────────────────────────── */

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      {/* Modal shell */}
      <div
        className="w-full bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ maxWidth: 'min(90dvw, 960px)', maxHeight: '85dvh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center px-6 py-5 flex-shrink-0" style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Schedule a call</p>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Body: three panels ────────────────────────────────────────── */}
        {/*
            Mobile  (< lg): flex-col → info on top, calendar middle, slots bottom
            Desktop (≥ lg): flex-row → three columns side by side
        */}
        <div className="overflow-auto lg:overflow-hidden flex-1">
          <div className="flex flex-col lg:flex-row h-full">

            {/* ── Panel 1: Event info ──────────────────────────────────── */}
            <div
              className="px-6 md:px-8 py-8 flex flex-col gap-2 flex-shrink-0 cal-panel-divider"
              style={{ minWidth: 200 }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 overflow-hidden bg-gray-200 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://cal.com/api/avatar/exlinelabs" alt="Exline Labs"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <h5 style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tharsh T</h5>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>Free UX Audit Session</p>
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                  </svg>
                  <span style={{ fontSize: 14, color: '#4b5563' }}>30 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span style={{ fontSize: 14, color: '#4b5563' }}>Cal Video</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                  </svg>
                  <span style={{ fontSize: 14, color: '#4b5563', wordBreak: 'break-word' }}>{timezone || '…'}</span>
                </div>
              </div>
            </div>

            {/* ── Panel 2: Calendar grid ───────────────────────────────── */}
            <div
              className="flex-shrink-0 bg-white cal-panel-divider cal-calendar-panel"
            >
              {/* Month nav */}
              <div className="flex items-center justify-between py-6 px-8" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{MONTH_NAMES[month]}</span>
                  <span style={{ marginLeft: 8, fontSize: 22, fontWeight: 700, color: '#9ca3af' }}>{year}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: '#f9fafb' }}>
                  <button type="button" onClick={previousMonth} className="rounded-lg transition-all inline-flex cursor-pointer hover:bg-white hover:shadow-sm p-2 items-center">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button type="button" onClick={nextMonth} className="rounded-lg transition-all inline-flex items-center cursor-pointer hover:bg-white hover:shadow-sm p-2">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Day-of-week headers — 7-column CSS grid (no % widths) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
                  {DAYS.map(d => (
                    <div key={d} className="py-3 text-center">
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</span>
                    </div>
                  ))}
                </div>

                {/* Day cells — same 7-column grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {blankDays.map((_, i) => (
                    <div key={`b${i}`}>
                      <div style={{ aspectRatio: '1/1', borderRadius: 12, background: '#f9fafb' }} />
                    </div>
                  ))}
                  {dayNumbers.map(day => {
                    const past = isPastDate(day);
                    const sel  = isSelected(day);
                    const tod  = isToday(day);
                    return (
                      <div key={day}>
                        <DayCell
                          day={day} past={past} selected={sel} isToday={tod}
                          onClick={() => handleDayClick(day)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Panel 3: Time slots ──────────────────────────────────── */}
            <div className="px-8 py-8 flex-1 min-w-0">
              {/* Header row */}
              <div className="flex justify-between items-center flex-wrap gap-2 mb-8">
                <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{selectedDateLabel}</span>
                {/* 12h / 24h toggle */}
                <div className="flex gap-1 rounded-lg p-1" style={{ background: '#d1d5db', flexShrink: 0 }}>
                  {(['12h', '24h'] as const).map(fmt => (
                    <div
                      key={fmt}
                      onClick={() => setTimeFormat(fmt)}
                      className="rounded-lg cursor-pointer transition-all select-none"
                      style={{ padding: '4px 10px', fontSize: 13, fontWeight: 500, background: timeFormat === fmt ? '#fff' : 'transparent' }}
                    >
                      {fmt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Slot list */}
              <div className="flex flex-col gap-3" style={{ maxHeight: '50dvh', overflowY: 'auto', paddingRight: 4 }}>
                {loadingSlots ? (
                  <div className="flex items-center justify-center rounded-lg py-3 animate-pulse" style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <span style={{ fontSize: 14, color: '#9ca3af' }}>Loading slots…</span>
                  </div>
                ) : slotsError ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center" style={{ color: '#9ca3af' }}>
                    <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p style={{ fontSize: 13 }}>Could not load available times.<br/>Please try again.</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center" style={{ color: '#9ca3af' }}>
                    <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p style={{ fontSize: 13 }}>No available times for this date.<br/>Please try another day.</p>
                  </div>
                ) : (
                  slots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSlot(slot)}
                      className="flex items-center justify-center rounded-lg transition-all w-full"
                      style={{
                        minHeight: 40, padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        background: '#ffffff', color: '#374151',
                        fontSize: 14, cursor: 'pointer',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f3ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#c4b5fd'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; }}
                    >
                      {formatTime(slot.time)}
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Booking form sub-modal ──────────────────────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 110, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="p-4 max-w-lg mx-auto w-full">
            <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div className="flex items-start justify-between px-8 py-6" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Book Your Meeting</h2>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{selectedSlotLabel}</p>
                </div>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="px-8 py-6">
                {bookingSuccess ? (
                  <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
                    <div className="mx-auto flex items-center justify-center rounded-full mb-4" style={{ width: 64, height: 64, background: '#dcfce7' }}>
                      <svg className="w-10 h-10" style={{ color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Booking Confirmed!</h3>
                    <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>{"You'll receive a confirmation email shortly."}</p>
                    <button onClick={closeForm} className="w-full text-white font-medium py-3 px-6 rounded-xl transition-all" style={{ background: 'linear-gradient(to right, #9333ea, #4f46e5)' }}>
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitBooking}>
                    <Field label="Your Name *">
                      <input className="cal-input" type="text" required placeholder="Enter your name here…" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={bookingLoading} />
                    </Field>
                    <Field label="Email Address *">
                      <input className="cal-input" type="email" required placeholder="Enter your email…" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={bookingLoading} />
                    </Field>
                    <Field label="Timezone">
                      <input className="cal-input" type="text" readOnly value={form.timezone} style={{ background: '#f9fafb', cursor: 'not-allowed' }} />
                    </Field>
                    <Field label="Additional Notes (Optional)" last>
                      <textarea className="cal-input" rows={3} placeholder="Tell us what you'd like to discuss…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} disabled={bookingLoading} style={{ resize: 'none' }} />
                    </Field>

                    {bookingError && (
                      <div className="mb-4 p-4 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <p style={{ fontSize: 13, color: '#dc2626' }}>{bookingError}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button type="button" onClick={closeForm} disabled={bookingLoading} className="flex-1 font-medium py-3 px-4 rounded-xl transition-all" style={{ background: '#f3f4f6', color: '#374151' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={bookingLoading} className="flex-1 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(to right, #9333ea, #4f46e5)' }}>
                        {bookingLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Booking…
                          </span>
                        ) : 'Confirm Booking'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared form input styles */}
      <style>{`
        .cal-input {
          width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb;
          border-radius: 12px; background: #fff; color: #374151; font-size: 14px;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit; display: block;
        }
        .cal-input:focus {
          outline: none; border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.15);
        }
        .cal-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .cal-panel-divider {
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        @media (min-width: 1024px) {
          .cal-panel-divider {
            border-bottom: none;
            border-right: 1px solid rgba(0,0,0,0.1);
          }
        }
        /* Calendar panel: full-width on mobile, fixed 320px on desktop */
        .cal-calendar-panel {
          width: 100%;
        }
        @media (min-width: 1024px) {
          .cal-calendar-panel {
            width: 320px;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Small sub-components ───────────────────────────────────────────────────── */

function DayCell({ day, past, selected, isToday, onClick }: {
  day: number; past: boolean; selected: boolean; isToday: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => !past && !selected && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: '1/1', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: isToday && !selected ? '2px solid #7A42FE' : '1px solid',
        borderColor: past ? '#f3f4f6' : selected ? 'transparent' : isToday ? '#7A42FE' : hovered ? '#e5e7eb' : '#f3f4f6',
        background: selected ? '#7A42FE' : hovered && !past ? '#f3f4f6' : past ? '#f9fafb' : 'transparent',
        cursor: past ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <span style={{
        width: 32, height: 32,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', fontSize: 13, fontWeight: 500,
        color: past ? '#d1d5db' : selected ? '#fff' : isToday ? '#7A42FE' : '#374151',
      }}>
        {day}
      </span>
    </div>
  );
}

function Field({ label, last = false, children }: { label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col items-start${last ? ' mb-6' : ' mb-5'}`}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}
