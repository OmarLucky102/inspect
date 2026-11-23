export enum Cylinders {
  ONE = '1',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
}

export const CYLINDER_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
] as const;

export const VALID_CYLINDERS = Object.values(Cylinders);

// Backward-compatibility aliases
export { Cylinders as CalendarNumber };
export { CYLINDER_OPTIONS as CALENDAR_NUMBERS };
export { VALID_CYLINDERS as VALID_CALENDAR_NUMBERS };
