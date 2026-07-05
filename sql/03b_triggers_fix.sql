-- ============================================================
-- ELYON · sql/03b_triggers_fix.sql
-- Corrige los disparadores de eventos: la escritura en public.events
-- debe hacerse con permisos de sistema, no con la identidad del
-- usuario que provoca el evento. Se elude RLS SOLO para este INSERT
-- interno y controlado (los datos se construyen aquí, no vienen del
-- usuario), reafirmando D11: solo el sistema escribe en events.
-- ============================================================

-- El disparador ya es SECURITY DEFINER (se ejecuta como su dueño).
-- Le indicamos explícitamente que ignore RLS en su sesión interna.

create or replace function public.log_appointment_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
begin
  perform set_config('row_security', 'off', true);

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
  perform set_config('row_security', 'off', true);

  insert into public.events (business_id, type, entity, entity_id, payload)
  values (
    new.business_id, 'client.created', 'client', new.id,
    jsonb_build_object('full_name', new.full_name)
  );
  return new;
end;
$$;
