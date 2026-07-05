import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso EXCLUSIVO en Client Components.
 *
 * Regla del proyecto: este cliente nunca debe importarse desde
 * `modules/*​/components`. Los componentes React no hablan con Supabase
 * directamente — piden datos/acciones a `services` a través de
 * Server Actions. Este cliente existe únicamente para casos legítimos
 * de estado de sesión en el cliente (ej. escuchar onAuthStateChange).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
