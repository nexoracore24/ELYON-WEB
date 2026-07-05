"use server";

/**
 * ELYON · Establecer nueva contraseña.
 * El usuario llega aquí desde el enlace del correo (ya autenticado por
 * el token del enlace). Solo actualiza la contraseña.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UpdateState = { error: string | null };

export async function updatePasswordAction(
  _prev: UpdateState,
  formData: FormData
): Promise<UpdateState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "El enlace ha caducado o no es válido. Solicita uno nuevo." };
  }

  redirect("/login");
}
