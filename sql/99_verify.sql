create or replace function pg_temp.elyon_security_tests()
returns table(n int, prueba text, esperado text, resultado text, veredicto text)
language plpgsql
as $$
declare
  v_biz uuid; v_admin uuid; v_staff uuid;
  v_service uuid; v_client uuid; v_client_libre uuid;
  v_appt_staff uuid; v_appt_admin uuid;
  v_count int; v_txt text; v_ok boolean;
begin
  select id into v_biz   from public.businesses order by created_at limit 1;
  select id into v_admin from public.profiles where role = 'admin' limit 1;
  select id into v_staff from public.profiles where role = 'staff' limit 1;
  if v_biz is null or v_admin is null or v_staff is null then
    raise exception 'Faltan negocio/admin/staff: completa el paso 0.5';
  end if;

  insert into public.services (business_id, name, duration_min, price_cents)
  values (v_biz, 'TEST Servicio 0.6', 30, 1500) returning id into v_service;
  insert into public.clients (business_id, full_name, notes)
  values (v_biz, 'TEST Cliente 0.6', 'TEST-0.6') returning id into v_client;
  insert into public.clients (business_id, full_name, notes)
  values (v_biz, 'TEST Cliente libre 0.6', 'TEST-0.6') returning id into v_client_libre;
  insert into public.appointments (business_id, staff_id, client_id, service_id, starts_at, ends_at, notes)
  values (v_biz, v_staff, v_client, v_service,
     date_trunc('day', now()) + interval '1 day 10 hours',
     date_trunc('day', now()) + interval '1 day 10 hours 30 minutes', 'TEST-0.6')
  returning id into v_appt_staff;
  insert into public.appointments (business_id, staff_id, client_id, service_id, starts_at, ends_at, notes)
  values (v_biz, v_admin, v_client, v_service,
     date_trunc('day', now()) + interval '1 day 12 hours',
     date_trunc('day', now()) + interval '1 day 12 hours 30 minutes', 'TEST-0.6')
  returning id into v_appt_admin;

  -- IDENTIDAD STAFF
  perform set_config('request.jwt.claims', json_build_object('sub', v_staff, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_staff::text, true);
  perform set_config('row_security', 'on', true);
  set local role authenticated;

  n:=0; prueba:='DIAGNOSTICO identidad staff'; esperado:='uid=staff, biz OK, admin=false';
  resultado:='uid='||coalesce(left(auth.uid()::text,8),'NULL')||' biz='||coalesce(left(public.elyon_business_id()::text,8),'NULL')||' admin='||public.elyon_is_admin()::text;
  veredicto:=case when auth.uid()=v_staff and public.elyon_business_id()=v_biz and not public.elyon_is_admin() then '✅ OK' else '⚠️ REVISAR' end;
  return next;

  -- 1
  begin
    select count(*) into v_count from public.appointments where staff_id <> v_staff;
    v_txt := v_count||' filas'; v_ok := (v_count = 0);
  exception when insufficient_privilege then v_txt := 'bloqueado por RLS'; v_ok := true; end;
  n:=1; prueba:='Staff lee citas ajenas'; esperado:='0 visibles'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 2
  begin
    update public.appointments set notes='HACKED' where id = v_appt_admin;
    get diagnostics v_count = row_count; v_txt := v_count||' filas'; v_ok := (v_count = 0);
  exception when insufficient_privilege then v_txt := 'bloqueado por RLS'; v_ok := true; end;
  n:=2; prueba:='Staff modifica cita ajena'; esperado:='0 afectadas'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 3
  begin
    delete from public.clients where id = v_client_libre;
    get diagnostics v_count = row_count; v_txt := v_count||' filas'; v_ok := (v_count = 0);
  exception when insufficient_privilege then v_txt := 'bloqueado por RLS'; v_ok := true; end;
  n:=3; prueba:='Staff borra un cliente'; esperado:='0 afectadas'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 4
  begin
    delete from public.appointments where id = v_appt_staff;
    get diagnostics v_count = row_count; v_txt := v_count||' filas'; v_ok := (v_count = 0);
  exception when insufficient_privilege then v_txt := 'bloqueado por RLS'; v_ok := true; end;
  n:=4; prueba:='Staff borra su propia cita (T2)'; esperado:='0 afectadas'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 5
  begin
    insert into public.services (business_id, name, duration_min, price_cents) values (v_biz, 'TEST intruso', 10, 100);
    v_ok := false; v_txt := 'insertado (mal)';
  exception when others then v_ok := true; v_txt := 'rechazado por RLS'; end;
  n:=5; prueba:='Staff crea un servicio'; esperado:='rechazado'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 6
  begin
    update public.businesses set name='HACKED' where id = v_biz;
    get diagnostics v_count = row_count; v_txt := v_count||' filas'; v_ok := (v_count = 0);
  exception when insufficient_privilege then v_txt := 'bloqueado por RLS'; v_ok := true; end;
  n:=6; prueba:='Staff edita el negocio'; esperado:='0 afectadas'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 7
  begin
    select count(*) into v_count from public.events;
    v_txt := v_count||' filas'; v_ok := (v_count = 0);
  exception when insufficient_privilege then v_txt := 'bloqueado por RLS'; v_ok := true; end;
  n:=7; prueba:='Staff lee eventos del sistema'; esperado:='0 visibles'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 8
  begin
    update public.profiles set role='admin' where id = v_staff;
    begin
      select role::text into v_txt from public.profiles where id = v_staff;
    exception when insufficient_privilege then v_txt := 'staff'; end;
  exception when insufficient_privilege then v_txt := 'staff'; end;
  n:=8; prueba:='Staff se asciende a admin'; esperado:='sigue staff'; resultado:='rol='||v_txt;
  veredicto:=case when v_txt='staff' then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 9
  begin
    insert into public.appointments (business_id, staff_id, client_id, service_id, starts_at, ends_at, notes)
    values (v_biz, v_staff, v_client, v_service,
      date_trunc('day', now()) + interval '1 day 16 hours',
      date_trunc('day', now()) + interval '1 day 16 hours 30 minutes', 'TEST-0.6');
    v_ok := true; v_txt := 'creada correctamente';
  exception when others then v_ok := false; v_txt := 'rechazada: '||left(sqlerrm,45); end;
  n:=9; prueba:='Staff crea una cita PROPIA'; esperado:='permitido'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- IDENTIDAD ADMIN
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config('row_security', 'on', true);
  set local role authenticated;

  n:=0; prueba:='DIAGNOSTICO identidad admin'; esperado:='uid=admin, biz OK, admin=true';
  resultado:='uid='||coalesce(left(auth.uid()::text,8),'NULL')||' biz='||coalesce(left(public.elyon_business_id()::text,8),'NULL')||' admin='||public.elyon_is_admin()::text;
  veredicto:=case when auth.uid()=v_admin and public.elyon_business_id()=v_biz and public.elyon_is_admin() then '✅ OK' else '⚠️ REVISAR' end;
  return next;

  -- 10
  begin
    select count(*) into v_count from public.appointments where notes='TEST-0.6';
    v_txt := v_count||' citas'; v_ok := (v_count = 3);
  exception when insufficient_privilege then v_txt := 'BLOQUEO INESPERADO'; v_ok := false; end;
  n:=10; prueba:='Admin ve todas las citas'; esperado:='3 citas'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 11
  begin
    delete from public.clients where id = v_client_libre;
    get diagnostics v_count = row_count; v_txt := v_count||' filas'; v_ok := (v_count = 1);
  exception when insufficient_privilege then v_txt := 'BLOQUEO INESPERADO'; v_ok := false; end;
  n:=11; prueba:='Admin borra un cliente'; esperado:='1 afectada'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  -- 12
  begin
    insert into public.appointments (business_id, staff_id, client_id, service_id, starts_at, ends_at, notes)
    values (v_biz, v_staff, v_client, v_service,
      date_trunc('day', now()) + interval '1 day 10 hours 15 minutes',
      date_trunc('day', now()) + interval '1 day 10 hours 45 minutes', 'TEST-0.6');
    v_ok := false; v_txt := 'insertada (mal)';
  exception when others then v_ok := true; v_txt := 'imposible (solapamiento)'; end;
  n:=12; prueba:='Doble reserva solapada'; esperado:='rechazada'; resultado:=v_txt;
  veredicto:=case when v_ok then '✅ SUPERADA' else '❌ FALLO' end; return next;

  reset role;
  delete from public.appointments where notes = 'TEST-0.6';
  delete from public.clients where notes = 'TEST-0.6';
  delete from public.services where name like 'TEST%';
  return;
end;
$$;

select * from pg_temp.elyon_security_tests();
