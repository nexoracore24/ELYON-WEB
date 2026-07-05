"use server";

/**
 * ELYON · Solicitar recuperación de contraseña.
 * Envía un correo con un enlace para restablecer la contraseña.
 * Por seguridad, la respuesta es siempre la misma exista o no el correo
 * (no revelamos qué correos están registrados).
 */
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type RecoverState = { done: boolean; error: string | null };

export async function recoverAction(
  _prev: RecoverState,
  formData: FormData
): Promise<RecoverState> {
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return { done: false, error: "Escribe tu correo electrónico." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/actualizar-clave`,
  });

  // Respuesta neutra siempre (no revelar si el correo existe).
  return { done: true, error: null };
}
