import { prisma } from '../db';

/**
 * Checks whether a borrower can place a new booking request.
 *
 * Rules:
 * - A borrower has an active limit configured (user.maxActiveBookings or default system setting).
 * - Active bookings include PENDING, APPROVED, and ISSUED (non-returned/cancelled/rejected).
 */
export async function checkUserBookingLimit(userId: string): Promise<{
  allowed: boolean;
  currentActiveCount: number;
  maxLimit: number;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get max limit from user setting or system setting
  let maxLimit = user.maxActiveBookings ?? 3;
  if (!user.maxActiveBookings) {
    const sysSetting = await prisma.systemSetting.findUnique({
      where: { key: 'default_max_active_bookings_per_user' },
    });
    if (sysSetting) {
      maxLimit = parseInt(sysSetting.value, 10) || 3;
    }
  }

  // Count current active non-terminal bookings
  const currentActiveCount = await prisma.booking.count({
    where: {
      userId,
      status: { in: ['PENDING', 'APPROVED', 'ISSUED'] },
    },
  });

  if (currentActiveCount >= maxLimit) {
    return {
      allowed: false,
      currentActiveCount,
      maxLimit,
      message: `Booking limit reached (${currentActiveCount}/${maxLimit} active bookings). Please return current items before making a new reservation.`,
    };
  }

  return {
    allowed: true,
    currentActiveCount,
    maxLimit,
  };
}
