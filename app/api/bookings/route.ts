import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createBookingRequest } from '@/lib/services/booking.service';
import { z } from 'zod';

const bookingSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  gearItemId: z.string().min(1, 'Gear item ID is required'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
  startDate: z.string().datetime().or(z.string().min(1)),
  endDate: z.string().datetime().or(z.string().min(1)),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    const where: any = {};
    if (userId && role !== 'ADMIN') {
      where.userId = userId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: true,
        gearItem: {
          include: { category: true },
        },
        gearUnit: true,
        returnRecord: {
          include: { staffUser: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = bookingSchema.parse(body);

    const booking = await createBookingRequest({
      userId: validated.userId,
      gearItemId: validated.gearItemId,
      purpose: validated.purpose,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      notes: validated.notes,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 400 });
  }
}
