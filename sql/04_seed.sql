-- ============================================================
-- ELYON · sql/04_seed.sql
-- Módulo 0 · Paso 0.5 — Negocio piloto y usuarios de arranque
-- Se ejecuta en TRES partes (A y C aquí; B en el panel de Auth).
-- ============================================================

-- ---------- PARTE A: crear el negocio piloto ----------
insert into public.businesses (name, timezone)
values ('Barbería Roberto', 'Europe/Madrid');

-- ---------- PARTE B (en el panel, no aquí) ----------
-- Authentication → Users → Add user → Create new user (x2)
-- con "Auto Confirm User" activado. El disparador handle_new_user
-- creará automáticamente los perfiles con rol 'staff'.

-- ---------- PARTE C: ascender al administrador y nombrar ----------
-- Sustituir los emails por los usados en la Parte B.
update public.profiles
set role = 'admin', full_name = 'Roberto (Administrador)'
where id = (select id from auth.users where email = 'EMAIL_DEL_ADMIN');

update public.profiles
set full_name = 'Javi (Profesional de prueba)'
where id = (select id from auth.users where email = 'EMAIL_DEL_PROFESIONAL');
