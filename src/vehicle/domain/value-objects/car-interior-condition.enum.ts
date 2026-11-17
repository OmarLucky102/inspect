export enum CarInteriorCondition {
  FACTORY_PAINT = 'FACTORY_PAINT',
  INTERNAL_REPAINT = 'INTERNAL_REPAINT',
  PARTIAL_REPAINT = 'PARTIAL_REPAINT',
}

export const CAR_INTERIOR_CONDITIONS = [
  {
    code: CarInteriorCondition.FACTORY_PAINT,
    name: 'Factory Paint',
    nameAr: 'فابريكا دواخل (دهان المصنع الأصلي)',
  },
  {
    code: CarInteriorCondition.INTERNAL_REPAINT,
    name: 'Internal Repaint',
    nameAr: 'رش دواخل (إعادة دهان كامل)',
  },
  {
    code: CarInteriorCondition.PARTIAL_REPAINT,
    name: 'Partial Repaint',
    nameAr: 'رش أجزاء داخلية (مسطحات محددة)',
  },
] as const;

export const VALID_CAR_INTERIOR_CODES = Object.values(CarInteriorCondition);
