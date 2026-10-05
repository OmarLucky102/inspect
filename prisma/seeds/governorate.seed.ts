import type { PrismaClient } from '@prisma/client';

/**
 * Governorate reference data — converted from the phpMyAdmin JSON export.
 * `code` preserves the original export `id` (zero-padded) so it stays
 * unique and stable for idempotent upserts.
 */
export const GOVERNORATES: Array<{
  code: string;
  name: string;
  nameAr: string;
}> = [
  { code: '01', name: 'Cairo', nameAr: 'القاهرة' },
  { code: '02', name: 'Giza', nameAr: 'الجيزة' },
  { code: '03', name: 'Alexandria', nameAr: 'الأسكندرية' },
  { code: '04', name: 'Dakahlia', nameAr: 'الدقهلية' },
  { code: '05', name: 'Red Sea', nameAr: 'البحر الأحمر' },
  { code: '06', name: 'Beheira', nameAr: 'البحيرة' },
  { code: '07', name: 'Fayoum', nameAr: 'الفيوم' },
  { code: '08', name: 'Gharbiya', nameAr: 'الغربية' },
  { code: '09', name: 'Ismailia', nameAr: 'الإسماعلية' },
  { code: '10', name: 'Menofia', nameAr: 'المنوفية' },
  { code: '11', name: 'Minya', nameAr: 'المنيا' },
  { code: '12', name: 'Qaliubiya', nameAr: 'القليوبية' },
  { code: '13', name: 'New Valley', nameAr: 'الوادي الجديد' },
  { code: '14', name: 'Suez', nameAr: 'السويس' },
  { code: '15', name: 'Aswan', nameAr: 'اسوان' },
  { code: '16', name: 'Assiut', nameAr: 'اسيوط' },
  { code: '17', name: 'Beni Suef', nameAr: 'بني سويف' },
  { code: '18', name: 'Port Said', nameAr: 'بورسعيد' },
  { code: '19', name: 'Damietta', nameAr: 'دمياط' },
  { code: '20', name: 'Sharkia', nameAr: 'الشرقية' },
  { code: '21', name: 'South Sinai', nameAr: 'جنوب سيناء' },
  { code: '22', name: 'Kafr Al Sheikh', nameAr: 'كفر الشيخ' },
  { code: '23', name: 'Matrouh', nameAr: 'مطروح' },
  { code: '24', name: 'Luxor', nameAr: 'الأقصر' },
  { code: '25', name: 'Qena', nameAr: 'قنا' },
  { code: '26', name: 'North Sinai', nameAr: 'شمال سيناء' },
  { code: '27', name: 'Sohag', nameAr: 'سوهاج' },
];

/**
 * Idempotent seed — safe to run multiple times.
 * Matches on the unique `code`, so re-runs only update names.
 */
export async function seedGovernorates(prisma: PrismaClient): Promise<void> {
  console.log(`\nSeeding ${GOVERNORATES.length} governorates...`);

  for (const g of GOVERNORATES) {
    await prisma.governorate.upsert({
      where: { code: g.code },
      update: { name: g.name, nameAr: g.nameAr, isActive: true },
      create: { code: g.code, name: g.name, nameAr: g.nameAr, isActive: true },
    });
  }

  console.log('Governorates seeded successfully!');
}
