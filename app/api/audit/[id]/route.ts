import { NextRequest, NextResponse } from 'next/server';
import { getAuditResult } from '@/lib/audit/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string' || !/^[a-f0-9]{10}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid report ID.' }, { status: 400 });
  }

  const result = await getAuditResult(id);

  if (!result) {
    return NextResponse.json(
      { error: 'Report not found. It may have expired or the link is incorrect.' },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
