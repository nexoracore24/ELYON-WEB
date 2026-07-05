# ELYON — Módulo de autenticación (v1)

Implementación completa del sistema de autenticación con Supabase
Auth, roles `admin` / `staff` (con `manager` preparado) y arquitectura
multi-tenant (activa desde el día 1, aunque v1 sirve un único
negocio: la barbería de Roberto).

## Puesta en marcha

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear proyecto en Supabase
Crea el proyecto desde supabase.com (o `supabase init` si usas el
CLI local). Copia `.env.local.example` a `.env.local` y completa:

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: en
  Project Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY`: misma pantalla — **nunca** exponer al
  cliente ni commitear.
- `NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`: déjalo en `roberto-barberia`
  (coincide con el seed).

### 3. Aplicar la migración
Con el CLI de Supabase enlazado a tu proyecto:
```bash
supabase db push
```
O pega el contenido de `supabase/migrations/0001_init_auth.sql`
directamente en el SQL Editor del dashboard de Supabase.

### 4. Cargar el seed (negocio de Roberto)
```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```
(o pégalo en el SQL Editor igual que la migración).

### 5. Crear el primer usuario admin
`auth.users` no se puebla con SQL plano de forma soportada — se usa
el script con la service role key:
```bash
npx tsx scripts/create-user.ts \
  --email roberto@example.com \
  --password "unaClaveTemporalSegura123" \
  --name "Roberto Gómez" \
  --role admin \
  --business-slug roberto-barberia
```

### 6. Levantar la app
```bash
npm run dev
```
Entra a `http://localhost:3000` → redirige a `/login`. Inicia sesión
con el usuario creado en el paso 5 → redirige al placeholder
protegido en `/`, que muestra los datos de la sesión resuelta
(nombre, rol, `business_id`, estado).

## Qué queda implementado

- Login / logout con Supabase Auth (Server Actions, sin lógica en
  componentes).
- Resolución de sesión + perfil (`modules/auth/services/session.service.ts`),
  punto de entrada que usarán todos los módulos futuros.
- Autorización centralizada (`core/permissions`): matriz de políticas
  por rol y función `can()` única en todo el proyecto.
- Aislamiento multi-tenant real vía RLS (`current_business_id()`).
- Auditoría de login/logout exitoso y fallido (`audit_logs`).
- Middleware liviano: protege rutas por sesión, sin consultar rol en
  cada request.

## Qué NO incluye este módulo (a propósito)
Dashboard real, recuperación de contraseña, invitación de empleados
por email, `core/events`, `core/notifications`, `business_settings`.
Ver `docs/adr/0001-auth-roles-tenant.md`.
