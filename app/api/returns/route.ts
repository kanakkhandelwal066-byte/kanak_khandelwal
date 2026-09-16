import { NextRequest, NextResponse } from 'next/server';
import { processBookingReturn } from '@/lib/services/return.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, staffUserId, actualReturnDate, conditionOnReturn, notes } = body;

    if (!bookingId || !staffUserId) {
      return NextResponse.json({ error: 'bookingId and staffUserId are required' }, { status: 400 });
    }

    const result = await processBookingReturn({
      bookingId,
      staffUserId,
      actualReturnDate: actualReturnDate ? new Date(actualReturnDate) : undefined,
      conditionOnReturn: conditionOnReturn || 'GOOD',
      notes,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process return' }, { status: 400 });
  }
}
