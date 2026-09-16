export type UserRole = 'STUDENT' | 'ADMIN';
export type UnitCondition = 'EXCELLENT' | 'GOOD' | 'NEEDS_MAINTENANCE' | 'DAMAGED' | 'MISSING';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'ISSUED' | 'RETURNED' | 'REJECTED' | 'CANCELLED';

export interface GearUnitWithBookingInfo {
  id: string;
  gearItemId: string;
  unitTag: string;
  serialNumber: string | null;
  condition: UnitCondition;
  isAvailable: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GearItemWithUnits {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  name: string;
  model: string | null;
  description: string | null;
  imageUrl: string | null;
  depositAmount: number;
  dailyLateFee: number;
  maxBorrowDays: number;
  units: GearUnitWithBookingInfo[];
  _count?: {
    units: number;
    bookings: number;
  };
}

export interface AvailabilityCheckResult {
  gearItemId: string;
  gearItemName: string;
  totalUnits: number;
  operationalUnits: number;
  availableUnitsCount: number;
  availableUnits: {
    id: string;
    unitTag: string;
    condition: UnitCondition;
  }[];
  conflictingBookingsCount: number;
  isAvailable: boolean;
}

export interface LateFeeCalculation {
  daysOverdue: number;
  dailyFee: number;
  lateFeeCharged: number;
  depositAmount: number;
  depositRefunded: number;
  isOverdue: boolean;
}

export interface DashboardMetrics {
  totalGearItems: number;
  totalUnits: number;
  availableUnits: number;
  currentlyBorrowed: number;
  overdueBookingsCount: number;
  damagedOrMissingUnits: number;
  upcomingBookings: number;
  pendingRequests: number;
  outstandingLateFees: number;
}
