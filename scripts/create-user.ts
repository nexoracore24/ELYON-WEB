/**
 * Script operativo para dar de alta un usuario (auth.users + profiles).
 *
 * No forma parte de la app: se ejecuta manualmente por un admin/dev.
 * auth.users no puede poblarse con SQL plano de forma soportada, por
 * eso este paso requiere el SDK de Supabase con la service role key.
 *
 * Uso:
 *   npx tsx scripts/create-user.ts \
 *     --email roberto@example.com \
 *     --password "unaClaveTemporalSegura" \
 *     --name "Roberto Gómez" \
 *     --role admin \
 *     --business-slug roberto-barberia
 */
import { createClient } from "@supabase/supabase-js";

function getArg(flag: string): string {
  const index = process.argv.indexOf(`--${flag}`);
  const value = index !== -1 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`Falta el argumento --${flag}`);
  return value;
}

async function main() {
  const email = getArg("email");
  const password = getArg("password");
  const fullName = getArg("name");
  const role = getArg("role");
  const businessSlug = getArg("business-slug");

  if (!["admin", "staff", "manager"].includes(role)) {
    throw new Error(`Rol inválido: ${role}`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno."
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .single();

  if (businessError || !business) {
    throw new Error(`No se encontró el negocio con slug "${businessSlug}". ¿Corriste el seed?`);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    throw new Error(`No se pudo crear el usuario en auth: ${createError?.message}`);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    business_id: business.id,
    role,
    full_name: fullName,
    is_active: true,
  });

  if (profileError) {
    throw new Error(`Usuario creado en auth, pero falló el profile: ${profileError.message}`);
  }

  console.log(`✅ Usuario creado: ${email} (${role}) en el negocio "${businessSlug}"`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
