import { prisma } from '../db';
import { checkGearAvailability, findFirstAvailableUnit } from './availability.service';
import { checkUserBookingLimit } from './limit.service';

/**
 * Creates a new gear booking request for a user.
 */
export async function createBookingRequest(params: {
  userId: string;
  gearItemId: string;
  purpose: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}) {
  const { userId, gearItemId, purpose, startDate, endDate, notes } = params;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid start or end date format');
  }

  if (start >= end) {
    throw new Error('End date/time must be strictly after start date/time');
  }

  // Check User Limits
  const limitCheck = await checkUserBookingLimit(userId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || 'Active booking limit exceeded');
  }

  // Check Gear Availability
  const availability = await checkGearAvailability(gearItemId, start, end);
  if (!availability.isAvailable) {
    throw new Error(
      `Selected gear item '${availability.gearItemName}' is fully booked or unavailable for the selected time slot.`
    );
  }

  // Generate Booking Code
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `BK-${new Date().getFullYear()}-${randomSuffix}`;

  // Optionally pre-assign available unit if immediately available
  const availableUnitId = await findFirstAvailableUnit(gearItemId, start, end);

  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      userId,
      gearItemId,
      gearUnitId: availableUnitId || null,
      purpose,
      startDate: start,
      endDate: end,
      status: 'PENDING',
      notes: notes || null,
    },
    include: {
      user: true,
      gearItem: true,
      gearUnit: true,
    },
  });

  // Notify User
  await prisma.notification.create({
    data: {
      userId,
      title: 'Booking Request Submitted',
      message: `Your booking request ${bookingCode} for ${booking.gearItem.name} has been submitted for staff approval.`,
      type: 'STATUS_CHANGE',
    },
  });

  return booking;
}

/**
 * Staff approves a booking request and assigns a specific physical unit tag.
 */
export async function approveBooking(params: {
  bookingId: string;
  staffUserId: string;
  gearUnitId?: string;
}) {
  const { bookingId, gearUnitId } = params;

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { gearItem: true, gearUnit: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new Error(`Cannot approve booking in '${booking.status}' status`);
    }

    let unitToAssign = gearUnitId || booking.gearUnitId;

    if (!unitToAssign) {
      // Find free unit
      const freeUnitId = await findFirstAvailableUnit(booking.gearItemId, booking.startDate, booking.endDate);
      if (!freeUnitId) {
        throw new Error('No physical units available for this time range to approve booking');
      }
      unitToAssign = freeUnitId;
    }

    // Verify selected unit doesn't have an overlapping approved/issued booking
    const overlappingUnitBooking = await tx.booking.findFirst({
      where: {
        id: { not: bookingId },
        gearUnitId: unitToAssign,
        status: { in: ['APPROVED', 'ISSUED'] },
        AND: [
          { startDate: { lt: booking.endDate } },
          { endDate: { gt: booking.startDate } },
        ],
      },
    });

    if (overlappingUnitBooking) {
      throw new Error('The selected physical unit already has an overlapping active reservation');
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'APPROVED',
        gearUnitId: unitToAssign,
      },
      include: {
        gearItem: true,
        gearUnit: true,
        user: true,
      },
    });

    // Send Notification
    await tx.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Approved',
        message: `Your booking ${booking.bookingCode} for ${booking.gearItem.name} (${updated.gearUnit?.unitTag}) was approved. Ready for pickup!`,
        type: 'STATUS_CHANGE',
      },
    });

    return updated;
  });
}

/**
 * Staff issues the gear to the borrower (handout).
 */
export async function issueBooking(bookingId: string, staffUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { gearItem: true, gearUnit: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'APPROVED') {
      throw new Error('Only approved bookings can be issued/handed out');
    }

    if (!booking.gearUnitId) {
      throw new Error('A specific physical unit must be assigned before issuing');
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'ISSUED',
      },
      include: {
        gearItem: true,
        gearUnit: true,
        user: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: booking.userId,
        title: 'Gear Issued / Borrowed',
        message: `You have picked up ${booking.gearItem.name} (${updated.gearUnit?.unitTag}). Expected return: ${updated.endDate.toLocaleDateString()}`,
        type: 'STATUS_CHANGE',
      },
    });

    return updated;
  });
}

/**
 * Staff rejects or user cancels a booking.
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: 'REJECTED' | 'CANCELLED',
  reason?: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: newStatus,
      notes: reason ? `[${newStatus} Reason]: ${reason}` : booking.notes,
    },
    include: { gearItem: true },
  });

  await prisma.notification.create({
    data: {
      userId: booking.userId,
      title: `Booking ${newStatus.toLowerCase()}`,
      message: `Your booking ${booking.bookingCode} for ${updated.gearItem.name} was ${newStatus.toLowerCase()}.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'STATUS_CHANGE',
    },
  });

  return updated;
}
