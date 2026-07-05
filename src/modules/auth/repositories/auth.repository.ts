import "server-only";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { isRole } from "@/core/permissions/roles";
import type { Profile } from "../types";

/**
 * Capa de acceso a datos del módulo auth. Solo queries, sin reglas de
 * negocio ni decisiones: eso vive en `services/auth.service.ts`.
 */

export async function findProfileByUserId(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, business_id, role, full_name, phone, avatar_url, is_active")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  if (!isRole(data.role)) {
    throw new Error(`Rol desconocido en profiles: "${data.role}"`);
  }

  return {
    id: data.id,
    businessId: data.business_id,
    role: data.role,
    fullName: data.full_name,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    isActive: data.is_active,
  };
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  return supabase.auth.signOut();
}

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
