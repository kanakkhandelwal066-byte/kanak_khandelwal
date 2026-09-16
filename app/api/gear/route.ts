import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createGearSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  model: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  depositAmount: z.number().min(0, 'Deposit cannot be negative'),
  dailyLateFee: z.number().min(0, 'Late fee cannot be negative'),
  maxBorrowDays: z.number().min(1).default(7),
  initialUnitsCount: z.number().min(1).default(1),
  unitTagPrefix: z.string().min(1).default('GEAR'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    const where: any = {};
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { model: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const gearItems = await prisma.gearItem.findMany({
      where,
      include: {
        category: true,
        units: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(gearItems);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch gear items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createGearSchema.parse(body);

    const gearItem = await prisma.$transaction(async (tx) => {
      const item = await tx.gearItem.create({
        data: {
          name: validated.name,
          categoryId: validated.categoryId,
          model: validated.model || null,
          description: validated.description || null,
          imageUrl: validated.imageUrl || null,
          depositAmount: validated.depositAmount,
          dailyLateFee: validated.dailyLateFee,
          maxBorrowDays: validated.maxBorrowDays,
        },
      });

      // Create initial units
      const unitsData = Array.from({ length: validated.initialUnitsCount }).map((_, index) => ({
        gearItemId: item.id,
        unitTag: `${validated.unitTagPrefix.toUpperCase()}-${String(index + 1).padStart(2, '0')}`,
        condition: 'EXCELLENT' as const,
        isAvailable: true,
      }));

      await tx.gearUnit.createMany({
        data: unitsData,
      });

      return item;
    });

    return NextResponse.json(gearItem, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create gear item' }, { status: 500 });
  }
}
