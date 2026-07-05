import { requireSession } from "@/modules/auth/services/session.service";
import { getCurrentBusiness } from "@/core/tenant/get-current-business";
import { LogoutButton } from "@/modules/auth/components/logout-button";

/**
 * Shell mínimo del área protegida, únicamente para validar el flujo
 * de autenticación de punta a punta. El Dashboard real (navegación,
 * módulos, layout definitivo) se implementa como su propio módulo
 * más adelante.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const business = await getCurrentBusiness();

  return (
    <div className="min-h-screen bg-elyon-100/40">
      <header className="flex items-center justify-between border-b border-elyon-300/60 bg-white px-6 py-4">
        <div>
          <p className="font-display text-lg font-medium text-elyon-900">{business.name}</p>
          <p className="text-xs text-elyon-500">
            {session.profile.fullName} · {roleLabel(session.profile.role)}
          </p>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrador",
    staff: "Personal",
    manager: "Encargado",
  };
  return labels[role] ?? role;
}
