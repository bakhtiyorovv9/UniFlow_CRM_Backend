import { PrismaClient } from '../../../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE;
  if (!email || !password || !phone) {
    throw new Error(
      '.env faylida ADMIN_EMAIL, ADMIN_PASSWORD va ADMIN_PHONE berilishi kerak',
    );
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existing) {
      console.log(
        `SUPERADMIN allaqachon mavjud: ${existing.email} (${existing.phone})`,
      );
      return;
    }

    const created = await prisma.user.create({
      data: {
        first_name: 'Super',
        last_name: 'Admin',
        email,
        password: await bcrypt.hash(password, 10),
        role: 'SUPERADMIN',
        status: 'active',
        phone,
        address: 'Tashkent',
      },
    });
    console.log(`SUPERADMIN yaratildi: ${created.email}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
