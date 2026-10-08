import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const qrs = await prisma.qrCode.findMany();
  let updated = 0;
  
  for (const qr of qrs) {
    if (qr.qr_serial && !qr.qr_serial.startsWith('V-')) {
      const match = qr.qr_serial.match(/-(.+)$/);
      if (match) {
        const newSerial = `V-${match[1]}`;
        await prisma.qrCode.update({
          where: { id: qr.id },
          data: { qr_serial: newSerial, product_type: 'V' }
        });
        updated++;
      }
    }
  }
  console.log(`Updated ${updated} QR codes to V- prefix.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
