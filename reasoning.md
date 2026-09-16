# 🧠 System Architecture & Engineering Reasoning

This document outlines the architectural rationale, domain modeling decisions, business rule enforcement, and engineering trade-offs behind the **College AV Gear Lending System**.

---

## 1. Problem Analysis & System Philosophy

### 1.1 The Legacy Problem
College AV rooms traditionally rely on paper logs or unstructured spreadsheets. This leads to critical operational failures:
- **Double-booking**: Multiple students showing up for the same camera kit or projector.
- **Phantom inventory**: Damaged or lost units remaining listed as available.
- **Unclear due dates & accountability**: Borrowers keeping equipment indefinitely without financial friction.
- **Lack of audit trails**: No record of who handed over gear to whom, or when equipment condition degraded.

### 1.2 Core Design Philosophy
To address these challenges, the system is designed around five core principles:
1. **Physical Unit Granularity**: Every item in inventory exists as both a conceptual product (`GearItem`) and discrete physical hardware units (`GearUnit` with barcode/serial tag).
2. **Time-Range Availability Projection**: Availability is computed dynamically across date/time windows by evaluating overlapping active reservations.
3. **Strict Financial Safeguards**: Deposit refunds and late fee deductions use non-negative mathematical bounds (`depositRefunded = max(0, deposit - lateFee)`).
4. **Active Loan Invariance during Transfer**: Loan transfer changes the borrower while holding the loan ID, code, physical unit, and original due date strictly invariant.
5. **ACID Transactional Integrity**: All status mutations, returns, and transfers execute inside database transactions to eliminate race conditions.

---

## 2. Technology Stack & Architectural Rationale

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Combines full-stack REST API endpoints (`/api/...`) and server/client React components in a single, unified TypeScript repository. |
| **Database & ORM** | SQLite + Prisma ORM | Relational schema with foreign keys, cascading deletes, and ACID transaction support. SQLite file storage (`dev.db`) ensures zero external database server dependency for local execution while maintaining production-ready relational semantics. |
| **Validation** | Zod | Enforces strict type safety and input sanitization at API boundaries before data reaches services or database transactions. |
| **Testing** | Vitest | Fast, zero-config TypeScript unit testing framework for verifying domain business rules (availability calculation, fee accounting, transfer invariants, limit checks). |
| **Styling** | Tailwind CSS + Lucide Icons | Clean, responsive modern dashboard UI with clear status badges, timeline matrices, and modal workflows. |

---

## 3. Domain Model & Database Schema Design

```
   ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
   │   Category   │ 1 ──── * │   GearItem   │ 1 ──── * │   GearUnit   │
   └──────────────┘          └──────────────┘          └──────────────┘
                                    │                          │
                                    │ 1                        │ 1 (optional)
                                    ▼                          ▼
   ┌──────────────┐          ┌────────────────────────────────────────┐
   │     User     │ 1 ──── * │                Booking                 │
   └──────────────┘          └────────────────────────────────────────┘
     │        │                          │                  │
     │        │                          │ 1                │ 1
     │        │                          ▼                  ▼
     │        │                  ┌──────────────┐   ┌────────────────┐
     │        └────────────────> │ ReturnRecord │   │ TransferRecord │
     └─────────────────────────> └──────────────┘   └────────────────┘
```

### Key Schema Entities:
- **`GearItem` vs `GearUnit`**: `GearItem` stores global properties (deposit amount, daily late fee rate, max borrow days, category). `GearUnit` tracks individual physical hardware tags (e.g. `DSLR-01`, `DSLR-02`), serial numbers, and condition (`EXCELLENT`, `GOOD`, `NEEDS_MAINTENANCE`, `DAMAGED`, `MISSING`).
- **`Booking`**: Stores `bookingCode`, `userId`, `gearItemId`, `gearUnitId`, `purpose`, `startDate`, `endDate`, `status` (`PENDING`, `APPROVED`, `ISSUED`, `RETURNED`, `REJECTED`, `CANCELLED`).
- **`ReturnRecord`**: Isolated return accounting ledger recording `actualReturnDate`, `conditionOnReturn`, `daysOverdue`, `lateFeeCharged`, `depositRefunded`, and staff inspector ID.
- **`TransferRecord`**: Immutable audit log for active loan transfers capturing `fromUserId`, `toUserId`, `staffUserId`, `bookingId`, `transferredAt`, and `reason`.

---

## 4. Key Business Logic Implementations

### 4.1 Unit-Level Availability Computation
Availability for a gear item across date range $[t_{\text{start}}, t_{\text{end}}]$ is determined by:
1. Identifying operational units: `unit.isAvailable == true` AND `unit.condition NOT IN ('DAMAGED', 'MISSING')`.
2. Querying active bookings (`APPROVED` or `ISSUED`) where:
   $$\text{booking.startDate} < t_{\text{end}} \quad \text{AND} \quad \text{booking.endDate} > t_{\text{start}}$$
3. Subtracting booked units and unassigned active bookings from the operational count.

### 4.2 Return Accounting & Fee Deduction
When lending staff processes a return:
1. Overdue days calculated:
   $$\text{daysOverdue} = \begin{cases} \left\lceil \frac{t_{\text{actualReturn}} - t_{\text{endDate}}}{24 \text{ hours}} \right\rceil & \text{if } t_{\text{actualReturn}} > t_{\text{endDate}} \\ 0 & \text{otherwise} \end{cases}$$
2. Financial calculation:
   $$\text{lateFeeCharged} = \text{daysOverdue} \times \text{dailyLateFee}$$
   $$\text{depositRefunded} = \max\left(0, \; \text{depositAmount} - \text{lateFeeCharged}\right)$$
3. The physical unit is immediately released back to available status if condition is `GOOD` or `EXCELLENT`. If marked `DAMAGED` or `MISSING`, `isAvailable` is set to `false`.

### 4.3 Active Loan Transfer Rationale (Project Twist)
**Why Transfer is NOT Cancellation + Re-booking**:
- Cancelling and recreating a booking changes booking IDs, resets creation timestamps, alters queue ordering, and opens temporary availability gaps where another user could snag the unit.
- **Transfer Strategy**: We perform a direct owner update (`booking.userId = toUserId`) inside a database transaction while keeping `bookingId`, `bookingCode`, `gearItemId`, `gearUnitId`, `startDate`, `endDate` (original due date), and `status` **100% invariant**.
- **Auditability**: Creates a `TransferRecord` entry and dispatches notifications to both borrowers.

### 4.4 Booking Limit Enforcement
Before creating a new booking request or transferring an active loan to a user, the system evaluates:
$$\text{activeBookingsCount} = \text{count(bookings where status} \in \{\text{'PENDING'}, \text{'APPROVED'}, \text{'ISSUED'}\}\text{)}$$
If $\text{activeBookingsCount} \ge \text{user.maxActiveBookings}$, the operation is rejected immediately.

---

## 5. Verification & Testing Strategy

Automated tests in Vitest (`tests/lending-system.test.ts` and `tests/transfer.test.ts`) test domain contracts:
- **On-time returns**: 0 late fee, 100% deposit refund.
- **Overdue returns**: Accurate daily late fee deduction.
- **Fee overflow**: Deposit refund bounded at `$0.00` (never negative).
- **Active loan transfer**: Validates borrower update, due date invariance, physical unit retention, transfer audit creation, non-transferability of returned/cancelled loans, limit enforcement, and transaction rollback on failure.