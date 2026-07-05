/**
 * ELYON · types.ts
 * Tipos del dominio, alineados con el esquema de la base de datos.
 */
import type { UserRole } from "./permissions";

export type Profile = {
  id: string;
  business_id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  color: string;
  is_active: boolean;
};
