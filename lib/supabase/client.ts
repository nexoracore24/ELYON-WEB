/**
 * Cliente de Supabase para el NAVEGADOR.
 * Único punto de conexión desde componentes de cliente.
 * Usa las claves públicas; toda petición queda gobernada por RLS.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
