import type { Role } from "@/core/permissions/roles";

/**
 * Perfil de aplicación (tabla `profiles`), el usuario "de negocio",
 * distinto del usuario de `auth.users` de Supabase.
 */
export type Profile = {
  id: string;
  businessId: string;
  role: Role;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
};

/**
 * Sesión resuelta: usuario de Supabase Auth + su perfil de negocio.
 * Esto es lo que consumen los `services` de cualquier módulo para
 * saber "quién está haciendo esta acción y con qué permisos".
 */
export type AuthenticatedSession = {
  userId: string;
  email: string | null;
  profile: Profile;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult =
  | { success: true }
  | { success: false; error: string };
