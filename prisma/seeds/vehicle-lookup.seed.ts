import type { PrismaClient } from '@prisma/client';

/** Transmission types used in Egypt — English name is the unique key. */
export const TRANSMISSION_TYPES: Array<{ name: string; nameAr: string }> = [
  { name: 'Manual', nameAr: 'مانيوال' },
  { name: 'Automatic', nameAr: 'أوتوماتيك' },
];

/** Fuel types used in Egypt — English name is the unique key. */
export const FUEL_TYPES: Array<{ name: string; nameAr: string }> = [
  { name: 'Petrol', nameAr: 'بنزين' },
  { name: 'Diesel', nameAr: 'سولار' },
  { name: 'Natural Gas', nameAr: 'غاز طبيعي' },
  { name: 'Electric', nameAr: 'كهرباء' },
  { name: 'Hybrid', nameAr: 'هايبرد' },
];

/** Idempotent seed — safe to run multiple times (upsert by unique `name`). */
export async function seedVehicleLookups(prisma: PrismaClient): Promise<void> {
  console.log('\nSeeding transmission types...');
  for (const t of TRANSMISSION_TYPES) {
    await prisma.transmissionType.upsert({
      where: { name: t.name },
      update: { nameAr: t.nameAr },
      create: { name: t.name, nameAr: t.nameAr },
    });
  }

  console.log('Seeding fuel types...');
  for (const f of FUEL_TYPES) {
    await prisma.fuelType.upsert({
      where: { name: f.name },
      update: { nameAr: f.nameAr },
      create: { name: f.name, nameAr: f.nameAr },
    });
  }

  console.log('Vehicle lookups seeded successfully!');
}
