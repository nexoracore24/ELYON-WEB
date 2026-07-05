"use server";

/**
 * ELYON · Acción de servidor para iniciar sesión.
 * Autentica contra Supabase Auth y redirige según el rol del perfil.
 * La sesión se guarda en cookies (persistencia) mediante el cliente servidor.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { landingPathForRole, type UserRole } from "@/lib/permissions";

export type LoginState = { error: string | null };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Escribe tu correo y tu contraseña." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Correo o contraseña incorrectos." };
  }

  // Leer el rol del perfil para redirigir al sitio correcto.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile?.role as UserRole) ?? "staff";
  redirect(landingPathForRole(role));
}
