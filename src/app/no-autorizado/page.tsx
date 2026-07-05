export default function NoAutorizadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl font-medium text-elyon-900">
          No tienes acceso a esta sección
        </h1>
        <p className="mt-2 text-sm text-elyon-500">
          Tu rol actual no tiene permiso para ver esta página. Si crees que
          es un error, contacta al administrador del negocio.
        </p>
      </div>
    </div>
  );
}
