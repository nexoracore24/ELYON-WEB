import { LoginForm } from "@/modules/auth/components/login-form";

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel editorial */}
      <div className="relative hidden overflow-hidden bg-elyon-950 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#C9A227 1px, transparent 1px), linear-gradient(90deg, #C9A227 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <span className="relative text-xs font-medium uppercase tracking-[0.2em] text-elyon-accent">
          Sistema operativo de negocio
        </span>

        <div className="relative">
          <h1 className="font-display text-6xl font-medium leading-[1.05] text-elyon-100">
            Elyon
          </h1>
          <p className="mt-6 max-w-sm text-balance text-elyon-300">
            La operación diaria de tu negocio, ordenada en un solo lugar:
            agenda, equipo y clientes.
          </p>
        </div>

        <div className="relative h-px w-16 bg-elyon-accent" />
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <h1 className="font-display text-3xl font-medium text-elyon-900">Elyon</h1>
          </div>

          <h2 className="font-display text-2xl font-medium text-elyon-900">
            Inicia sesión
          </h2>
          <p className="mt-1.5 mb-8 text-sm text-elyon-500">
            Accede con las credenciales de tu negocio.
          </p>

          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
