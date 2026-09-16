import { prisma } from '../db';
import { checkUserBookingLimit } from './limit.service';

export interface TransferLoanParams {
  bookingId: string;
  toUserId: string;
  staffUserId: string;
  reason?: string;
}

/**
 * Transfers an active loan (ISSUED or APPROVED) to a new borrower.
 *
 * Rules:
 * - Status MUST be ISSUED or APPROVED (active).
 * - Returned, Rejected, or Cancelled loans cannot be transferred.
 * - Original due date (endDate) remains completely unchanged.
 * - Same physical unit (gearUnitId) remains assigned.
 * - Availability window remains unchanged.
 * - New borrower is validated for booking limits before transfer.
 * - Transfer record is logged for audit trail.
 * - Performed atomically within a database transaction.
 */
export async function transferActiveLoan(params: TransferLoanParams) {
  const { bookingId, toUserId, staffUserId, reason } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch booking with current borrower and equipment details
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        gearItem: true,
        gearUnit: true,
        user: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // 2. Validate booking status (active loans only)
    if (booking.status !== 'ISSUED' && booking.status !== 'APPROVED') {
      throw new Error(`Cannot transfer a loan in '${booking.status}' status. Only active loans (ISSUED or APPROVED) can be transferred.`);
    }

    // 3. Prevent transferring to same borrower
    if (booking.userId === toUserId) {
      throw new Error('Target borrower is already the current borrower of this loan.');
    }

    // 4. Verify target user exists
    const targetUser = await tx.user.findUnique({
      where: { id: toUserId },
    });

    if (!targetUser) {
      throw new Error('Target borrower not found');
    }

    // 5. Validate target borrower booking limits
    const limitCheck = await checkUserBookingLimit(toUserId);
    if (!limitCheck.allowed) {
      throw new Error(
        `Cannot transfer loan: New borrower ${targetUser.name} has reached active booking limit (${limitCheck.currentActiveCount}/${limitCheck.maxLimit}).`
      );
    }

    const fromUserId = booking.userId;

    // 6. Update booking owner (userId) while preserving bookingId, code, dates, gearUnitId, status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        userId: toUserId,
      },
      include: {
        user: true,
        gearItem: true,
        gearUnit: true,
        transferHistory: {
          include: {
            fromUser: true,
            toUser: true,
            staffUser: true,
          },
        },
      },
    });

    // 7. Create audit TransferRecord entry
    const transferRecord = await tx.transferRecord.create({
      data: {
        bookingId,
        fromUserId,
        toUserId,
        staffUserId,
        reason: reason || null,
      },
      include: {
        fromUser: true,
        toUser: true,
        staffUser: true,
      },
    });

    // 8. Create notifications for both previous and new borrowers
    await tx.notification.createMany({
      data: [
        {
          userId: fromUserId,
          title: 'Loan Transferred Out',
          message: `Your active loan ${booking.bookingCode} (${booking.gearItem.name}) was transferred to ${targetUser.name}.`,
          type: 'TRANSFER',
        },
        {
          userId: toUserId,
          title: 'Loan Transferred In',
          message: `Active loan ${booking.bookingCode} (${booking.gearItem.name} - ${booking.gearUnit?.unitTag || 'Unit'}) was transferred to you. Due date: ${booking.endDate.toLocaleDateString()}.`,
          type: 'TRANSFER',
        },
      ],
    });

    return {
      booking: updatedBooking,
      transferRecord,
    };
  });
}
