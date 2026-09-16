import { prisma } from '../db';
import { DashboardMetrics } from '../types';

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();

  const totalGearItems = await prisma.gearItem.count();
  const totalUnits = await prisma.gearUnit.count();

  const damagedOrMissingUnits = await prisma.gearUnit.count({
    where: {
      OR: [{ condition: 'DAMAGED' }, { condition: 'MISSING' }],
    },
  });

  const currentlyBorrowed = await prisma.booking.count({
    where: { status: 'ISSUED' },
  });

  // Overdue = ISSUED bookings where endDate < now
  const overdueBookingsCount = await prisma.booking.count({
    where: {
      status: 'ISSUED',
      endDate: { lt: now },
    },
  });

  const availableUnits = await prisma.gearUnit.count({
    where: {
      isAvailable: true,
      condition: { notIn: ['DAMAGED', 'MISSING'] },
      bookings: {
        none: {
          status: { in: ['ISSUED'] },
        },
      },
    },
  });

  const pendingRequests = await prisma.booking.count({
    where: { status: 'PENDING' },
  });

  const upcomingBookings = await prisma.booking.count({
    where: {
      status: 'APPROVED',
      startDate: { gte: now },
    },
  });

  // Calculate sum of late fees charged from ReturnRecord
  const returnRecords = await prisma.returnRecord.aggregate({
    _sum: {
      lateFeeCharged: true,
    },
  });

  const outstandingLateFees = returnRecords._sum.lateFeeCharged || 0;

  return {
    totalGearItems,
    totalUnits,
    availableUnits,
    currentlyBorrowed,
    overdueBookingsCount,
    damagedOrMissingUnits,
    upcomingBookings,
    pendingRequests,
    outstandingLateFees: Number(outstandingLateFees.toFixed(2)),
  };
}
