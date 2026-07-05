import type { Role } from "./roles";

/**
 * Catálogo central de acciones autorizables en el sistema.
 *
 * Se amplía a medida que se implementan nuevos módulos. Por ahora
 * solo se listan las acciones que el módulo de autenticación necesita
 * conocer (gestión de empleados/perfiles y configuración del negocio).
 * Los módulos futuros (agenda, reservas, clientes...) añadirán las
 * suyas aquí mismo, nunca como checks sueltos en otros archivos.
 */
export type Action =
  | "employees:invite"
  | "employees:manage"
  | "employees:view_all"
  | "business:configure"
  | "profile:edit_own";

/**
 * Matriz declarativa rol -> acciones permitidas.
 *
 * 'manager' tiene una asignación provisional razonable (sin gestión
 * de empleados ni configuración del negocio) para que el tipo no
 * quede vacío. Se ajusta cuando el rol se active formalmente.
 */
export const policies: Record<Role, Action[]> = {
  admin: [
    "employees:invite",
    "employees:manage",
    "employees:view_all",
    "business:configure",
    "profile:edit_own",
  ],
  manager: ["employees:view_all", "profile:edit_own"],
  staff: ["profile:edit_own"],
};
