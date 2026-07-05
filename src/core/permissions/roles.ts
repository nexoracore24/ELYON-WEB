/**
 * Roles del sistema. 'manager' se define desde ya para no requerir
 * una migración de esquema/tipo cuando se active: hoy simplemente
 * no se asigna a ningún perfil.
 */
export const ROLES = ["admin", "staff", "manager"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
