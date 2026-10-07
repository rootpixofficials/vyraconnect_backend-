import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'vyraconnectadmin';
  const password = 'vyraconnect@123';
  
  // Hash the password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  // Upsert the user (creates if doesn't exist, updates if it does)
  const user = await prisma.user.upsert({
    where: { username: username },
    update: {
      password_hash: hashedPassword,
      name: 'Vyra Admin',
      role: 'SUPER_ADMIN',
    },
    create: {
      username: username,
      name: 'Vyra Admin',
      password_hash: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Users table seeded. Admin created:', user.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
