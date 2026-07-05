/**
 * Mi día (profesional) — marcador temporal de la Entrega 1B.
 * El contenido real llega en el Módulo 2.
 */
import { createClient } from "@/lib/supabase/server";

export default async function MiDiaPage() {
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
        <span className="placeholder-badge">MI DÍA · PROFESIONAL</span>
        <h1>Hola, {profile?.full_name ?? "Javi"}</h1>
        <p>Has iniciado sesión correctamente como profesional.</p>
        <p className="placeholder-note">
          Tu agenda del día llegará en el Módulo 2. El acceso por rol ya
          funciona: estás viendo la vista de profesional, no la de admin.
        </p>
      </div>
    </main>
  );
}
