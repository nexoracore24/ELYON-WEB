import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import * as authRepository from "../repositories/auth.repository";
import { can, type AuthorizableUser } from "@/core/permissions/can";
import type { Action } from "@/core/permissions/policies";
import type { AuthenticatedSession } from "../types";

/**
 * Resuelve la sesión actual (usuario de Supabase Auth + perfil de
 * negocio). `cache()` evita repetir la query si varios services la
 * piden dentro de la misma request.
 *
 * Devuelve `null` si no hay sesión o si el perfil no existe/está
 * inactivo — a este nivel no se decide qué hacer con eso, eso es
 * responsabilidad de quien llama (`requireSession`, o cada módulo).
 */
export const getCurrentSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const user = await authRepository.getAuthUser();
  if (!user) return null;

  const profile = await authRepository.findProfileByUserId(user.id);
  if (!profile || !profile.isActive) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
  };
});

/**
 * Para usar en Server Components / Server Actions de rutas protegidas:
 * garantiza que hay sesión o corta con un redirect a /login.
 *
 * Este es el único lugar de la app donde se decide "sin sesión -> login".
 * Todo `page.tsx` o `layout.tsx` del dashboard debe llamar esto al
 * principio en vez de reimplementar la comprobación.
 */
export async function requireSession(): Promise<AuthenticatedSession> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Azúcar sintáctico para exigir sesión + permiso puntual en un solo paso.
 * Internamente sigue pasando por `can()`, nunca compara `role` a mano.
 */
export async function requireSessionWithPermission(
  action: Action,
  resource?: { ownerId?: string; businessId?: string }
): Promise<AuthenticatedSession> {
  const session = await requireSession();
  const authorizableUser: AuthorizableUser = {
    id: session.profile.id,
    role: session.profile.role,
    businessId: session.profile.businessId,
  };

  if (!can(authorizableUser, action, resource)) {
    redirect("/no-autorizado");
  }

  return session;
}
