import { NextRequest, NextResponse } from 'next/server';
import { checkGearAvailability } from '@/lib/services/availability.service';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gearItemId = searchParams.get('gearItemId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!gearItemId || !startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'gearItemId, startDate, and endDate query parameters are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date parameters' }, { status: 400 });
    }

    const result = await checkGearAvailability(gearItemId, startDate, endDate);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Availability check failed' }, { status: 500 });
  }
}
