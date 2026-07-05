import { policies, type Action } from "./policies";
import type { Role } from "./roles";

export type AuthorizableUser = {
  id: string;
  role: Role;
  businessId: string;
};

type Resource = {
  /** id del dueño del recurso, para reglas del tipo "solo lo propio" */
  ownerId?: string;
  /** business al que pertenece el recurso, para aislamiento entre tenants */
  businessId?: string;
};

/**
 * Punto ÚNICO de decisión de autorización en toda la aplicación.
 *
 * Convención de proyecto (documentada en docs/adr): está PROHIBIDO
 * escribir `if (user.role === 'admin')` (o similar) fuera de
 * `core/permissions`. Toda comprobación de permisos, en cualquier
 * capa (services, actions, componentes server), pasa por `can()`.
 *
 * Esto permite:
 *  - Cambiar reglas de negocio en un solo lugar.
 *  - Auditar quién puede hacer qué sin rastrear el código.
 *  - Evitar que la lógica de permisos se filtre a componentes React.
 */
export function can(user: AuthorizableUser, action: Action, resource?: Resource): boolean {
  const allowedActions = policies[user.role];
  if (!allowedActions.includes(action)) return false;

  // Aislamiento multi-tenant: si el recurso declara business, tiene
  // que coincidir con el del usuario, sin excepción, sin importar el rol.
  if (resource?.businessId && resource.businessId !== user.businessId) {
    return false;
  }

  // Reglas "solo lo propio" (acciones con sufijo _own se reservan para
  // cuando existan en el catálogo; por ahora la única acción de ese
  // tipo es profile:edit_own).
  if (action === "profile:edit_own" && resource?.ownerId) {
    return resource.ownerId === user.id;
  }

  return true;
}

/**
 * Variante que lanza si no está permitido. Útil en Server Actions
 * para cortar la ejecución de forma explícita en la primera línea.
 */
export function assertCan(user: AuthorizableUser, action: Action, resource?: Resource): void {
  if (!can(user, action, resource)) {
    throw new PermissionError(action);
  }
}

export class PermissionError extends Error {
  constructor(action: Action) {
    super(`No autorizado para realizar la acción: ${action}`);
    this.name = "PermissionError";
  }
}
