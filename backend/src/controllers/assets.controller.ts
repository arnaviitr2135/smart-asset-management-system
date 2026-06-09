import { Response } from 'express';
import { PrismaClient, AssetCategory, AssetStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logAudit } from '../services/notification.service';

const prisma = new PrismaClient();

export async function getAssets(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, category, status } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.category = category as AssetCategory;
    }

    if (status) {
      whereClause.status = status as AssetStatus;
    }

    const assets = await assetsWithCalculatedQuantity(whereClause);

    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
}

// Internal helper to fetch assets and dynamically ensure quantityAvailable is synced
async function assetsWithCalculatedQuantity(whereClause: any) {
  const assets = await prisma.asset.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
  });
  return assets;
}

export async function getAssetById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset by ID:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
}

export async function createAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, category, description, totalQuantity } = req.body;

    if (!name || !category || totalQuantity === undefined) {
      return res.status(400).json({ error: 'Name, Category, and Total Quantity are required' });
    }

    if (!Object.values(AssetCategory).includes(category)) {
      return res.status(400).json({ error: 'Invalid asset category' });
    }

    const totalQty = parseInt(totalQuantity, 10);
    if (isNaN(totalQty) || totalQty < 0) {
      return res.status(400).json({ error: 'Total quantity must be a non-negative number' });
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        category: category as AssetCategory,
        description: description || '',
        totalQuantity: totalQty,
        quantityAvailable: totalQty,
        status: AssetStatus.ACTIVE,
      },
    });

    // Generate dynamic QR Code simulator link on the frontend using the created ID
    const qrCodeUrl = `http://localhost:5173/assets/scan-simulate?id=${asset.id}`;
    const updatedAsset = await prisma.asset.update({
      where: { id: asset.id },
      data: { qrCodeUrl },
    });

    await logAudit(
      req.user!.id,
      'ASSET_CREATION',
      `Asset "${name}" (${category}) created with quantity ${totalQty}`
    );

    res.status(201).json(updatedAsset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
}

export async function updateAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, category, description, totalQuantity, status } = req.body;

    const existingAsset = await prisma.asset.findUnique({ where: { id } });
    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (category) {
      if (!Object.values(AssetCategory).includes(category)) {
        return res.status(400).json({ error: 'Invalid asset category' });
      }
      updateData.category = category as AssetCategory;
    }

    if (status) {
      if (!Object.values(AssetStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid asset status' });
      }
      updateData.status = status as AssetStatus;
    }

    if (totalQuantity !== undefined) {
      const newTotal = parseInt(totalQuantity, 10);
      if (isNaN(newTotal) || newTotal < 0) {
        return res.status(400).json({ error: 'Total quantity must be a non-negative number' });
      }

      // Calculate quantity difference
      const diff = newTotal - existingAsset.totalQuantity;
      const newAvailable = existingAsset.quantityAvailable + diff;

      if (newAvailable < 0) {
        return res.status(400).json({
          error: `Cannot decrease total quantity to ${newTotal}. Currently, ${existingAsset.totalQuantity - existingAsset.quantityAvailable} items are active in allocations.`,
        });
      }

      updateData.totalQuantity = newTotal;
      updateData.quantityAvailable = newAvailable;
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      req.user!.id,
      'INVENTORY_UPDATE',
      `Asset "${updatedAsset.name}" updated: ${JSON.stringify(updateData)}`
    );

    res.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
}

export async function deleteAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const existingAsset = await prisma.asset.findUnique({ where: { id } });
    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check if there are active (issued) allocations
    const activeAllocations = await prisma.allocation.findFirst({
      where: {
        assetId: id,
        status: 'ISSUED',
      },
    });

    if (activeAllocations) {
      return res.status(400).json({
        error: 'Cannot delete asset because it has active, unreturned allocations.',
      });
    }

    await prisma.asset.delete({ where: { id } });

    await logAudit(req.user!.id, 'ASSET_DELETION', `Asset "${existingAsset.name}" deleted.`);

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
}
