import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/db';
import { transferActiveLoan } from '../lib/services/transfer.service';
import { checkGearAvailability } from '../lib/services/availability.service';

describe('Loan Transfer System Business Rules & Audit Suite', () => {
  let adminUser: any;
  let studentA: any;
  let studentB: any;
  let studentC: any;
  let gearItem: any;
  let gearUnit: any;
  let activeBooking: any;

  beforeEach(async () => {
    // Clear test tables
    await prisma.notification.deleteMany();
    await prisma.transferRecord.deleteMany();
    await prisma.returnRecord.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.gearUnit.deleteMany();
    await prisma.gearItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Create demo users
    adminUser = await prisma.user.create({
      data: { name: 'Admin Staff', email: 'admin-test@college.edu', role: 'ADMIN' },
    });
    studentA = await prisma.user.create({
      data: { name: 'Student Alice', email: 'alice-test@college.edu', role: 'STUDENT', maxActiveBookings: 3 },
    });
    studentB = await prisma.user.create({
      data: { name: 'Student Bob', email: 'bob-test@college.edu', role: 'STUDENT', maxActiveBookings: 3 },
    });
    studentC = await prisma.user.create({
      data: { name: 'Student Charlie (Limit Exceeded)', email: 'charlie-test@college.edu', role: 'STUDENT', maxActiveBookings: 1 },
    });

    // Create gear category, item & physical unit
    const cat = await prisma.category.create({ data: { name: 'Test Cameras' } });
    gearItem = await prisma.gearItem.create({
      data: {
        categoryId: cat.id,
        name: '4K Cinema Camera',
        depositAmount: 50.0,
        dailyLateFee: 10.0,
      },
    });

    gearUnit = await prisma.gearUnit.create({
      data: {
        gearItemId: gearItem.id,
        unitTag: 'CAM-TEST-01',
        condition: 'GOOD',
        isAvailable: true,
      },
    });

    // Create active ISSUED booking for Student A
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days in future

    activeBooking = await prisma.booking.create({
      data: {
        bookingCode: 'BK-TEST-TRANSFER-01',
        userId: studentA.id,
        gearItemId: gearItem.id,
        gearUnitId: gearUnit.id,
        purpose: 'Test Shoot',
        startDate,
        endDate,
        status: 'ISSUED',
      },
    });
  });

  it('1. should successfully transfer active loan from Student A to Student B', async () => {
    const originalDueDate = activeBooking.endDate.getTime();
    const originalUnitId = activeBooking.gearUnitId;

    const result = await transferActiveLoan({
      bookingId: activeBooking.id,
      toUserId: studentB.id,
      staffUserId: adminUser.id,
      reason: 'Group handover',
    });

    // Verify booking updated owner
    expect(result.booking.userId).toBe(studentB.id);
    expect(result.booking.bookingCode).toBe('BK-TEST-TRANSFER-01');

    // 2. Verify original due date remains unchanged
    expect(result.booking.endDate.getTime()).toBe(originalDueDate);

    // 3. Verify same physical unit remains assigned
    expect(result.booking.gearUnitId).toBe(originalUnitId);

    // 7. Verify transfer history record created
    expect(result.transferRecord.fromUserId).toBe(studentA.id);
    expect(result.transferRecord.toUserId).toBe(studentB.id);
    expect(result.transferRecord.staffUserId).toBe(adminUser.id);
    expect(result.transferRecord.reason).toBe('Group handover');
  });

  it('4. should maintain identical equipment availability before and after transfer', async () => {
    const availBefore = await checkGearAvailability(gearItem.id, activeBooking.startDate, activeBooking.endDate);

    await transferActiveLoan({
      bookingId: activeBooking.id,
      toUserId: studentB.id,
      staffUserId: adminUser.id,
    });

    const availAfter = await checkGearAvailability(gearItem.id, activeBooking.startDate, activeBooking.endDate);

    expect(availAfter.availableUnitsCount).toBe(availBefore.availableUnitsCount);
    expect(availAfter.isAvailable).toBe(availBefore.isAvailable);
  });

  it('5. should reject loan transfer for RETURNED, REJECTED, or CANCELLED loans', async () => {
    const returnedBooking = await prisma.booking.create({
      data: {
        bookingCode: 'BK-RETURNED-01',
        userId: studentA.id,
        gearItemId: gearItem.id,
        gearUnitId: gearUnit.id,
        purpose: 'Done Shoot',
        startDate: new Date(),
        endDate: new Date(),
        status: 'RETURNED',
      },
    });

    await expect(
      transferActiveLoan({
        bookingId: returnedBooking.id,
        toUserId: studentB.id,
        staffUserId: adminUser.id,
      })
    ).rejects.toThrow(/Cannot transfer a loan in 'RETURNED' status/);
  });

  it('6. should enforce new borrower booking limit validation before transfer', async () => {
    // Fill Student C's active booking limit (max 1)
    await prisma.booking.create({
      data: {
        bookingCode: 'BK-STUDENT-C-ACTIVE',
        userId: studentC.id,
        gearItemId: gearItem.id,
        purpose: 'Existing Shoot',
        startDate: new Date(),
        endDate: new Date(),
        status: 'ISSUED',
      },
    });

    // Attempt transfer activeBooking to Student C should fail
    await expect(
      transferActiveLoan({
        bookingId: activeBooking.id,
        toUserId: studentC.id,
        staffUserId: adminUser.id,
      })
    ).rejects.toThrow(/New borrower Student Charlie \(Limit Exceeded\) has reached active booking limit/);
  });

  it('8. should perform clean rollback if any step fails', async () => {
    const initialBookingState = await prisma.booking.findUnique({ where: { id: activeBooking.id } });

    // Try transferring to non-existent user
    await expect(
      transferActiveLoan({
        bookingId: activeBooking.id,
        toUserId: 'non-existent-user-id',
        staffUserId: adminUser.id,
      })
    ).rejects.toThrow();

    // Verify booking state was completely untouched
    const afterFailedTransfer = await prisma.booking.findUnique({ where: { id: activeBooking.id } });
    expect(afterFailedTransfer?.userId).toBe(initialBookingState?.userId);
  });
});
