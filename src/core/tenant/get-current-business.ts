import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/core/supabase/server";

export type CurrentBusiness = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
};

/**
 * Resuelve el "negocio actual" para la request.
 *
 * v1: siempre devuelve el negocio de Roberto (único tenant), leído
 * por slug fijo desde env. Ningún otro módulo debe asumir esto — todos
 * consumen esta función, nunca hardcodean el slug o el id.
 *
 * Cuando exista más de un negocio, esta función es el ÚNICO lugar que
 * cambia: resolución por subdominio, por dominio propio, o por el
 * negocio activo del usuario autenticado. El resto de la app no se
 * entera del cambio.
 *
 * `cache()` de React evita resolver el negocio más de una vez por
 * request aunque varios services lo consulten.
 */
export const getCurrentBusiness = cache(async (): Promise<CurrentBusiness> => {
  const slug = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG;
  if (!slug) {
    throw new Error(
      "NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG no está configurado. " +
        "En v1 es obligatorio: define el negocio único de esta instancia."
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, organization_id, name, slug")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(`No se pudo resolver el negocio activo (slug: ${slug}).`);
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    slug: data.slug,
  };
});
