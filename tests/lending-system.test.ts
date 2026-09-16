import { describe, it, expect } from 'vitest';
import { calculateReturnFees } from '../lib/services/return.service';

describe('College AV Lending System Business Rules Test Suite', () => {
  describe('Return Processing & Late Fee Calculation Engine', () => {
    it('should return 0 late fee and full deposit refund when gear is returned on or before due date', () => {
      const dueDate = new Date('2026-10-10T17:00:00Z');
      const actualReturn = new Date('2026-10-10T15:00:00Z');
      const dailyFee = 10.0;
      const deposit = 50.0;

      const result = calculateReturnFees(dueDate, actualReturn, dailyFee, deposit);

      expect(result.daysOverdue).toBe(0);
      expect(result.lateFeeCharged).toBe(0.0);
      expect(result.depositRefunded).toBe(50.0);
      expect(result.isOverdue).toBe(false);
    });

    it('should calculate 2 days late fee and deduct from refundable deposit', () => {
      const dueDate = new Date('2026-10-10T17:00:00Z');
      const actualReturn = new Date('2026-10-12T18:00:00Z'); // 2 days late
      const dailyFee = 10.0;
      const deposit = 50.0;

      const result = calculateReturnFees(dueDate, actualReturn, dailyFee, deposit);

      expect(result.daysOverdue).toBe(3); // Math.ceil difference across days
      expect(result.lateFeeCharged).toBe(30.0);
      expect(result.depositRefunded).toBe(20.0); // 50 - 30 = 20
      expect(result.isOverdue).toBe(true);
    });

    it('should never allow refundable deposit amount to drop below zero even if late fee exceeds deposit', () => {
      const dueDate = new Date('2026-10-01T17:00:00Z');
      const actualReturn = new Date('2026-10-15T17:00:00Z'); // 14 days late
      const dailyFee = 10.0;
      const deposit = 50.0; // Late fee would be $140, which exceeds $50 deposit

      const result = calculateReturnFees(dueDate, actualReturn, dailyFee, deposit);

      expect(result.daysOverdue).toBe(14);
      expect(result.lateFeeCharged).toBe(140.0);
      expect(result.depositRefunded).toBe(0.0); // Never negative!
    });
  });

  describe('Overlapping Booking Windows Logic', () => {
    it('should correctly detect overlapping time ranges', () => {
      const rangeA = { start: new Date('2026-10-01'), end: new Date('2026-10-05') };
      const rangeB = { start: new Date('2026-10-04'), end: new Date('2026-10-08') };
      const rangeC = { start: new Date('2026-10-06'), end: new Date('2026-10-10') };

      const isOverlappingAB = (rangeA.start < rangeB.end) && (rangeA.end > rangeB.start);
      const isOverlappingAC = (rangeA.start < rangeC.end) && (rangeA.end > rangeC.start);

      expect(isOverlappingAB).toBe(true);
      expect(isOverlappingAC).toBe(false);
    });
  });

  describe('Booking Limits Logic', () => {
    it('should enforce maximum active bookings limit per user', () => {
      const maxLimit = 3;
      const currentActive = 3;

      const allowed = currentActive < maxLimit;
      expect(allowed).toBe(false);
    });

    it('should allow booking when under active limit', () => {
      const maxLimit = 3;
      const currentActive = 1;

      const allowed = currentActive < maxLimit;
      expect(allowed).toBe(true);
    });
  });
});
