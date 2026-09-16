import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UnitCondition } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gearItemId, unitTag, serialNumber, condition, notes } = body;

    if (!gearItemId || !unitTag) {
      return NextResponse.json({ error: 'Gear item and Unit Tag are required' }, { status: 400 });
    }

    const unit = await prisma.gearUnit.create({
      data: {
        gearItemId,
        unitTag: unitTag.toUpperCase(),
        serialNumber: serialNumber || null,
        condition: (condition as UnitCondition) || 'GOOD',
        isAvailable: condition !== 'DAMAGED' && condition !== 'MISSING',
        notes: notes || null,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unit tag already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create unit' }, { status: 500 });
  }
}
