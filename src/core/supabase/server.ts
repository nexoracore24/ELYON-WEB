import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase para Server Components y Server Actions.
 *
 * Usa el token de sesión del usuario autenticado -> las queries
 * respetan RLS como ese usuario. Este es el cliente que deben usar
 * los `repositories/` de cada módulo en el 99% de los casos.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Se llama desde un Server Component sin permiso de escritura.
            // El middleware ya se encarga de refrescar la cookie en ese caso.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ver nota arriba.
          }
        },
      },
    }
  );
}
