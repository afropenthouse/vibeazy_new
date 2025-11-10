const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Administrator';

    if (!email || !password) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment to create admin');
      process.exit(1);
    }

    // If ADMIN_PASSWORD looks like a bcrypt hash, use as-is, otherwise hash it
    if (!password.startsWith('$2a$') && !password.startsWith('$2b$') && !password.startsWith('$2y$')) {
      password = await bcrypt.hash(password, 10);
    }

    const admin = await prisma.admin.upsert({
      where: { email },
      update: { passwordHash: password, name },
      create: { email, passwordHash: password, name },
    });

    console.log('Admin created/updated:', admin.email);
  } catch (e) {
    console.error('Error creating admin:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
