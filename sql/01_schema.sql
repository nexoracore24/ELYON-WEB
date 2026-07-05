-- ============================================================
-- ELYON · sql/01_schema.sql
-- Módulo 0 · Paso 0.2 — Esquema de datos v1.0 (7 tablas)
-- Ejecutar en: Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

-- Extensión necesaria para la restricción anti-solapamiento
create extension if not exists btree_gist;

-- ---------- Tipos ----------
create type user_role as enum ('admin', 'staff');
create type appointment_status as enum ('confirmed', 'completed', 'cancelled', 'no_show');

-- ---------- 1. Negocios ----------
create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  timezone    text not null default 'Europe/Madrid',
  phone       text,
  created_at  timestamptz not null default now()
);

-- ---------- 2. Perfiles (usuarios del sistema) ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'staff',
  phone       text,
  color       text not null default '#7C5CFF',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index profiles_business_idx on public.profiles (business_id);

-- ---------- 3. Horarios individuales (P6) ----------
create table public.staff_schedules (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id    uuid not null references public.profiles (id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time  time not null,
  end_time    time not null,
  is_active   boolean not null default true,
  check (start_time < end_time)
);
create index staff_schedules_staff_idx on public.staff_schedules (staff_id, weekday);

-- ---------- 4. Clientes del negocio ----------
create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name   text not null,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index clients_business_idx on public.clients (business_id, full_name);

-- ---------- 5. Catálogo de servicios (P5) ----------
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null,
  duration_min integer not null check (duration_min > 0),
  price_cents  integer not null check (price_cents >= 0), -- dinero en céntimos
  is_active    boolean not null default true,
  sort_order   integer not null default 0
);
create index services_business_idx on public.services (business_id, sort_order);

-- ---------- 6. Reservas — el corazón ----------
create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses (id) on delete cascade,
  staff_id         uuid not null references public.profiles (id),
  client_id        uuid not null references public.clients (id),
  service_id       uuid not null references public.services (id),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           appointment_status not null default 'confirmed',
  notes            text,
  cancelled_reason text,
  created_by       uuid references public.profiles (id),
  created_at       timestamptz not null default now(),
  check (starts_at < ends_at),
  -- La doble reserva es físicamente imposible: dos citas CONFIRMADAS del
  -- mismo profesional no pueden solaparse en el tiempo.
  constraint appointments_no_overlap exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);
create index appointments_staff_time_idx on public.appointments (staff_id, starts_at);
create index appointments_business_time_idx on public.appointments (business_id, starts_at);

-- ---------- 7. Eventos de dominio (D11 — preparación de integraciones) ----------
create table public.events (
  id          bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  type        text not null,          -- ej. 'appointment.created'
  entity      text not null,          -- ej. 'appointment'
  entity_id   uuid,
  payload     jsonb not null default '{}'::jsonb,
  processed   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index events_pending_idx on public.events (business_id, processed, created_at);
