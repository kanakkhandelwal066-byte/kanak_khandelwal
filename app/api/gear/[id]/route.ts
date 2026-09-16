import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gearItem = await prisma.gearItem.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        units: {
          include: {
            bookings: {
              where: {
                status: { in: ['APPROVED', 'ISSUED'] },
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!gearItem) {
      return NextResponse.json({ error: 'Gear item not found' }, { status: 404 });
    }

    return NextResponse.json(gearItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch gear item' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const gearItem = await prisma.gearItem.update({
      where: { id: params.id },
      data: {
        name: body.name,
        categoryId: body.categoryId,
        model: body.model,
        description: body.description,
        imageUrl: body.imageUrl,
        depositAmount: parseFloat(body.depositAmount),
        dailyLateFee: parseFloat(body.dailyLateFee),
        maxBorrowDays: parseInt(body.maxBorrowDays, 10),
      },
    });

    return NextResponse.json(gearItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update gear item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.gearItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Gear item deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete gear item' }, { status: 500 });
  }
}
