import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, isRead, markAllForUserId } = body;

    if (markAllForUserId) {
      await prisma.notification.updateMany({
        where: { userId: markAllForUserId },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (notificationId) {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: isRead ?? true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'notificationId or markAllForUserId required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update notification' }, { status: 500 });
  }
}
