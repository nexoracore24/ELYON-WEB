/**
 * ELYON · Capa de datos del Dashboard.
 * Único punto de acceso a datos para el panel. Los componentes nunca
 * consultan Supabase directamente; piden aquí (regla de organización).
 * Preparado para crecer: las métricas de 2B se añadirán como campos
 * de este mismo resumen, sin tocar la cabecera.
 */
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/permissions";

export type DashboardSummary = {
  fullName: string;
  role: UserRole;
  businessName: string;
};

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  // Perfil + negocio en una sola consulta con join.
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role, businesses(name)")
    .eq("id", auth.user.id)
    .single();

  if (error || !data) return null;

  // businesses puede venir como objeto o array según la relación; normalizamos.
  const business = Array.isArray(data.businesses)
    ? data.businesses[0]
    : data.businesses;

  return {
    fullName: data.full_name,
    role: data.role as UserRole,
    businessName: business?.name ?? "Tu negocio",
  };
}
