import { prisma } from '../db';
import { AvailabilityCheckResult, UnitCondition } from '../types';

/**
 * Checks physical unit availability for a specific GearItem in a given date range.
 *
 * Rules:
 * - A unit is available if condition != DAMAGED/MISSING and isAvailable == true.
 * - A unit is unavailable for the requested range [startDate, endDate] if it has an active booking
 *   (status in APPROVED, ISSUED) whose [b.startDate, b.endDate] overlaps with [startDate, endDate].
 * - Overlap condition: (booking.startDate < requestedEndDate) AND (booking.endDate > requestedStartDate)
 */
export async function checkGearAvailability(
  gearItemId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilityCheckResult> {
  const gearItem = await prisma.gearItem.findUnique({
    where: { id: gearItemId },
    include: {
      units: true,
    },
  });

  if (!gearItem) {
    throw new Error('Gear item not found');
  }

  // Filter operational units (not damaged/missing)
  const operationalUnits = gearItem.units.filter(
    (u) => u.isAvailable && u.condition !== 'DAMAGED' && u.condition !== 'MISSING'
  );

  // Find all active bookings overlapping requested dates for this gear item
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      gearItemId,
      status: { in: ['APPROVED', 'ISSUED'] },
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
      ],
    },
  });

  // Collect booked unit IDs
  const bookedUnitIds = new Set<string>();
  overlappingBookings.forEach((b) => {
    if (b.gearUnitId) {
      bookedUnitIds.add(b.gearUnitId);
    }
  });

  // Calculate unassigned overlapping bookings
  const unassignedOverlappingCount = overlappingBookings.filter((b) => !b.gearUnitId).length;

  // Available specific units
  const availableUnits = operationalUnits.filter((u) => !bookedUnitIds.has(u.id));

  // Effective available count taking unassigned approved bookings into account
  const effectiveAvailableCount = Math.max(0, availableUnits.length - unassignedOverlappingCount);

  return {
    gearItemId,
    gearItemName: gearItem.name,
    totalUnits: gearItem.units.length,
    operationalUnits: operationalUnits.length,
    availableUnitsCount: effectiveAvailableCount,
    availableUnits: availableUnits.slice(0, effectiveAvailableCount).map((u) => ({
      id: u.id,
      unitTag: u.unitTag,
      condition: u.condition as UnitCondition,
    })),
    conflictingBookingsCount: overlappingBookings.length,
    isAvailable: effectiveAvailableCount > 0,
  };
}

/**
 * Checks availability across all physical units of an item to assign the first free unit.
 */
export async function findFirstAvailableUnit(
  gearItemId: string,
  startDate: Date,
  endDate: Date
): Promise<string | null> {
  const check = await checkGearAvailability(gearItemId, startDate, endDate);
  if (check.availableUnits.length > 0) {
    return check.availableUnits[0].id;
  }
  return null;
}
