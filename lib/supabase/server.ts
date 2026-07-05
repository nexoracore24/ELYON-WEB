/**
 * Cliente de Supabase para el SERVIDOR (Server Components y middleware).
 * Gestiona la sesión mediante cookies según el patrón oficial de
 * @supabase/ssr para Next.js 15 (App Router).
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: la escritura de cookies
            // la gestionará el middleware de sesión (Módulo 1).
          }
        },
      },
    }
  );
}
