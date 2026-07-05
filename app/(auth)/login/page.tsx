/**
 * ELYON · Página de login — Módulo 1 · Entrega 1A.
 * Pantalla premium con estética ELYON. Si ya hay sesión, redirige
 * al sitio del usuario según su rol.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { landingPathForRole, type UserRole } from "@/lib/permissions";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Si ya está autenticado, no mostrar el login: llevar a su zona.
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    const role = (profile?.role as UserRole) ?? "staff";
    redirect(landingPathForRole(role));
  }

  return (
    <main className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="login-logo-img"
            src="/assets/images/elyon-logo.png"
            alt="ELYON"
            width={1377}
            height={240}
          />
          <p className="login-tagline">Gestiona tu negocio en un solo lugar</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
