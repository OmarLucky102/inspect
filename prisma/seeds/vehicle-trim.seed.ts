import type { PrismaClient } from '@prisma/client';

/** Vehicle trims (الفئة) — `code` is the unique key. Arabic verified per entry. */
export const VEHICLE_TRIMS: Array<{
  code: string;
  name: string;
  nameAr: string;
}> = [
  { code: 'STD', name: 'Standard', nameAr: 'ستاندر' },
  { code: 'FIRST', name: 'First Category', nameAr: 'الفئة الأولى' },
  { code: 'SECOND', name: 'Second Category', nameAr: 'الفئة الثانية' },
  { code: 'THIRD', name: 'Third Category', nameAr: 'الفئة الثالثة' },
  { code: 'FOURTH', name: 'Fourth Category', nameAr: 'الفئة الرابعة' },
  { code: 'FIFTH', name: 'Fifth Category', nameAr: 'الفئة الخامسة' },
  { code: 'FULL', name: 'Full Option', nameAr: 'فل أوبشن' },
  { code: 'HIGHLINE', name: 'Highline', nameAr: 'هاي لاين' },
  { code: 'SPORT', name: 'Sport', nameAr: 'سبورت' },
  { code: 'LUXURY', name: 'Luxury', nameAr: 'لكجري' },
];

/** Idempotent seed — safe to run multiple times (upsert by unique `code`). */
export async function seedVehicleTrims(prisma: PrismaClient): Promise<void> {
  console.log(`\nSeeding ${VEHICLE_TRIMS.length} vehicle trims...`);

  for (const t of VEHICLE_TRIMS) {
    await prisma.vehicleTrim.upsert({
      where: { code: t.code },
      update: { name: t.name, nameAr: t.nameAr, isActive: true },
      create: {
        code: t.code,
        name: t.name,
        nameAr: t.nameAr,
        isActive: true,
      },
    });
  }

  console.log('Vehicle trims seeded successfully!');
}
