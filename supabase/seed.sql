-- ============================================================
-- Seed v1: negocio único (barbería de Roberto).
--
-- Nota: NO crea usuarios. Los usuarios se crean vía Supabase Auth
-- (auth.users no se puebla con SQL plano de forma soportada) y
-- luego se les asocia un `profile`. Ver:
--   scripts/create-user.ts
-- para dar de alta al primer admin.
-- ============================================================

insert into organizations (id, name, slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'Roberto Barbería',
  'roberto-barberia-org'
)
on conflict (slug) do nothing;

insert into businesses (
  id, organization_id, name, slug, timezone, currency, locale, contact_phone
)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Roberto Barbería',
  'roberto-barberia',
  'America/Bogota',
  'COP',
  'es',
  null
)
on conflict (slug) do nothing;
