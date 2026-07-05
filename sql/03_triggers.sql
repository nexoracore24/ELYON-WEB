-- ============================================================
-- ELYON · sql/03_triggers.sql
-- Módulo 0 · Paso 0.4 — Disparadores del sistema
-- 1. Perfil automático al crear/invitar un usuario
-- 2. Eventos de dominio (D11): citas y clientes publican hechos
-- ============================================================

-- ---------- 1. Perfil automático ----------
-- Cuando un usuario acepta una invitación (o es creado), se crea su
-- fila en profiles. El rol, nombre y negocio pueden venir en los
-- metadatos de la invitación; si no vienen (invitación manual desde
-- el panel, caso del piloto), se usa el único negocio existente y
-- el rol por defecto 'staff'.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business uuid;
  v_role     user_role;
  v_name     text;
begin
  v_business := coalesce(
    (new.raw_user_meta_data ->> 'business_id')::uuid,
    (select id from public.businesses order by created_at limit 1)
  );

  -- Si todavía no existe ningún negocio, no se crea perfil
  -- (el arranque del piloto crea primero el negocio en el paso 0.5).
  if v_business is null then
    return new;
  end if;

  v_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'staff');
  v_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, business_id, full_name, role)
  values (new.id, v_business, v_name, v_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. Eventos de dominio: citas ----------
create or replace function public.log_appointment_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
begin
  if tg_op = 'INSERT' then
    v_type := 'appointment.created';
  else
    if new.status is distinct from old.status then
      v_type := 'appointment.' || new.status::text;
    else
      v_type := 'appointment.updated';
    end if;
  end if;

  insert into public.events (business_id, type, entity, entity_id, payload)
  values (
    new.business_id,
    v_type,
    'appointment',
    new.id,
    jsonb_build_object(
      'staff_id',   new.staff_id,
      'client_id',  new.client_id,
      'service_id', new.service_id,
      'starts_at',  new.starts_at,
      'ends_at',    new.ends_at,
      'status',     new.status
    )
  );
  return new;
end;
$$;

drop trigger if exists appointments_log_event on public.appointments;
create trigger appointments_log_event
  after insert or update on public.appointments
  for each row execute function public.log_appointment_event();

-- ---------- 3. Eventos de dominio: clientes ----------
create or replace function public.log_client_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.events (business_id, type, entity, entity_id, payload)
  values (
    new.business_id,
    'client.created',
    'client',
    new.id,
    jsonb_build_object('full_name', new.full_name)
  );
  return new;
end;
$$;

drop trigger if exists clients_log_event on public.clients;
create trigger clients_log_event
  after insert on public.clients
  for each row execute function public.log_client_event();
