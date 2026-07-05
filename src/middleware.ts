import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/core/supabase/middleware";

const PUBLIC_ROUTES = ["/login"];

/**
 * El middleware SOLO resuelve una pregunta: ¿hay sesión válida o no?
 *
 * Deliberadamente NO consulta `profiles` aquí (rol, business_id).
 * Añadir una query a la base de datos en cada request de edge middleware
 * agrega latencia global a toda la app por una comprobación que solo
 * importa en las rutas del dashboard. La autorización fina por rol
 * (admin vs staff) se resuelve en el layout/página del dashboard vía
 * `can()`, que sí corre en el server pero solo donde hace falta.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Excluye assets estáticos y de Next internals para no
     * ejecutar el middleware innecesariamente en cada uno.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
