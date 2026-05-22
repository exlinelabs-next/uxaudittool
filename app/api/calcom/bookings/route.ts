import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api.cal.com/v2';

export async function POST(req: NextRequest) {
  const apiKey = process.env.CALCOM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: 'Cal.com API key not configured' },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const { start, eventTypeId, attendee, metadata } = body as {
      start: string;
      eventTypeId: number;
      attendee: { name: string; email: string; timeZone?: string; language?: string };
      metadata?: { notes?: string };
    };

    if (!start || !eventTypeId || !attendee?.name || !attendee?.email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: start, eventTypeId, attendee.name, attendee.email' },
        { status: 400 },
      );
    }

    const responses: Record<string, unknown> = {
      name: attendee.name,
      email: attendee.email,
      guests: [],
    };
    if (metadata?.notes) responses['notes'] = metadata.notes;

    const payload = {
      eventTypeId,
      start,
      responses,
      timeZone: attendee.timeZone ?? 'UTC',
      language: attendee.language ?? 'en',
      metadata: {},
    };

    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-06-14',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.status === 'success') {
      return NextResponse.json({ success: true, data: data.data });
    }

    return NextResponse.json(
      { success: false, message: data.message ?? 'Booking failed' },
      { status: res.status || 500 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
