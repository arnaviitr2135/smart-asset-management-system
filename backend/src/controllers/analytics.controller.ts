import { Response } from 'express';
import { PrismaClient, AllocationStatus, BookingStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    // 1. Available vs Total Inventory counts
    const assetsSummary = await prisma.asset.aggregate({
      _sum: {
        quantityAvailable: true,
        totalQuantity: true,
      },
      _count: {
        id: true,
      },
    });

    const totalAssetsCount = assetsSummary._count.id || 0;
    const totalQty = assetsSummary._sum.totalQuantity || 0;
    const availableQty = assetsSummary._sum.quantityAvailable || 0;
    const activeAllocatedQty = totalQty - availableQty;

    // 2. Active bookings (Pending + Approved)
    const activeBookingsCount = await prisma.booking.count({
      where: {
        status: {
          in: [BookingStatus.PENDING, BookingStatus.APPROVED],
        },
      },
    });

    // 3. Overdue returns
    const now = new Date();
    const overdueAllocations = await prisma.allocation.findMany({
      where: {
        status: AllocationStatus.ISSUED,
        dueDate: {
          lt: now,
        },
      },
      include: {
        asset: true,
        user: {
          select: { fullName: true, email: true },
        },
      },
    });

    // 4. Asset utilization stats (Active Allocation Qty / Total Qty) for each asset
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        quantityAvailable: true,
        totalQuantity: true,
      },
    });

    const utilizationRates = assets.map((asset) => {
      const activeItems = asset.totalQuantity - asset.quantityAvailable;
      const rate = asset.totalQuantity > 0 ? (activeItems / asset.totalQuantity) * 100 : 0;
      return {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        total: asset.totalQuantity,
        active: activeItems,
        utilizationRate: Math.round(rate),
      };
    });

    // 5. Popular assets (by number of bookings)
    const popularAssets = await prisma.booking.groupBy({
      by: ['assetId'],
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const popularAssetsDetails = await Promise.all(
      popularAssets.map(async (item) => {
        const asset = await prisma.asset.findUnique({
          where: { id: item.assetId },
          select: { name: true, category: true },
        });
        return {
          name: asset?.name || 'Unknown',
          category: asset?.category || 'Unknown',
          bookingsCount: item._count.id,
          totalQtyBooked: item._sum.quantity || 0,
        };
      })
    );

    res.json({
      totalAssetsCount,
      totalInventory: totalQty,
      availableInventory: availableQty,
      allocatedInventory: activeAllocatedQty,
      activeBookings: activeBookingsCount,
      overdueCount: overdueAllocations.length,
      overdueList: overdueAllocations,
      utilizationRates,
      popularAssets: popularAssetsDetails,
    });
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    res.status(500).json({ error: 'Failed to calculate dashboard statistics' });
  }
}

export async function getDemandForecast(req: AuthenticatedRequest, res: Response) {
  try {
    const assets = await prisma.asset.findMany({
      select: { id: true, name: true, category: true, totalQuantity: true },
    });

    const now = new Date();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const w1Start = new Date(now.getTime() - oneWeekMs);
    const w2Start = new Date(now.getTime() - 2 * oneWeekMs);
    const w3Start = new Date(now.getTime() - 3 * oneWeekMs);

    const forecastData = await Promise.all(
      assets.map(async (asset) => {
        // Fetch bookings for past 3 weeks
        const getBookingCount = async (start: Date, end: Date) => {
          const result = await prisma.booking.aggregate({
            where: {
              assetId: asset.id,
              createdAt: { gte: start, lt: end },
            },
            _sum: { quantity: true },
          });
          return result._sum.quantity || 0;
        };

        const w1Val = await getBookingCount(w1Start, now);
        const w2Val = await getBookingCount(w2Start, w1Start);
        const w3Val = await getBookingCount(w3Start, w2Start);

        // Weighted moving average: W-1 (50%), W-2 (30%), W-3 (20%)
        // If there's no data, we predict a small base rate (e.g. 15% of total asset volume) for demo clarity.
        let predictedDemand = w1Val * 0.5 + w2Val * 0.3 + w3Val * 0.2;
        if (predictedDemand === 0) {
          predictedDemand = Math.round(asset.totalQuantity * 0.15) || 1;
        } else {
          predictedDemand = Math.round(predictedDemand);
        }

        // Clip predicted demand to not exceed double the total quantity for safety bounds
        predictedDemand = Math.min(predictedDemand, asset.totalQuantity * 2);

        return {
          id: asset.id,
          name: asset.name,
          category: asset.category,
          w3Quantity: w3Val,
          w2Quantity: w2Val,
          w1Quantity: w1Val,
          predictedDemand,
        };
      })
    );

    res.json(forecastData);
  } catch (error) {
    console.error('Error generating forecasting demand:', error);
    res.status(500).json({ error: 'Failed to generate demand prediction' });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Cap at latest 100 logs
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function markNotificationAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
}
