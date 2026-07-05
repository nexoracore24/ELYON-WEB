/**
 * ELYON · permissions.ts
 * Sistema de permisos CENTRALIZADO (única fuente de verdad de la interfaz).
 * La seguridad dura vive en RLS (base de datos); esto gobierna la experiencia.
 * Los Módulos 1C+ leen de aquí qué navegación y acciones ve cada rol.
 */

export type UserRole = "admin" | "staff";

export const ROLES: Record<UserRole, { label: string }> = {
  admin: { label: "Administrador" },
  staff: { label: "Profesional" },
};

/** Navegación visible por rol (se consumirá en el shell, entrega 1C). */
export const NAVIGATION: Record<UserRole, { href: string; label: string }[]> = {
  admin: [
    { href: "/dashboard", label: "Panel" },
    { href: "/agenda", label: "Agenda" },
    { href: "/clientes", label: "Clientes" },
    { href: "/ajustes", label: "Ajustes" },
  ],
  staff: [
    { href: "/mi-dia", label: "Mi día" },
    { href: "/agenda", label: "Agenda" },
    { href: "/clientes", label: "Clientes" },
  ],
};

/** Ruta de aterrizaje tras iniciar sesión, según rol. */
export function landingPathForRole(role: UserRole): string {
  return role === "admin" ? "/dashboard" : "/mi-dia";
}
