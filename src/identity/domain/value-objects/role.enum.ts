export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  MANAGER = 'MANAGER',
  REVIEWER = 'REVIEWER',
  USER = 'USER',
  VIEWER = 'VIEWER',
  REPRESENTATIVE = 'REPRESENTATIVE',
}

const ROLE_VALUES: readonly string[] = Object.values(Role);

/**
 * Narrows an untrusted value (e.g. a JWT claim) to a `Role`.
 *
 * JWT payloads are attacker-influenced input, so the raw `role` claim must be
 * checked against the enum before it is trusted for authorization decisions.
 */
export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLE_VALUES.includes(value);
}
