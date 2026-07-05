-- ============================================================
-- ELYON — Migración 0001: Tenancy + Identidad + Auditoría
-- Alcance: únicamente lo necesario para el módulo de autenticación.
-- El resto del esquema (servicios, clientes, agenda, reservas...)
-- se añade en migraciones posteriores, junto con sus módulos.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TENANCY
-- ============================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  -- Identificador estable usado por core/tenant para resolver el
  -- negocio actual en v1 (single-tenant real, forma multi-tenant).
  slug text not null unique,
  logo_url text,
  timezone text not null default 'America/Bogota',
  currency text not null default 'COP',
  locale text not null default 'es',
  contact_email text,
  contact_phone text,
  address text,
  business_hours jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_businesses_organization on businesses(organization_id);

-- ============================================================
-- IDENTIDAD
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  role text not null check (role in ('admin', 'staff', 'manager')),
  full_name text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_profiles_business on profiles(business_id);

-- ============================================================
-- AUDITORÍA
-- ============================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user', 'system', 'ai')),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  changes jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_business_entity on audit_logs(business_id, entity_type, entity_id);
create index idx_audit_business_time on audit_logs(business_id, created_at desc);

-- ============================================================
-- HELPER: business_id del usuario autenticado actual.
-- Se usa dentro de las policies de RLS. SECURITY DEFINER + search_path
-- fijo para evitar hijacking de esquema.
-- ============================================================

create or replace function current_business_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select business_id from profiles where id = auth.uid()
$$;

create or replace function current_role_name()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid()
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table organizations enable row level security;
alter table businesses enable row level security;
alter table profiles enable row level security;
alter table audit_logs enable row level security;

-- organizations: solo lectura del propio tenant (vía su business)
create policy "organizations_select_own"
  on organizations for select
  using (
    id in (select organization_id from businesses where id = current_business_id())
  );

-- businesses: lectura pública (nombre, horarios, contacto...).
-- Es deliberado: core/tenant necesita resolver el negocio ANTES de
-- que exista sesión (ej. para auditar un intento de login fallido),
-- y a futuro una página pública de reservas también necesitará leer
-- estos datos sin autenticación. Nada de lo que hay en esta tabla es
-- sensible; lo sensible (configuración operativa fina) vive en
-- business_settings, que sí requerirá sesión cuando se implemente.
create policy "businesses_select_public"
  on businesses for select
  using (true);

-- Solo admin puede modificar la configuración del negocio.
create policy "businesses_update_admin_only"
  on businesses for update
  using (id = current_business_id() and current_role_name() = 'admin');

-- profiles: un usuario ve todos los perfiles de SU negocio
-- (staff necesita ver, por ejemplo, el nombre de otros empleados en
-- la agenda compartida). La restricción de qué puede EDITAR se
-- resuelve en la capa de aplicación vía can(), no aquí.
create policy "profiles_select_same_business"
  on profiles for select
  using (business_id = current_business_id());

-- Un usuario siempre puede actualizar su propio perfil (datos básicos).
create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

-- Solo admin puede crear o eliminar perfiles (alta/baja de empleados).
create policy "profiles_insert_admin_only"
  on profiles for insert
  with check (business_id = current_business_id() and current_role_name() = 'admin');

create policy "profiles_delete_admin_only"
  on profiles for delete
  using (business_id = current_business_id() and current_role_name() = 'admin');

-- audit_logs: de solo lectura desde el cliente, y solo del propio
-- negocio. Los INSERT se hacen con el cliente server-side normal
-- (respeta RLS como el usuario autenticado), por eso se permite
-- insert a cualquier usuario autenticado de su propio negocio.
create policy "audit_logs_select_same_business"
  on audit_logs for select
  using (business_id = current_business_id());

create policy "audit_logs_insert_same_business"
  on audit_logs for insert
  with check (
    business_id = current_business_id()
    or actor_id is null -- permite registrar intentos de login fallido, sin sesión resuelta aún
  );

-- ============================================================
-- GRANTS
-- Postgres requiere GRANT a nivel de tabla además de las policies
-- de RLS (RLS solo restringe filas, no reemplaza el permiso base).
-- 'anon' cubre las escrituras que ocurren antes de tener sesión
-- (registro de intentos de login fallido); todo lo demás requiere
-- 'authenticated' y queda además acotado por las policies de arriba.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on organizations to authenticated;
grant select on businesses to anon, authenticated;
grant update on businesses to authenticated;
grant select, insert, update, delete on profiles to authenticated;
grant select, insert on audit_logs to authenticated;
grant insert on audit_logs to anon;
