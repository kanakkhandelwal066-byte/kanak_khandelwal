import { prisma } from '../db';
import { LateFeeCalculation, UnitCondition } from '../types';

/**
 * Calculates late fee and refundable deposit based on due date and actual return date.
 */
export function calculateReturnFees(
  endDate: Date,
  actualReturnDate: Date,
  dailyLateFee: number,
  depositAmount: number
): LateFeeCalculation {
  const end = new Date(endDate).getTime();
  const actual = new Date(actualReturnDate).getTime();

  let daysOverdue = 0;
  if (actual > end) {
    const diffMs = actual - end;
    // Round up to nearest day for partial overdue days
    daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const lateFeeCharged = Number((daysOverdue * dailyLateFee).toFixed(2));
  // Refundable deposit = max(0, depositAmount - lateFeeCharged)
  const depositRefunded = Number(Math.max(0, depositAmount - lateFeeCharged).toFixed(2));

  return {
    daysOverdue,
    dailyFee: dailyLateFee,
    lateFeeCharged,
    depositAmount,
    depositRefunded,
    isOverdue: daysOverdue > 0,
  };
}

/**
 * Process a return for an issued booking.
 */
export async function processBookingReturn(params: {
  bookingId: string;
  staffUserId: string;
  actualReturnDate?: Date;
  conditionOnReturn: UnitCondition;
  notes?: string;
}) {
  const { bookingId, staffUserId, conditionOnReturn, notes } = params;
  const actualReturnDate = params.actualReturnDate || new Date();

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        gearItem: true,
        gearUnit: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'ISSUED' && booking.status !== 'APPROVED') {
      throw new Error(`Cannot process return for booking in '${booking.status}' status`);
    }

    const feeInfo = calculateReturnFees(
      booking.endDate,
      actualReturnDate,
      booking.gearItem.dailyLateFee,
      booking.gearItem.depositAmount
    );

    // Update physical unit condition & availability
    if (booking.gearUnitId) {
      const isOperational = conditionOnReturn === 'GOOD' || conditionOnReturn === 'EXCELLENT';
      await tx.gearUnit.update({
        where: { id: booking.gearUnitId },
        data: {
          condition: conditionOnReturn,
          isAvailable: isOperational,
        },
      });
    }

    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'RETURNED',
        actualReturn: actualReturnDate,
      },
    });

    // Create Return Record
    const returnRecord = await tx.returnRecord.create({
      data: {
        bookingId,
        staffUserId,
        actualReturnDate,
        conditionOnReturn,
        daysOverdue: feeInfo.daysOverdue,
        lateFeeCharged: feeInfo.lateFeeCharged,
        depositRefunded: feeInfo.depositRefunded,
        notes: notes || null,
      },
    });

    // Create notification for borrower
    await tx.notification.create({
      data: {
        userId: booking.userId,
        title: 'Gear Returned Successfully',
        message: `Your return of ${booking.gearItem.name} has been processed. Condition: ${conditionOnReturn}. Deposit refunded: $${feeInfo.depositRefunded.toFixed(2)}${feeInfo.lateFeeCharged > 0 ? ` (Late fee: $${feeInfo.lateFeeCharged.toFixed(2)})` : ''}`,
        type: feeInfo.isOverdue ? 'OVERDUE' : 'STATUS_CHANGE',
      },
    });

    return {
      booking: updatedBooking,
      returnRecord,
      feeInfo,
    };
  });
}
