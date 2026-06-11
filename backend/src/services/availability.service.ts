import { AllocationStatus, BookingStatus, Prisma, PrismaClient } from '@prisma/client';

type PrismaReader = Prisma.TransactionClient | PrismaClient;

export async function calculateAssetAvailability(
  db: PrismaReader,
  assetId: string,
  start: Date,
  end: Date
) {
  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) return null;

  const reservedBookings = await db.booking.findMany({
    where: {
      assetId,
      status: BookingStatus.APPROVED,
      startDate: { lte: end },
      endDate: { gte: start },
      OR: [
        { allocation: { is: null } },
        {
          allocation: {
            is: {
              status: {
                in: [AllocationStatus.ISSUED, AllocationStatus.OVERDUE],
              },
            },
          },
        },
      ],
    },
    select: { quantity: true },
  });

  const reservedForDates = reservedBookings.reduce((sum, booking) => sum + booking.quantity, 0);
  const dateAvailable = Math.max(asset.totalQuantity - reservedForDates, 0);

  return {
    asset,
    reservedForDates,
    dateAvailable,
    currentAvailable: asset.quantityAvailable,
    available: Math.max(Math.min(asset.quantityAvailable, dateAvailable), 0),
  };
}
