/**
 * ELYON · Middleware raíz.
 * Se ejecuta en cada petición para refrescar la sesión y proteger rutas.
 * Excluye archivos estáticos e imágenes por rendimiento.
 */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
