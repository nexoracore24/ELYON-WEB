"use client";

/**
 * ELYON · App Shell — la estructura visible de la aplicación.
 * Pinta la navegación según el rol (leída de permissions.ts) y el
 * botón de cerrar sesión. Móvil: barra inferior. Escritorio: lateral.
 */
import { usePathname } from "next/navigation";
import { NAVIGATION, ROLES, type UserRole } from "@/lib/permissions";
import { logoutAction } from "./logout";

type Props = {
  role: UserRole;
  fullName: string;
  children: React.ReactNode;
};

export default function AppShell({ role, fullName, children }: Props) {
  const pathname = usePathname();
  const items = NAVIGATION[role];

  return (
    <div className="shell">
      {/* Barra lateral (escritorio) / superior (móvil) */}
      <aside className="shell-sidebar">
        <div className="shell-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/elyon-logo.png" alt="ELYON" className="shell-logo" />
        </div>

        <nav className="shell-nav">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <a
                key={item.href}
                href={item.href}
                className={active ? "shell-nav-item is-active" : "shell-nav-item"}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="shell-user">
          <div className="shell-user-info">
            <span className="shell-user-name">{fullName}</span>
            <span className="shell-user-role">{ROLES[role].label}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="shell-logout" aria-label="Cerrar sesión">
              Salir
            </button>
          </form>
        </div>
      </aside>

      {/* Navegación inferior (solo móvil) */}
      <nav className="shell-bottomnav">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <a
              key={item.href}
              href={item.href}
              className={active ? "shell-bottomnav-item is-active" : "shell-bottomnav-item"}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <main className="shell-content">{children}</main>
    </div>
  );
}
