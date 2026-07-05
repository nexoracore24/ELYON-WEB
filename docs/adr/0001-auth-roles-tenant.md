# ADR 0001 — Autenticación, roles y resolución de tenant (v1)

## Contexto
Primer módulo implementado del SaaS ELYON. Primer cliente: barbería
de Roberto. El sistema debe quedar preparado para múltiples negocios
sin sobre-construir para un caso que aún no existe.

## Decisiones

**Roles: `admin`, `staff`, `manager` (tipo completo desde ahora).**
Solo se asignan `admin` y `staff` en v1. `manager` existe en el tipo
`Role` y en la matriz de `policies` con una asignación provisional
razonable, para no requerir una migración de esquema cuando se active.

**Autorización centralizada en `core/permissions`.**
Prohibido comparar `role === '...'` fuera de `core/permissions`. Toda
decisión de autorización pasa por `can()` / `assertCan()` /
`requireSessionWithPermission()`. Doble barrera: RLS en Postgres
(fondo, infranqueable) + `can()` en la capa de aplicación (negocio,
mensajes de error útiles).

**`organizations` vs `businesses`.**
`organizations` es el tenant de facturación/cuenta SaaS.
`businesses` es el negocio operativo (1 organización → N businesses
a futuro). `profiles.business_id` referencia directamente a
`businesses`, no a `organizations`, porque la unidad real de trabajo
y de aislamiento de datos es el negocio.

**Resolución de tenant vía `core/tenant/get-current-business.ts`.**
v1: resuelve un negocio fijo por `slug` (env
`NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`). Es el único punto de la app que
sabe cómo se resuelve el negocio activo; cuando haya más de uno, este
archivo cambia (subdominio, dominio propio, negocio activo del
usuario) y nada más se toca.

**`businesses` es de lectura pública (RLS).**
Necesario porque `core/tenant` debe poder resolverse antes de que
exista sesión (ej. para auditar un intento de login fallido), y a
futuro una página pública de reservas también necesitará leer estos
datos sin autenticación. No se guarda nada sensible en esta tabla.

**Middleware liviano: solo sesión, no rol.**
`middleware.ts` (edge) únicamente verifica si hay sesión válida y
redirige a `/login` si no la hay. No consulta `profiles` en cada
request — eso agregaría latencia global a toda la app. La
autorización fina por rol se resuelve en el server (layout/página del
dashboard) vía `requireSessionWithPermission()`, que sí corre en cada
carga de esas rutas específicas, no en todas.

**Auditoría desde el primer módulo.**
`audit_logs` se implementa ya (no se pospuso), porque intentos de
login fallidos, inicios de sesión y cierres de sesión son eventos de
seguridad que interesa poder investigar desde el día 1. Se invoca
únicamente desde `services/`, nunca desde `repositories/` ni
componentes.

## Pendiente explícitamente fuera de alcance de este módulo
- `core/events` (bus de eventos para Dashboard/IA/n8n).
- `core/notifications` (WhatsApp/email).
- `business_settings` como tabla.
- Recuperación de contraseña, invitación por email, 2FA.
- UI real del Dashboard (lo actual en `app/(dashboard)` es un
  placeholder de verificación, no el módulo definitivo).
