-- Disparadores de eventos SIN tocar row_security.
-- Al ser SECURITY DEFINER y pertenecer a un superusuario en Supabase,
-- insertan en events con los permisos del dueño. Quitamos el
-- set_config('row_security','off') que causaba el conflicto.

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
    new.business_id, v_type, 'appointment', new.id,
    jsonb_build_object(
      'staff_id', new.staff_id, 'client_id', new.client_id,
      'service_id', new.service_id, 'starts_at', new.starts_at,
      'ends_at', new.ends_at, 'status', new.status
    )
  );
  return new;
end;
$$;

create or replace function public.log_client_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.events (business_id, type, entity, entity_id, payload)
  values (
    new.business_id, 'client.created', 'client', new.id,
    jsonb_build_object('full_name', new.full_name)
  );
  return new;
end;
$$;

-- La tabla events tiene RLS activado y SIN política de INSERT, lo que
-- bloquea a los usuarios normales. Pero las funciones SECURITY DEFINER
-- se ejecutan como su dueño (postgres), que tiene BYPASSRLS: por eso
-- pueden insertar sin política y sin tocar row_security.
-- Garantizamos que el dueño de las funciones sea postgres:
alter function public.log_appointment_event() owner to postgres;
alter function public.log_client_event() owner to postgres;
