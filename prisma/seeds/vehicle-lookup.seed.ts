import type { PrismaClient } from '@prisma/client';

/** Transmission types used in Egypt — English name is the unique key. */
export const TRANSMISSION_TYPES: Array<{ name: string; nameAr: string }> = [
  { name: 'Automatic', nameAr: 'أوتوماتيك' },
  { name: 'Manual', nameAr: 'عادي / مانيوال' },
];

/** Fuel types used in Egypt — English name is the unique key. */
export const FUEL_TYPES: Array<{ name: string; nameAr: string }> = [
  { name: 'Petrol', nameAr: 'بنزين' },
  { name: 'Diesel', nameAr: 'سولار' },
  { name: 'Natural Gas', nameAr: 'غاز طبيعي' },
  { name: 'Electric', nameAr: 'كهرباء' },
  { name: 'Hybrid', nameAr: 'هايبرد' },
];

/** Side Mirror specifications — code is the unique key. */
export const SIDE_MIRROR_TYPES: Array<{
  code: string;
  name: string;
  nameAr: string;
}> = [
  { code: 'MANUAL', name: 'Manual', nameAr: 'عادي' },
  { code: 'ELECTRIC', name: 'Electric', nameAr: 'كهرباء' },
];

/** Sunroof specifications — code is the unique key. */
export const SUNROOF_TYPES: Array<{
  code: string;
  name: string;
  nameAr: string;
}> = [
  { code: 'NO_SUNROOF', name: 'No Sunroof', nameAr: 'بدون فتحة سقف' },
  { code: 'MANUAL', name: 'Manual Sunroof', nameAr: 'فتحة سقف يدوية' },
  { code: 'ELECTRIC', name: 'Electric Sunroof', nameAr: 'فتحة سقف كهربائية' },
  {
    code: 'PANORAMIC',
    name: 'Panoramic Sunroof',
    nameAr: 'فتحة سقف بانورامية',
  },
  {
    code: 'PANORAMIC_MOONROOF',
    name: 'Panoramic Moonroof',
    nameAr: 'فتحة سقف بانورامية زجاجية',
  },
  { code: 'POP_UP', name: 'Pop-up Sunroof', nameAr: 'فتحة سقف قابلة للرفع' },
  { code: 'SLIDING', name: 'Sliding Sunroof', nameAr: 'فتحة سقف منزلقة' },
  {
    code: 'TILT_AND_SLIDE',
    name: 'Tilt-and-Slide Sunroof',
    nameAr: 'فتحة سقف قابلة للإمالة والانزلاق',
  },
];

/** Idempotent seed — safe to run multiple times. */
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

  console.log('Seeding side mirror types...');
  for (const m of SIDE_MIRROR_TYPES) {
    await (prisma as any).sideMirrorType.upsert({
      where: { code: m.code },
      update: { name: m.name, nameAr: m.nameAr },
      create: { code: m.code, name: m.name, nameAr: m.nameAr },
    });
  }

  console.log('Seeding sunroof types...');
  for (const s of SUNROOF_TYPES) {
    await (prisma as any).sunroofType.upsert({
      where: { code: s.code },
      update: { name: s.name, nameAr: s.nameAr },
      create: { code: s.code, name: s.name, nameAr: s.nameAr },
    });
  }

  console.log('Vehicle lookups seeded successfully!');
}
