import "server-only";
import { z } from "zod";
import * as authRepository from "../repositories/auth.repository";
import { logAuditEvent } from "@/core/audit/log";
import { getCurrentBusiness } from "@/core/tenant/get-current-business";
import type { LoginInput, LoginResult } from "../types";

const loginSchema = z.object({
  email: z.string().trim().min(1, "El email es obligatorio").email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

/**
 * Caso de uso: iniciar sesión.
 *
 * Responsabilidades de esta capa (y solo de esta capa):
 *  - Validar el input.
 *  - Orquestar Supabase Auth + verificación de perfil activo.
 *  - Auditar el intento (éxito o fallo).
 *
 * No sabe nada de cookies, de Server Actions ni de React: eso es
 * responsabilidad de `modules/auth/actions`.
 */
export async function loginWithPassword(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { email, password } = parsed.data;
  const business = await getCurrentBusiness();

  const { data, error } = await authRepository.signInWithPassword(email, password);

  if (error || !data.user) {
    await logAuditEvent({
      businessId: business.id,
      actorId: null,
      actorType: "user",
      action: "auth.login_failed",
      entityType: "auth",
      entityId: email,
      metadata: { reason: error?.message ?? "unknown" },
    });
    return { success: false, error: "Credenciales incorrectas." };
  }

  const profile = await authRepository.findProfileByUserId(data.user.id);

  if (!profile) {
    await authRepository.signOut();
    await logAuditEvent({
      businessId: business.id,
      actorId: data.user.id,
      actorType: "user",
      action: "auth.login_failed",
      entityType: "auth",
      entityId: data.user.id,
      metadata: { reason: "profile_not_found" },
    });
    return { success: false, error: "Este usuario no tiene un perfil asociado en el sistema." };
  }

  if (!profile.isActive) {
    await authRepository.signOut();
    await logAuditEvent({
      businessId: profile.businessId,
      actorId: profile.id,
      actorType: "user",
      action: "auth.login_failed",
      entityType: "auth",
      entityId: profile.id,
      metadata: { reason: "profile_inactive" },
    });
    return { success: false, error: "Este usuario está desactivado. Contacta al administrador." };
  }

  if (profile.businessId !== business.id) {
    await authRepository.signOut();
    await logAuditEvent({
      businessId: business.id,
      actorId: profile.id,
      actorType: "user",
      action: "auth.login_failed",
      entityType: "auth",
      entityId: profile.id,
      metadata: { reason: "business_mismatch" },
    });
    return { success: false, error: "Este usuario no pertenece a este negocio." };
  }

  await logAuditEvent({
    businessId: profile.businessId,
    actorId: profile.id,
    actorType: "user",
    action: "auth.login_succeeded",
    entityType: "auth",
    entityId: profile.id,
  });

  return { success: true };
}

/**
 * Caso de uso: cerrar sesión.
 */
export async function logout(): Promise<void> {
  const user = await authRepository.getAuthUser();

  if (user) {
    const profile = await authRepository.findProfileByUserId(user.id);
    if (profile) {
      await logAuditEvent({
        businessId: profile.businessId,
        actorId: profile.id,
        actorType: "user",
        action: "auth.logout",
        entityType: "auth",
        entityId: profile.id,
      });
    }
  }

  await authRepository.signOut();
}
