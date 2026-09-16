import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing tables
  await prisma.notification.deleteMany();
  await prisma.returnRecord.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.gearUnit.deleteMany();
  await prisma.gearItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'default_max_active_bookings_per_user', value: '3' },
      { key: 'default_late_fee_per_day', value: '5.00' },
      { key: 'college_name', value: 'St. Jude College of Media & Arts' },
    ],
  });

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      name: 'Prof. Alex Rivera',
      role: 'ADMIN',
      department: 'AV & Media Center Head',
      phone: '+1 (555) 019-2831',
      maxActiveBookings: 10,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'jordan.lee@student.college.edu',
      name: 'Jordan Lee',
      role: 'STUDENT',
      department: 'Film Production & Media',
      phone: '+1 (555) 012-3456',
      maxActiveBookings: 3,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'taylor.smith@student.college.edu',
      name: 'Taylor Smith',
      role: 'STUDENT',
      department: 'Journalism & Mass Comm',
      phone: '+1 (555) 014-7890',
      maxActiveBookings: 3,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'morgan.vance@student.college.edu',
      name: 'Morgan Vance',
      role: 'STUDENT',
      department: 'Graphic Design',
      phone: '+1 (555) 018-9922',
      maxActiveBookings: 2,
    },
  });

  console.log('✅ Created Demo Users (1 Admin, 3 Students)');

  // 3. Create Categories
  const catCameras = await prisma.category.create({
    data: {
      name: 'Cameras & Lenses',
      description: 'DSLR, Mirrorless cameras, professional zoom and prime lenses',
      icon: 'Camera',
    },
  });

  const catProjectors = await prisma.category.create({
    data: {
      name: 'Projectors & Displays',
      description: 'High-lumen portable & auditorium projectors, projection screens',
      icon: 'Projector',
    },
  });

  const catAudio = await prisma.category.create({
    data: {
      name: 'Audio & Microphones',
      description: 'Wireless lapels, shotgun mics, audio recorders, boom poles',
      icon: 'Mic',
    },
  });

  const catTripods = await prisma.category.create({
    data: {
      name: 'Tripods & Supports',
      description: 'Heavy duty fluid-head tripods, gimbals, monopods',
      icon: 'Tripod',
    },
  });

  const catLighting = await prisma.category.create({
    data: {
      name: 'Lighting & Accessories',
      description: 'LED panels, continuous light kits, softboxes, reflectors',
      icon: 'Sun',
    },
  });

  console.log('✅ Created Categories');

  // 4. Create Gear Items & Units
  const canonItem = await prisma.gearItem.create({
    data: {
      categoryId: catCameras.id,
      name: 'Canon EOS R6 Mark II Kit',
      model: 'EOS R6 Mk II + 24-105mm Lens',
      description: 'Full-frame mirrorless camera with 4K 60p video and dual card slots.',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      depositAmount: 50.0,
      dailyLateFee: 10.0,
      maxBorrowDays: 7,
      units: {
        create: [
          { unitTag: 'DSLR-01', serialNumber: 'CN-88491-A', condition: 'EXCELLENT', isAvailable: true },
          { unitTag: 'DSLR-02', serialNumber: 'CN-88492-B', condition: 'GOOD', isAvailable: true },
          { unitTag: 'DSLR-03', serialNumber: 'CN-88493-C', condition: 'DAMAGED', isAvailable: false, notes: 'Lens zoom ring stiff, sent to service' },
        ],
      },
    },
    include: { units: true },
  });

  const sonyItem = await prisma.gearItem.create({
    data: {
      categoryId: catCameras.id,
      name: 'Sony Alpha A7 IV Cinema Kit',
      model: 'A7M4 + FE 24-70mm f/2.8 GM',
      description: '33MP BSI CMOS sensor camera suited for low-light video shoots.',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&auto=format&fit=crop&q=80',
      depositAmount: 60.0,
      dailyLateFee: 12.0,
      maxBorrowDays: 5,
      units: {
        create: [
          { unitTag: 'SONY-01', serialNumber: 'SN-9901-X', condition: 'GOOD', isAvailable: true },
          { unitTag: 'SONY-02', serialNumber: 'SN-9902-Y', condition: 'EXCELLENT', isAvailable: true },
        ],
      },
    },
    include: { units: true },
  });

  const projectorItem = await prisma.gearItem.create({
    data: {
      categoryId: catProjectors.id,
      name: 'Epson Pro 4K Laser Projector',
      model: 'Epson EB-PU1007W (7000 Lumens)',
      description: 'Ultra-bright 4K UHD laser projector for auditorium presentations.',
      imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
      depositAmount: 40.0,
      dailyLateFee: 8.0,
      maxBorrowDays: 3,
      units: {
        create: [
          { unitTag: 'PROJ-01', serialNumber: 'EP-4401-P', condition: 'EXCELLENT', isAvailable: true },
          { unitTag: 'PROJ-02', serialNumber: 'EP-4402-Q', condition: 'GOOD', isAvailable: true },
          { unitTag: 'PROJ-03', serialNumber: 'EP-4403-R', condition: 'GOOD', isAvailable: true },
        ],
      },
    },
    include: { units: true },
  });

  const micItem = await prisma.gearItem.create({
    data: {
      categoryId: catAudio.id,
      name: 'Rode Wireless GO II Dual Mic System',
      model: 'Wireless GO II + 2x Lavalier Mics',
      description: 'Dual-channel wireless microphone system with 200m range.',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
      depositAmount: 20.0,
      dailyLateFee: 5.0,
      maxBorrowDays: 5,
      units: {
        create: [
          { unitTag: 'MIC-01', serialNumber: 'RD-101', condition: 'GOOD', isAvailable: true },
          { unitTag: 'MIC-02', serialNumber: 'RD-102', condition: 'EXCELLENT', isAvailable: true },
          { unitTag: 'MIC-03', serialNumber: 'RD-103', condition: 'GOOD', isAvailable: true },
          { unitTag: 'MIC-04', serialNumber: 'RD-104', condition: 'MISSING', isAvailable: false, notes: 'Transmitter lost during campus festival' },
        ],
      },
    },
    include: { units: true },
  });

  const tripodItem = await prisma.gearItem.create({
    data: {
      categoryId: catTripods.id,
      name: 'Manfrotto 290 Xtra Carbon Tripod',
      model: 'MK290XTC3-3W with 3-Way Head',
      description: 'Lightweight carbon fiber tripod legs with smooth fluid drag head.',
      imageUrl: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=600&auto=format&fit=crop&q=80',
      depositAmount: 15.0,
      dailyLateFee: 3.0,
      maxBorrowDays: 7,
      units: {
        create: [
          { unitTag: 'TRIPOD-01', serialNumber: 'MF-301', condition: 'EXCELLENT', isAvailable: true },
          { unitTag: 'TRIPOD-02', serialNumber: 'MF-302', condition: 'GOOD', isAvailable: true },
          { unitTag: 'TRIPOD-03', serialNumber: 'MF-303', condition: 'GOOD', isAvailable: true },
        ],
      },
    },
    include: { units: true },
  });

  console.log('✅ Created Gear Items & Physical Units');

  // 5. Create Sample Bookings & Returns
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const activeBooking = await prisma.booking.create({
    data: {
      bookingCode: 'BK-2026-1001',
      userId: student1.id,
      gearItemId: micItem.id,
      gearUnitId: micItem.units[0].id,
      purpose: 'Senior Short Film Documentary Interview',
      startDate: yesterday(now),
      endDate: twoDaysLater,
      status: 'ISSUED',
      notes: 'Checked out with 2 lavalier cables and charging case',
    },
  });

  const overdueBooking = await prisma.booking.create({
    data: {
      bookingCode: 'BK-2026-1002',
      userId: student2.id,
      gearItemId: sonyItem.id,
      gearUnitId: sonyItem.units[0].id,
      purpose: 'Campus Newspaper Photojournalism Shoot',
      startDate: fiveDaysAgo,
      endDate: twoDaysAgo,
      status: 'ISSUED',
      notes: 'Overdue notification sent by staff',
    },
  });

  const pendingBooking = await prisma.booking.create({
    data: {
      bookingCode: 'BK-2026-1003',
      userId: student3.id,
      gearItemId: canonItem.id,
      gearUnitId: canonItem.units[0].id,
      purpose: 'Graphic Design Portfolio Studio Lighting Shoot',
      startDate: tomorrow(now),
      endDate: fiveDaysLater,
      status: 'PENDING',
      notes: 'Needs battery grip if available',
    },
  });

  const approvedBooking = await prisma.booking.create({
    data: {
      bookingCode: 'BK-2026-1004',
      userId: student1.id,
      gearItemId: projectorItem.id,
      gearUnitId: projectorItem.units[0].id,
      purpose: 'Film Club Outdoor Screening Event',
      startDate: tomorrow(now),
      endDate: twoDaysLater,
      status: 'APPROVED',
      notes: 'Approved by Prof. Rivera. Unit reserved.',
    },
  });

  const completedBooking = await prisma.booking.create({
    data: {
      bookingCode: 'BK-2026-0999',
      userId: student2.id,
      gearItemId: tripodItem.id,
      gearUnitId: tripodItem.units[0].id,
      purpose: 'Journalism Field Report',
      startDate: fiveDaysAgo,
      endDate: threeDaysAgo,
      actualReturn: twoDaysAgo,
      status: 'RETURNED',
    },
  });

  await prisma.returnRecord.create({
    data: {
      bookingId: completedBooking.id,
      staffUserId: adminUser.id,
      actualReturnDate: twoDaysAgo,
      conditionOnReturn: 'GOOD',
      daysOverdue: 1,
      lateFeeCharged: 3.0,
      depositRefunded: 12.0,
      notes: 'Returned 1 day late. Late fee of $3.00 deducted from deposit of $15.00.',
    },
  });

  console.log('✅ Created Seed Bookings');

  // 6. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: student2.id,
        title: 'OVERDUE GEAR NOTICE',
        message: 'Your rental BK-2026-1002 (Sony Alpha A7 IV Kit) was due on ' + twoDaysAgo.toLocaleDateString() + '. Late fees of $12.00/day are accumulating.',
        type: 'OVERDUE',
        isRead: false,
      },
      {
        userId: student1.id,
        title: 'Upcoming Pickup Tomorrow',
        message: 'Your request BK-2026-1004 (Epson 4K Projector) is approved for pickup tomorrow.',
        type: 'UPCOMING',
        isRead: false,
      },
      {
        userId: student3.id,
        title: 'Booking Request Received',
        message: 'Your booking request BK-2026-1003 has been received by lending staff.',
        type: 'STATUS_CHANGE',
        isRead: true,
      },
    ],
  });

  console.log('✅ Created Demo Notifications');
  console.log('🎉 Seed completed successfully!');
}

function yesterday(d: Date) {
  return new Date(d.getTime() - 1 * 24 * 60 * 60 * 1000);
}

function tomorrow(d: Date) {
  return new Date(d.getTime() + 1 * 24 * 60 * 60 * 1000);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
