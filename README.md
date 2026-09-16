# 🎥 College AV Gear Lending System

A production-quality full-stack web application designed for college AV rooms to track equipment inventory, manage physical unit availability, automate borrowing requests and approvals, calculate late fees and deposit refunds, enforce user booking limits, and present staff dashboards.

---

## 🌟 Key Features

1. **Gear Management & Multi-Unit Tracking**:
   - Equipment catalog with categories (DSLRs, Projectors, Mics, Tripods, Lighting).
   - Multi-unit support with unique **Unit Tags** (e.g. `DSLR-01`, `DSLR-02`, `MIC-01`).
   - Unit condition inspection tracking: `EXCELLENT`, `GOOD`, `NEEDS_MAINTENANCE`, `DAMAGED`, `MISSING`.

2. **Availability & Schedule Engine**:
   - Real-time date range lookup to check free physical units.
   - Prevents double-booking overlapping time slots at application and database level.
   - 7-day timeline matrix showing physical unit availability across calendar days.

3. **Borrowing Request & Approval Workflow**:
   - Student borrowing request submission with purpose, start time, and expected return time.
   - Lending staff desk for request review, unit assignment, and gear checkout issuance.

4. **Return Inspection & Deposit / Late Fee Accounting**:
   - Lending staff return recording with actual return timestamp and unit condition check.
   - Automated late fee calculation: `daysOverdue * dailyLateFee`.
   - Deposit refund calculation: `depositRefunded = Math.max(0, depositAmount - lateFeeCharged)` (never negative).

5. **Configurable Booking Limits**:
   - Enforces max active non-returned bookings per user (default: 3 items) before confirming reservation.

6. **Admin Dashboard & Role Switcher**:
   - Summary stat cards for total gear, available units, currently borrowed, overdue items, damaged/missing, pending requests, and outstanding late fees.
   - Quick role impersonation toolbar (Student vs Admin/Lending Staff) for easy demo testing.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 14+ (App Router) with TypeScript & React 18
- **Styling**: Tailwind CSS, Lucide React icons, smooth UI transitions
- **Database**: SQLite (`prisma/dev.db`)
- **ORM**: Prisma ORM with relational schema & ACID transactions
- **Testing**: Vitest automated unit test suite

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ & npm v9+

### 2. Installation & Setup

```bash
# Navigate into project directory
cd college-av-lending-system

# Install dependencies
npm install

# Push database schema & populate demo seed data
npx prisma db push
npm run db:seed
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 Running Automated Tests

Run the Vitest test suite to verify availability logic, overlap prevention, return calculations, and booking limits:

```bash
npm test
```

---

## 🔑 Environment Variables (`.env`)

```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="College AV Gear Lending System"
```

---

## 👥 Demo Users Pre-loaded in Seed

- **Prof. Alex Rivera** (`admin@college.edu`) - *Admin / Lending Staff*
- **Jordan Lee** (`jordan.lee@student.college.edu`) - *Student / Borrower*
- **Taylor Smith** (`taylor.smith@student.college.edu`) - *Student / Borrower (Has overdue item for demo)*
- **Morgan Vance** (`morgan.vance@student.college.edu`) - *Student / Borrower*
