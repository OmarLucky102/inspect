import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedGovernorates } from './seeds/governorate.seed';
import { seedCities } from './seeds/city.seed';
import { seedVehicleTrims } from './seeds/vehicle-trim.seed';
import { seedVehicleLookups } from './seeds/vehicle-lookup.seed';
import { seedVehicleColors } from './seeds/vehicle-color.seed';
import { seedVehicleCategories } from './seeds/vehicle-category.seed';

/**
 * Super Admin Seed Script
 *
 * Usage:  pnpm prisma db seed
 *
 * Credentials are read from environment variables.
 * Required env vars:
 *   SUPER_ADMIN_EMAIL       — e.g. superadmin@yourdomain.com
 *   SUPER_ADMIN_PASSWORD    — min 12 chars (enforced below)
 * Optional env vars:
 *   SUPER_ADMIN_FIRST_NAME  — defaults to "Super"
 *   SUPER_ADMIN_LAST_NAME   — defaults to "Admin"
 *   SUPER_ADMIN_PHONE       — required; the `phone` column is non-nullable in the schema.
 *
 * Connection:
 *   Prefers process.env.DATABASE_URL if set (keeps this script in sync with
 *   whatever your PrismaService uses in the app). Falls back to building a URL
 *   from discrete DB_* vars for convenience in local/dev setups.
 *
 * This script is idempotent — it uses upsert so it is safe to run multiple times.
 * If the super admin already exists, it will update their data.
 */

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'mydb';

  return `postgresql://${user}:${password}@${host}:${port}/${name}?schema=public`;
}

async function main() {
  const databaseUrl = resolveDatabaseUrl();
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME ?? 'Super';
    const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? 'Admin';
    const phone = process.env.SUPER_ADMIN_PHONE;

    if (!email || !password || !phone) {
      throw new Error(
        'SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, and SUPER_ADMIN_PHONE must all be set in your environment variables.',
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new Error(
        `SUPER_ADMIN_EMAIL "${email}" does not look like a valid email address.`,
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `SUPER_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      );
    }

    console.log(`\nSeeding Super Admin: ${email}`);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const superAdmin = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        role: Role.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
        phone,
      },
      create: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: Role.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        phone,
      },
    });

    console.log(`Super Admin seeded successfully!`);
    console.log(`   ID:    ${superAdmin.id}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role:  ${superAdmin.role}`);

    await seedGovernorates(prisma);
    await seedCities(prisma);
    await seedVehicleTrims(prisma);
    await seedVehicleLookups(prisma);
    await seedVehicleColors(prisma);
    await seedVehicleCategories(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
