import type { PrismaClient } from '@prisma/client';

/** Base car-color palette — English name is the unique key. */
export const COLORS: Array<{ name: string; nameAr: string; hex: string }> = [
  { name: 'White', nameAr: 'أبيض', hex: '#FFFFFF' },
  { name: 'Black', nameAr: 'أسود', hex: '#000000' },
  { name: 'Silver', nameAr: 'فضي', hex: '#C0C0C0' },
  { name: 'Gray', nameAr: 'رمادي', hex: '#808080' },
  { name: 'Red', nameAr: 'أحمر', hex: '#FF0000' },
  { name: 'Maroon', nameAr: 'عنابي', hex: '#800000' },
  { name: 'Blue', nameAr: 'أزرق', hex: '#0000FF' },
  { name: 'Navy', nameAr: 'كحلي', hex: '#000080' },
  { name: 'Green', nameAr: 'أخضر', hex: '#008000' },
  { name: 'Beige', nameAr: 'بيج', hex: '#F5F5DC' },
  { name: 'Gold', nameAr: 'ذهبي', hex: '#FFD700' },
  { name: 'Brown', nameAr: 'بني', hex: '#964B00' },
  { name: 'Champagne', nameAr: 'شمبين', hex: '#F7E7CE' },
  { name: 'Pink', nameAr: 'وردي', hex: '#FFC0CB' },
];

/** Idempotent seed — safe to run multiple times (upsert by unique `name`). */
export async function seedVehicleColors(prisma: PrismaClient): Promise<void> {
  console.log(`\nSeeding ${COLORS.length} colors...`);

  for (const c of COLORS) {
    await prisma.color.upsert({
      where: { name: c.name },
      update: { nameAr: c.nameAr, hex: c.hex, isActive: true },
      create: { name: c.name, nameAr: c.nameAr, hex: c.hex, isActive: true },
    });
  }

  console.log('Colors seeded successfully!');
}
