import type { PrismaClient } from '@prisma/client';

/** Vehicle categories — `code` is the unique key. Arabic verified per entry. */
export const VEHICLE_CATEGORIES: Array<{
  code: string;
  name: string;
  nameAr: string;
}> = [
  { code: 'SEDAN', name: 'Sedan', nameAr: 'سيدان' },
  { code: 'HATCHBACK', name: 'Hatchback', nameAr: 'هاتشباك' },
  { code: 'SUV', name: 'SUV', nameAr: 'دفع رباعي' },
  { code: 'COUPE', name: 'Coupe', nameAr: 'كوبيه' },
  { code: 'PICKUP', name: 'Pickup', nameAr: 'بيك أب' },
  { code: 'VAN', name: 'Van', nameAr: 'فان' },
  { code: 'MICROBUS', name: 'Microbus', nameAr: 'ميكروباص' },
  { code: 'BUS', name: 'Bus', nameAr: 'أتوبيس' },
  { code: 'TRUCK', name: 'Truck', nameAr: 'شاحنة' },
  { code: 'MOTORCYCLE', name: 'Motorcycle', nameAr: 'موتوسيكل' },
];

/** Idempotent seed — safe to run multiple times (upsert by unique `code`). */
export async function seedVehicleCategories(
  prisma: PrismaClient,
): Promise<void> {
  console.log(`\nSeeding ${VEHICLE_CATEGORIES.length} vehicle categories...`);

  for (const c of VEHICLE_CATEGORIES) {
    await prisma.vehicleCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, nameAr: c.nameAr, isActive: true },
      create: {
        code: c.code,
        name: c.name,
        nameAr: c.nameAr,
        isActive: true,
      },
    });
  }

  console.log('Vehicle categories seeded successfully!');
}
