import { requireSession } from "@/modules/auth/services/session.service";

/**
 * Página temporal de verificación. Se reemplaza por el módulo real
 * de Dashboard cuando se implemente. Su único propósito ahora es
 * confirmar que el flujo de sesión + rol funciona end-to-end.
 */
export default async function DashboardHomePage() {
  const session = await requireSession();

  return (
    <div className="rounded-lg border border-elyon-300/60 bg-white p-8">
      <p className="text-xs font-medium uppercase tracking-wide text-elyon-accent">
        Autenticación verificada
      </p>
      <h1 className="mt-2 font-display text-2xl font-medium text-elyon-900">
        Hola, {session.profile.fullName.split(" ")[0]}
      </h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-elyon-500">Rol</dt>
          <dd className="text-elyon-900">{session.profile.role}</dd>
        </div>
        <div>
          <dt className="text-elyon-500">Negocio (business_id)</dt>
          <dd className="text-elyon-900">{session.profile.businessId}</dd>
        </div>
        <div>
          <dt className="text-elyon-500">Email</dt>
          <dd className="text-elyon-900">{session.email}</dd>
        </div>
        <div>
          <dt className="text-elyon-500">Estado</dt>
          <dd className="text-elyon-900">{session.profile.isActive ? "Activo" : "Inactivo"}</dd>
        </div>
      </dl>
    </div>
  );
}
