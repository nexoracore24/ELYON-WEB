import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase con SERVICE ROLE. Ignora RLS por completo.
 *
 * Uso restringido a:
 *  - Operaciones administrativas explícitas (ej. alta de un nuevo
 *    empleado, que requiere crear el usuario en auth.users).
 *  - Webhooks de sistemas externos sin sesión de usuario (n8n, WhatsApp).
 *
 * PROHIBIDO usar este cliente para servir datos a un usuario final.
 * Cualquier uso nuevo de este archivo debe poder justificarse en
 * revisión de código.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
