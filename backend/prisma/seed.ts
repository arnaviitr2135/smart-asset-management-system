import { PrismaClient, Role, AssetCategory, AssetStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

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

async function ensureUser(email: string, fullName: string, role: Role, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role,
    },
    create: {
      email,
      fullName,
      passwordHash,
      role,
    },
  });
}

async function ensureAsset(asset: (typeof assetsData)[number]) {
  const existing = await prisma.asset.findFirst({
    where: { name: asset.name },
  });

  if (existing) {
    await prisma.asset.update({
      where: { id: existing.id },
      data: {
        description: asset.description,
        category: asset.category,
        qrCodeUrl: `${frontendUrl}/assets/scan-simulate?id=${existing.id}`,
      },
    });
    return existing;
  }

  const created = await prisma.asset.create({
    data: {
      ...asset,
      qrCodeUrl: `${frontendUrl}/assets/scan-simulate?id=TEMPLATE_ID`,
    },
  });

  return prisma.asset.update({
    where: { id: created.id },
    data: {
      qrCodeUrl: `${frontendUrl}/assets/scan-simulate?id=${created.id}`,
    },
  });
}

async function main() {
  console.log('Seeding default users and assets without clearing existing data...');

  const passwordHash = await bcrypt.hash('password123', 10);
  const admin = await ensureUser('admin@culttrack.in', 'Council Admin', Role.ADMIN, passwordHash);
  const user = await ensureUser('member@culttrack.in', 'Society Member', Role.USER, passwordHash);

  console.log(`Ensured users: Admin (${admin.email}), User (${user.email})`);

  for (const asset of assetsData) {
    await ensureAsset(asset);
  }

  console.log('Default assets are ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
