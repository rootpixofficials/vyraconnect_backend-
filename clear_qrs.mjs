import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.qrCode.deleteMany();
  await prisma.qrBatch.deleteMany();
  console.log('Successfully cleared all QR Codes and QR Batches from the database.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
