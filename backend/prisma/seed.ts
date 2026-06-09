import { PrismaClient, Role, AssetCategory, AssetStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.assetHealthReport.deleteMany();
  await prisma.return.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@culttrack.in',
      fullName: 'Council Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'member@culttrack.in',
      fullName: 'Society Member',
      passwordHash,
      role: Role.USER,
    },
  });

  console.log(`Created users: Admin (${admin.email}), User (${user.email})`);

  // Create Assets
  const assetsData = [
    {
      name: 'Sony A7 IV DSLR Camera',
      category: AssetCategory.CAMERA,
      description: 'High-resolution full-frame mirrorless camera for photography and videography.',
      totalQuantity: 3,
      quantityAvailable: 3,
      status: AssetStatus.ACTIVE,
    },
    {
      name: 'Godox SL60W Studio Light',
      category: AssetCategory.LIGHTING,
      description: '60W continuous LED video light with Bowens mount for studio setups.',
      totalQuantity: 6,
      quantityAvailable: 6,
      status: AssetStatus.ACTIVE,
    },
    {
      name: 'JBL EON715 PA Speaker',
      category: AssetCategory.AUDIO,
      description: '15-inch 1300W active PA speaker with Bluetooth control.',
      totalQuantity: 4,
      quantityAvailable: 4,
      status: AssetStatus.ACTIVE,
    },
    {
      name: 'Rode Wireless GO II Mic',
      category: AssetCategory.RECORDING,
      description: 'Dual-channel wireless microphone system for crystal clear recording.',
      totalQuantity: 5,
      quantityAvailable: 5,
      status: AssetStatus.ACTIVE,
    },
    {
      name: 'Traditional Dance Costumes (Set of 5)',
      category: AssetCategory.COSTUME,
      description: 'Handcrafted traditional garments used for group cultural performances.',
      totalQuantity: 8,
      quantityAvailable: 8,
      status: AssetStatus.ACTIVE,
    },
    {
      name: 'Foldable Stage Platform',
      category: AssetCategory.INFRA,
      description: 'Heavy duty steel stage platform riser for outdoor and indoor event settings.',
      totalQuantity: 2,
      quantityAvailable: 2,
      status: AssetStatus.ACTIVE,
    },
    {
      name: 'Vintage Microphone Stand Prop',
      category: AssetCategory.PROP,
      description: 'Chrome-plated retro prop microphone and adjustable heavy stand for theatrical plays.',
      totalQuantity: 3,
      quantityAvailable: 3,
      status: AssetStatus.ACTIVE,
    },
  ];

  for (const asset of assetsData) {
    const created = await prisma.asset.create({
      data: {
        ...asset,
        qrCodeUrl: `http://localhost:5173/assets/scan-simulate?id=TEMPLATE_ID`, // Will placeholder/override in code
      },
    });
    // Update the QR URL with the actual database ID
    await prisma.asset.update({
      where: { id: created.id },
      data: {
        qrCodeUrl: `http://localhost:5173/assets/scan-simulate?id=${created.id}`,
      },
    });
  }

  console.log('Successfully seeded assets.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
