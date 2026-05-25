import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api.cal.com/v2';
const USERNAME = process.env.CALCOM_USERNAME ?? 'exlinelabs';
const EVENT_TYPE_SLUG = process.env.CALCOM_EVENT_TYPE_SLUG ?? 'free-ux-audit-session';

// Module-level cache — avoids re-fetching event type ID on every request
let cachedEventTypeId: number | null = null;

async function resolveEventTypeId(apiKey: string): Promise<number | null> {
  if (cachedEventTypeId) return cachedEventTypeId;

  const res = await fetch(`${BASE_URL}/event-types?username=${USERNAME}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': '2024-06-14',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const eventTypes: Array<{ slug: string; id: number }> = data.data ?? [];
  const match = eventTypes.find(et => et.slug === EVENT_TYPE_SLUG);

  if (match?.id) {
    cachedEventTypeId = match.id;
    return match.id;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.CALCOM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: 'Cal.com API key not configured' },
      { status: 503 },
    );
  }

  const date = req.nextUrl.searchParams.get('date'); // YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { success: false, message: 'date parameter required (YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  try {
    const eventTypeId = await resolveEventTypeId(apiKey);
    if (!eventTypeId) {
      return NextResponse.json(
        { success: false, message: 'Event type not found' },
        { status: 404 },
      );
    }

    // Match exlinelabs.com exactly: no timeZone param, plain UTC window for the date
    const url = `${BASE_URL}/slots/available?eventTypeId=${eventTypeId}&startTime=${date}T00:00:00Z&endTime=${date}T23:59:59Z`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': '2024-06-14',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[calcom/slots] Cal.com error:', res.status, errorText);
      return NextResponse.json(
        { success: false, message: `Cal.com returned ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    const slotsData: Record<string, Array<{ time: string }>> = data.data?.slots ?? {};

    // Cal.com keys slots by the date in the response.
    // Try the requested date first; fall back to first available key in case
    // the API shifts the key by timezone.
    const slotsForDate =
      slotsData[date] ??
      Object.values(slotsData).find(arr => arr.length > 0) ??
      [];

    // Also flatten all slots across all keys in case Cal.com splits across midnight
    const allSlots: Array<{ time: string }> = Object.values(slotsData).flat();

    console.log(`[calcom/slots] date=${date} keys=${Object.keys(slotsData).join(',')} count=${slotsForDate.length} total=${allSlots.length}`);

    return NextResponse.json({
      success: true,
      data: { date, slots: slotsForDate.length > 0 ? slotsForDate : allSlots, eventTypeId },
    });
  } catch (err) {
    console.error('[calcom/slots] error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
