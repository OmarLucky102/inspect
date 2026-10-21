/**
 * Standard vehicle color hex mapping and helper
 */
export const VEHICLE_COLOR_HEX_MAP: Record<string, string> = {
  white: '#FFFFFF',
  black: '#111827',
  silver: '#C0C0C0',
  gray: '#6B7280',
  grey: '#6B7280',
  red: '#DC2626',
  maroon: '#800000',
  blue: '#2563EB',
  navy: '#1E3A8A',
  green: '#16A34A',
  beige: '#F5F5DC',
  gold: '#D97706',
  brown: '#78350F',
  champagne: '#F7E7CE',
  yellow: '#EAB308',
  orange: '#EA580C',
  pink: '#EC4899',
  purple: '#9333EA',
  bronze: '#CD7F32',
  cyan: '#06B6D4',
  teal: '#0D9488',
  burgundy: '#800020',
};

/**
 * Returns hex color string for a vehicle color, falling back to name mapping or a neutral slate dot
 */
export function getVehicleColorHex(
  name?: string | null,
  hex?: string | null,
): string {
  if (hex && hex.trim()) return hex.trim();
  if (!name) return '#94A3B8';
  const key = name.toLowerCase().trim();
  return VEHICLE_COLOR_HEX_MAP[key] || '#94A3B8';
}
