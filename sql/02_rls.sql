-- ============================================================
-- ELYON · sql/02_rls.sql
-- Módulo 0 · Paso 0.3 — Políticas de seguridad (RLS)
-- Implementa la matriz de permisos aprobada (plan, sección 10)
-- ============================================================

-- ---------- Funciones auxiliares ----------
-- Leen el perfil del usuario autenticado saltando RLS (security definer)
-- para evitar recursión al proteger la propia tabla profiles.

create or replace function public.elyon_business_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select business_id from public.profiles where id = auth.uid()
$$;

create or replace function public.elyon_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke execute on function public.elyon_business_id() from public, anon;
revoke execute on function public.elyon_is_admin() from public, anon;
grant execute on function public.elyon_business_id() to authenticated;
grant execute on function public.elyon_is_admin() to authenticated;

-- ---------- Garantizar RLS activado en las 7 tablas ----------
alter table public.businesses      enable row level security;
alter table public.profiles        enable row level security;
alter table public.staff_schedules enable row level security;
alter table public.clients         enable row level security;
alter table public.services        enable row level security;
alter table public.appointments    enable row level security;
alter table public.events          enable row level security;

-- ---------- businesses ----------
create policy "leer su negocio" on public.businesses
  for select to authenticated
  using (id = public.elyon_business_id());

create policy "solo admin edita el negocio" on public.businesses
  for update to authenticated
  using (id = public.elyon_business_id() and public.elyon_is_admin())
  with check (id = public.elyon_business_id() and public.elyon_is_admin());

-- ---------- profiles (decisión T1) ----------
create policy "leer perfiles del negocio" on public.profiles
  for select to authenticated
  using (business_id = public.elyon_business_id());

create policy "admin edita perfiles del negocio" on public.profiles
  for update to authenticated
  using (business_id = public.elyon_business_id() and public.elyon_is_admin())
  with check (business_id = public.elyon_business_id() and public.elyon_is_admin());

create policy "cada uno edita su perfil" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Blindaje anti-escalada: un no-admin no puede cambiarse el rol,
-- el negocio ni su estado de activación aunque edite su perfil.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.elyon_is_admin() then
    new.role        := old.role;
    new.business_id := old.business_id;
    new.is_active   := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------- staff_schedules ----------
create policy "leer horarios del negocio" on public.staff_schedules
  for select to authenticated
  using (business_id = public.elyon_business_id());

create policy "solo admin crea horarios" on public.staff_schedules
  for insert to authenticated
  with check (business_id = public.elyon_business_id() and public.elyon_is_admin());

create policy "solo admin edita horarios" on public.staff_schedules
  for update to authenticated
  using (business_id = public.elyon_business_id() and public.elyon_is_admin())
  with check (business_id = public.elyon_business_id() and public.elyon_is_admin());

create policy "solo admin borra horarios" on public.staff_schedules
  for delete to authenticated
  using (business_id = public.elyon_business_id() and public.elyon_is_admin());

-- ---------- services ----------
create policy "leer catalogo del negocio" on public.services
  for select to authenticated
  using (business_id = public.elyon_business_id());

create policy "solo admin crea servicios" on public.services
  for insert to authenticated
  with check (business_id = public.elyon_business_id() and public.elyon_is_admin());

create policy "solo admin edita servicios" on public.services
  for update to authenticated
  using (business_id = public.elyon_business_id() and public.elyon_is_admin())
  with check (business_id = public.elyon_business_id() and public.elyon_is_admin());

create policy "solo admin borra servicios" on public.services
  for delete to authenticated
  using (business_id = public.elyon_business_id() and public.elyon_is_admin());

-- ---------- clients ----------
create policy "leer clientes del negocio" on public.clients
  for select to authenticated
  using (business_id = public.elyon_business_id());

create policy "crear clientes (ambos roles)" on public.clients
  for insert to authenticated
  with check (business_id = public.elyon_business_id());

create policy "editar clientes (ambos roles)" on public.clients
  for update to authenticated
  using (business_id = public.elyon_business_id())
  with check (business_id = public.elyon_business_id());

create policy "solo admin borra clientes" on public.clients
  for delete to authenticated
  using (business_id = public.elyon_business_id() and public.elyon_is_admin());

-- ---------- appointments (decisión T2: DELETE no existe para nadie) ----------
create policy "leer citas segun rol" on public.appointments
  for select to authenticated
  using (
    business_id = public.elyon_business_id()
    and (public.elyon_is_admin() or staff_id = auth.uid())
  );

create policy "crear citas segun rol" on public.appointments
  for insert to authenticated
  with check (
    business_id = public.elyon_business_id()
    and (public.elyon_is_admin() or staff_id = auth.uid())
  );

create policy "editar citas segun rol" on public.appointments
  for update to authenticated
  using (
    business_id = public.elyon_business_id()
    and (public.elyon_is_admin() or staff_id = auth.uid())
  )
  with check (
    business_id = public.elyon_business_id()
    and (public.elyon_is_admin() or staff_id = auth.uid())
  );

-- (Sin política de DELETE: cancelar es cambiar el estado. T2.)

-- ---------- events ----------
create policy "solo admin lee eventos" on public.events
  for select to authenticated
  using (business_id = public.elyon_business_id() and public.elyon_is_admin());

-- (Sin políticas de escritura: solo los disparadores del sistema escriben. Paso 0.4.)
