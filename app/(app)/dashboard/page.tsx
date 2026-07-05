/**
 * Panel (admin) — marcador temporal de la Entrega 1B.
 * El contenido real llega en el Módulo 2. Aquí solo confirmamos que
 * la redirección por rol y el guardián funcionan.
 */
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user?.id ?? "")
    .single();

  return (
    <main className="placeholder-screen">
      <div className="placeholder-card">
        <span className="placeholder-badge">PANEL · ADMINISTRADOR</span>
        <h1>Hola, {profile?.full_name ?? "Roberto"}</h1>
        <p>Has iniciado sesión correctamente como administrador.</p>
        <p className="placeholder-note">
          El panel completo llegará en el Módulo 2. Los cimientos y el
          acceso ya funcionan.
        </p>
      </div>
    </main>
  );
}
