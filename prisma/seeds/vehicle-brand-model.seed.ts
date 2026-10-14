import type { PrismaClient } from '@prisma/client';

export const POPULAR_VEHICLE_BRANDS: Array<{
  name: string;
  code: string;
  models: string[];
}> = [
  {
    name: 'Toyota',
    code: 'TOYOTA',
    models: ['Corolla', 'Yaris', 'Fortuner', 'Land Cruiser', 'Camry', 'RAV4', 'Hilux', 'C-HR'],
  },
  {
    name: 'Hyundai',
    code: 'HYUNDAI',
    models: ['Elantra', 'Accent', 'Tucson', 'Creta', 'Bayon', 'I10', 'Sonata', 'Santa Fe'],
  },
  {
    name: 'Nissan',
    code: 'NISSAN',
    models: ['Sunny', 'Sentra', 'Qashqai', 'Juke', 'X-Trail', 'Patrol'],
  },
  {
    name: 'Kia',
    code: 'KIA',
    models: ['Cerato', 'Sportage', 'Rio', 'Picanto', 'Seltos', 'Sorento', 'Carnival'],
  },
  {
    name: 'Mercedes-Benz',
    code: 'MERCEDES',
    models: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'A-Class', 'CLA', 'GLA'],
  },
  {
    name: 'BMW',
    code: 'BMW',
    models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', '4 Series'],
  },
  {
    name: 'MG',
    code: 'MG',
    models: ['MG 5', 'MG 6', 'MG ZS', 'MG RX5', 'MG HS', 'MG ONE'],
  },
  {
    name: 'Chevrolet',
    code: 'CHEVROLET',
    models: ['Optra', 'Aveo', 'Cruze', 'Captiva', 'Equinox', 'Tahoe', 'Lanos'],
  },
  {
    name: 'Chery',
    code: 'CHERY',
    models: ['Arrizo 5', 'Tiggo 3', 'Tiggo 7', 'Tiggo 8', 'Tiggo 4 Pro'],
  },
  {
    name: 'Renault',
    code: 'RENAULT',
    models: ['Logan', 'Megane', 'Duster', 'Kadjar', 'Stepway', 'Sandero', 'Captur'],
  },
];

export async function seedVehicleBrandsAndModels(prisma: PrismaClient): Promise<void> {
  console.log('\nSeeding vehicle brands and models...');
  for (const b of POPULAR_VEHICLE_BRANDS) {
    const brand = await prisma.vehicleBrand.upsert({
      where: { code: b.code },
      update: { name: b.name },
      create: { name: b.name, code: b.code },
    });

    for (const modelName of b.models) {
      await prisma.vehicleModel.upsert({
        where: {
          brandId_name: {
            brandId: brand.id,
            name: modelName,
          },
        },
        update: {},
        create: {
          brandId: brand.id,
          name: modelName,
        },
      });
    }
  }
  console.log('Vehicle brands and models seeded successfully!');
}
