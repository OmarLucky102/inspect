import type { PrismaClient } from '@prisma/client';

export const SYSTEM_MANDATORY_CHECKLIST_CODE = 'SYSTEM_MANDATORY';

export const MANDATORY_CHECKLIST_ITEMS = [
  {
    code: 'CHASSIS_NUMBER',
    label: 'Chassis Number',
    description: 'Vehicle Chassis Number (VIN)',
    isRequired: true,
    isMandatory: true,
    weight: 1,
    inputType: 'TEXT',
    sortOrder: 1,
  },
  {
    code: 'MILEAGE',
    label: 'Mileage',
    description: 'Current vehicle mileage',
    isRequired: true,
    isMandatory: true,
    weight: 1,
    inputType: 'NUMBER',
    sortOrder: 2,
  },
  {
    code: 'OTHER',
    label: 'Other',
    description: 'Any other relevant information',
    isRequired: true,
    isMandatory: true,
    weight: 1,
    inputType: 'TEXT',
    sortOrder: 3,
  },
];

export async function seedMandatoryChecklistItems(
  prisma: PrismaClient,
): Promise<void> {
  console.log('\nSeeding mandatory checklist items...');

  // Ensure the system mandatory checklist template exists
  const checklist = await prisma.checklist.upsert({
    where: { code: SYSTEM_MANDATORY_CHECKLIST_CODE },
    update: {
      name: 'Mandatory System Items',
    },
    create: {
      code: SYSTEM_MANDATORY_CHECKLIST_CODE,
      name: 'Mandatory System Items',
      version: 1,
    },
  });

  // Upsert the mandatory items attached to this checklist
  for (const item of MANDATORY_CHECKLIST_ITEMS) {
    await prisma.checklistItem.upsert({
      where: {
        checklistId_code: {
          checklistId: checklist.id,
          code: item.code,
        },
      },
      update: {
        label: item.label,
        description: item.description,
        isRequired: item.isRequired,
        isMandatory: item.isMandatory,
        weight: item.weight,
        inputType: item.inputType,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        checklistId: checklist.id,
        code: item.code,
        label: item.label,
        description: item.description,
        isRequired: item.isRequired,
        isMandatory: item.isMandatory,
        weight: item.weight,
        inputType: item.inputType,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  console.log('Mandatory checklist items seeded successfully!');
}
