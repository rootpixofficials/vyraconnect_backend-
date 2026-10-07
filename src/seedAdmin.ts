import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'vyarconnectAdmin';
  const password = 'vyraconnect@123';
  
  // Hash the password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  // Upsert the admin (creates if doesn't exist, updates if it does)
  const admin = await prisma.admin.upsert({
    where: { email: username }, // Using email field as the username field
    update: {
      password_hash: hashedPassword,
      name: 'Vyra Admin',
      role: 'SUPER_ADMIN',
    },
    create: {
      email: username,
      name: 'Vyra Admin',
      password_hash: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Admin user created successfully:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
