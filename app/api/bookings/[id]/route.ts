import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { approveBooking, issueBooking, updateBookingStatus } from '@/lib/services/booking.service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        gearItem: true,
        gearUnit: true,
        returnRecord: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action, staffUserId, gearUnitId, reason } = body;

    let result;
    if (action === 'APPROVE') {
      result = await approveBooking({
        bookingId: params.id,
        staffUserId: staffUserId || 'admin-user-id',
        gearUnitId,
      });
    } else if (action === 'ISSUE') {
      result = await issueBooking(params.id, staffUserId || 'admin-user-id');
    } else if (action === 'REJECT') {
      result = await updateBookingStatus(params.id, 'REJECTED', reason);
    } else if (action === 'CANCEL') {
      result = await updateBookingStatus(params.id, 'CANCELLED', reason);
    } else {
      return NextResponse.json({ error: `Invalid action '${action}'` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update booking status' }, { status: 400 });
  }
}
