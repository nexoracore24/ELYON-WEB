"use server";

/**
 * ELYON · Acción de cerrar sesión.
 * Cierra la sesión en Supabase y devuelve al login.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
