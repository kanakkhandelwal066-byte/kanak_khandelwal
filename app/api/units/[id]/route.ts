import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UnitCondition } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { unitTag, serialNumber, condition, isAvailable, notes } = body;

    const updated = await prisma.gearUnit.update({
      where: { id: params.id },
      data: {
        unitTag: unitTag ? unitTag.toUpperCase() : undefined,
        serialNumber: serialNumber !== undefined ? serialNumber : undefined,
        condition: condition as UnitCondition,
        isAvailable: isAvailable !== undefined ? isAvailable : (condition !== 'DAMAGED' && condition !== 'MISSING'),
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update unit' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.gearUnit.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Unit deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete unit' }, { status: 500 });
  }
}
