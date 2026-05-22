'use client';

import { useState, useEffect, useRef } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface TimeSlot {
  time: string;      // ISO string
  available: boolean;
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

/* ─── Constants ────────────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── Helper: generate full 9 AM–10 PM slot grid for a date ────────────────── */

function generateSlotGrid(dateStr: string): TimeSlot[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour <= 22; hour++) {
    for (const min of [0, 30]) {
      if (hour === 22 && min === 30) break;
      slots.push({ time: new Date(y, m - 1, d, hour, min).toISOString(), available: false });
    }
  }
  return slots;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

export function BookingModal({ onClose }: Props) {
  /* Calendar nav */
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear]   = useState(today.getFullYear());

  /* Selection */
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number }>({
    year: today.getFullYear(), month: today.getMonth(), day: today.getDate(),
  });

  /* Slots */
  const [slots, setSlots]       = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timeFormat, setTimeFormat]     = useState<'12h' | '24h'>('12h');
  const [eventTypeId, setEventTypeId]   = useState<number | null>(null);

  /* Booking form */
  const [showForm, setShowForm]                 = useState(false);
  const [selectedSlot, setSelectedSlot]         = useState<TimeSlot | null>(null);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState('');
  const [form, setForm] = useState<BookingForm>({
    name: '', email: '', notes: '',
    timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError]     = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  /* Timezone (client-only to avoid SSR mismatch) */
  const [timezone, setTimezone] = useState('');
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setForm(f => ({ ...f, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  }, []);

  /* Scroll lock + Escape */
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showForm) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose, showForm]);

  /* Load today's slots on mount */
  useEffect(() => {
    fetchSlots(today.getFullYear(), today.getMonth() + 1, today.getDate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Slot fetching ──────────────────────────────────────────────────────── */

  async function fetchSlots(y: number, month1: number, day: number) {
    setLoadingSlots(true);
    setSlots([]);
    const dateStr = `${y}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      const res  = await fetch(`/api/calcom/slots?date=${dateStr}`);
      const data = await res.json();

      const grid = generateSlotGrid(dateStr);

      if (data.success && data.data) {
        setEventTypeId(data.data.eventTypeId);
        const available: Array<{ time: string }> = data.data.slots ?? [];
        const availableTimes = new Set(available.map(a => new Date(a.time).getTime()));
        setSlots(grid.map(s => ({ ...s, available: availableTimes.has(new Date(s.time).getTime()) })));
      } else {
        setSlots(grid);
      }
    } catch {
      setSlots(generateSlotGrid(dateStr));
    } finally {
      setLoadingSlots(false);
    }
  }

  /* ── Calendar helpers ───────────────────────────────────────────────────── */

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const blankDays    = Array.from({ length: firstDayOfWeek });
  const dayNumbers   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function isPastDate(day: number) {
    const d = new Date(year, month, day); d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
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
    const newSel = { year, month, day };
    setSelectedDate(newSel);
    fetchSlots(year, month + 1, day);
  }

  /* ── Time slot helpers ──────────────────────────────────────────────────── */

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
      hour12: timeFormat === '12h',
    });
  }

  function selectSlot(slot: TimeSlot) {
    if (!slot.available) return;
    const d = new Date(slot.time);
    setSelectedSlot(slot);
    setSelectedSlotLabel(
      `${d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
    );
    setBookingError(null);
    setBookingSuccess(false);
    setShowForm(true);
  }

  /* ── Booking submission ─────────────────────────────────────────────────── */

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
          start: selectedSlot.time,
          eventTypeId,
          attendee: { name: form.name, email: form.email, timeZone: form.timezone, language: 'en' },
          metadata: { notes: form.notes },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
        // Refresh slots after booking
        setTimeout(() => fetchSlots(selectedDate.year, selectedDate.month + 1, selectedDate.day), 1000);
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
      setBookingError(null);
      setBookingSuccess(false);
      setSelectedSlot(null);
    }, 300);
  }

  /* ── Formatted header for selected date ────────────────────────────────── */
  const selectedDateLabel = new Date(selectedDate.year, selectedDate.month, selectedDate.day)
    .toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  /* ─────────────────────────── RENDER ───────────────────────────────────── */

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      {/* Modal shell */}
      <div
        className="w-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxWidth: 'min(90dvw, 960px)', maxHeight: '85dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center px-6 py-5 flex-shrink-0" style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Schedule a call</p>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Calendar content (scrollable) ──────────────────────────────── */}
        <div className="overflow-auto lg:overflow-hidden flex-1">
          <div className="bg-white text-gray-700 overflow-hidden">
            <div className="flex flex-col-reverse sm:flex-col lg:flex-row">

              {/* ── Left: event info panel ─────────────────────────────── */}
              <div
                className="px-4 md:px-8 py-8 flex flex-col gap-2 text-start"
                style={{ borderTop: '2px solid rgba(0,0,0,0.1)', minWidth: 200 }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-1 overflow-hidden"
                  style={{ background: '#e5e7eb' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://cal.com/api/avatar/exlinelabs"
                    alt="Exline Labs"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <h5 style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tharsh T</h5>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>Free UX Audit Session</p>

                <div className="flex flex-col gap-3 mt-4">
                  {/* Duration */}
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                    </svg>
                    <span style={{ fontSize: 14, color: '#4b5563' }}>30 min</span>
                  </div>
                  {/* Video */}
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    <span style={{ fontSize: 14, color: '#4b5563' }}>Cal Video</span>
                  </div>
                  {/* Timezone */}
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                    </svg>
                    <span style={{ fontSize: 14, color: '#4b5563', wordBreak: 'break-word' }}>{timezone || '…'}</span>
                  </div>
                </div>
              </div>

              {/* ── Middle: Calendar grid ──────────────────────────────── */}
              <div
                className="flex-shrink-0 bg-white"
                style={{ borderRight: '2px solid rgba(0,0,0,0.1)', minWidth: '40%', maxWidth: '60%' }}
              >
                {/* Month nav */}
                <div className="flex items-center justify-between py-6 px-8" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{MONTH_NAMES[month]}</span>
                    <span style={{ marginLeft: 8, fontSize: 22, fontWeight: 700, color: '#9ca3af' }}>{year}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: '#f9fafb' }}>
                    <button type="button" onClick={previousMonth} className="rounded-lg transition-all duration-150 inline-flex cursor-pointer hover:bg-white hover:shadow-sm p-2 items-center">
                      <svg className="h-5 w-5" style={{ color: '#4b5563' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <button type="button" onClick={nextMonth} className="rounded-lg transition-all duration-150 inline-flex items-center cursor-pointer hover:bg-white hover:shadow-sm p-2">
                      <svg className="h-5 w-5" style={{ color: '#4b5563' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Day-of-week headers */}
                  <div className="flex flex-wrap mb-2">
                    {DAYS.map(d => (
                      <div key={d} style={{ width: '14.285%' }} className="px-2 py-3">
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>{d}</div>
                      </div>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="flex flex-wrap -mx-1">
                    {blankDays.map((_, i) => (
                      <div key={`b${i}`} style={{ width: '14.285%' }} className="px-1 mb-2">
                        <div style={{ aspectRatio: '1/1', borderRadius: 12, background: '#f9fafb' }} />
                      </div>
                    ))}
                    {dayNumbers.map(day => {
                      const past = isPastDate(day);
                      const sel  = isSelected(day);
                      const tod  = isToday(day);
                      return (
                        <div key={day} style={{ width: '14.285%' }} className="px-1 mb-2">
                          <div
                            style={{
                              aspectRatio: '1/1',
                              borderRadius: 12,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: tod && !sel ? '2px solid #7A42FE' : '1px solid',
                              borderColor: past ? '#f3f4f6' : sel ? 'transparent' : tod ? '#7A42FE' : '#f3f4f6',
                              background: past ? '#f9fafb' : sel ? '#7A42FE' : 'transparent',
                              cursor: past ? 'not-allowed' : 'pointer',
                              transition: 'background-color 0.15s ease',
                            }}
                            onClick={() => handleDayClick(day)}
                            onMouseEnter={e => { if (!past && !sel) (e.currentTarget as HTMLDivElement).style.background = '#f3f4f6'; }}
                            onMouseLeave={e => { if (!past && !sel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                          >
                            <span style={{
                              width: 32, height: 32,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '50%',
                              fontSize: 14, fontWeight: 500,
                              color: past ? '#d1d5db' : sel ? '#fff' : tod ? '#7A42FE' : '#374151',
                            }}>
                              {day}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Right: Time slots ──────────────────────────────────── */}
              <div className="px-8 py-8 w-full">
                {/* Slot header */}
                <div className="flex justify-between items-center w-full flex-wrap gap-2 mb-8">
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{selectedDateLabel}</div>
                  {/* 12h / 24h toggle */}
                  <div className="flex gap-1 rounded-lg p-1" style={{ background: '#d1d5db' }}>
                    {(['12h', '24h'] as const).map(fmt => (
                      <div
                        key={fmt}
                        className="rounded-lg cursor-pointer transition-all"
                        style={{
                          padding: '4px 8px',
                          fontSize: 14,
                          background: timeFormat === fmt ? '#fff' : 'transparent',
                        }}
                        onClick={() => setTimeFormat(fmt)}
                      >
                        {fmt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slot list */}
                <div
                  className="flex flex-col gap-3"
                  style={{ maxHeight: '48dvh', overflowY: 'auto', paddingRight: '8px' }}
                >
                  {loadingSlots ? (
                    <div className="flex items-center justify-center rounded-lg py-3 animate-pulse" style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <span style={{ fontSize: 14, color: '#9ca3af' }}>Loading slots...</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8" style={{ color: '#9ca3af' }}>
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p style={{ fontSize: 14 }}>Select a date to see available times</p>
                    </div>
                  ) : (
                    slots.map((slot, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center rounded-lg transition-all"
                        style={{
                          minHeight: 40,
                          border: `1px solid ${slot.available ? '#d1d5db' : '#e5e7eb'}`,
                          background: slot.available ? 'transparent' : '#f9fafb',
                          color: slot.available ? '#374151' : '#9ca3af',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          fontSize: 14,
                        }}
                        onClick={() => selectSlot(slot)}
                        onMouseEnter={e => { if (slot.available) { (e.currentTarget as HTMLDivElement).style.background = '#f5f3ff'; (e.currentTarget as HTMLDivElement).style.borderColor = '#c4b5fd'; } }}
                        onMouseLeave={e => { if (slot.available) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db'; } }}
                      >
                        {formatTime(slot.time)}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Booking form sub-modal ─────────────────────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 110, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="p-4 max-w-lg mx-auto relative w-full">
            <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>

              {/* Form header */}
              <div className="flex items-start justify-between px-8 py-6" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Book Your Meeting</h2>
                  <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{selectedSlotLabel}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100" onClick={closeForm}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="px-8 py-6">
                {bookingSuccess ? (
                  /* Success state */
                  <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
                    <div className="mx-auto flex items-center justify-center rounded-full mb-4" style={{ width: 64, height: 64, background: '#dcfce7' }}>
                      <svg className="w-10 h-10" style={{ color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Booking Confirmed!</h3>
                    <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24 }}>{"You'll receive a confirmation email shortly."}</p>
                    <button
                      onClick={closeForm}
                      className="w-full text-white font-medium py-3 px-6 rounded-xl transition-all"
                      style={{ background: 'linear-gradient(to right, #9333ea, #4f46e5)' }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  /* Booking form */
                  <form onSubmit={submitBooking}>
                    {/* Name */}
                    <div className="mb-5 flex flex-col items-start">
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Your Name *</label>
                      <input
                        type="text" required placeholder="Enter your name here..."
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        disabled={bookingLoading}
                        className="w-full rounded-xl transition-all focus:outline-none focus:ring-2"
                        style={{ padding: '12px 16px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14 }}
                      />
                    </div>

                    {/* Email */}
                    <div className="mb-5 flex flex-col items-start">
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Email Address *</label>
                      <input
                        type="email" required placeholder="Enter your email..."
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        disabled={bookingLoading}
                        className="w-full rounded-xl transition-all focus:outline-none focus:ring-2"
                        style={{ padding: '12px 16px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14 }}
                      />
                    </div>

                    {/* Timezone (auto-detected, read-only) */}
                    <div className="mb-5 flex flex-col items-start">
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Timezone</label>
                      <input
                        type="text" readOnly value={form.timezone}
                        className="w-full rounded-xl cursor-not-allowed"
                        style={{ padding: '12px 16px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 14 }}
                      />
                    </div>

                    {/* Notes */}
                    <div className="mb-6 flex flex-col items-start">
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Additional Notes (Optional)</label>
                      <textarea
                        rows={3} placeholder="Tell us what you'd like to discuss..."
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        disabled={bookingLoading}
                        className="w-full rounded-xl transition-all focus:outline-none focus:ring-2 resize-none"
                        style={{ padding: '12px 16px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14 }}
                      />
                    </div>

                    {/* Error */}
                    {bookingError && (
                      <div className="mb-4 p-4 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <p style={{ fontSize: 14, color: '#dc2626' }}>{bookingError}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeForm}
                        disabled={bookingLoading}
                        className="flex-1 font-medium py-3 px-4 rounded-xl transition-all"
                        style={{ background: '#f3f4f6', color: '#374151' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="flex-1 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(to right, #9333ea, #4f46e5)' }}
                      >
                        {bookingLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Booking...
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
    </div>
  );
}
