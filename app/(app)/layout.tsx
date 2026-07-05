/**
 * ELYON · Layout de la zona autenticada.
 * Envuelve todas las páginas privadas con el App Shell, inyectando
 * el rol y el nombre del usuario. Si no hay sesión o perfil, al login.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/permissions";
import AppShell from "./_shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell role={profile.role as UserRole} fullName={profile.full_name}>
      {children}
    </AppShell>
  );
}
