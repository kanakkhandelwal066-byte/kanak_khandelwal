import { NextRequest, NextResponse } from 'next/server';
import { transferActiveLoan } from '@/lib/services/transfer.service';
import { z } from 'zod';

const transferSchema = z.object({
  toUserId: z.string().min(1, 'Target borrower ID is required'),
  staffUserId: z.string().min(1, 'Staff User ID is required'),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validated = transferSchema.parse(body);

    const result = await transferActiveLoan({
      bookingId: params.id,
      toUserId: validated.toUserId,
      staffUserId: validated.staffUserId,
      reason: validated.reason,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Loan transfer failed' }, { status: 400 });
  }
}
