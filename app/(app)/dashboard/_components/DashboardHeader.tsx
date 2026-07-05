/**
 * ELYON · Cabecera Viva del Dashboard — Entrega 2A.
 * Saludo dinámico + nombre + fecha + negocio, con estética ELYON.
 * Diseñada como contenedor: las métricas (2B) se colgarán debajo del
 * bloque de saludo sin rediseñar nada (ver ranura "header-metrics").
 */
import { greetingForNow, longDateInSpanish } from "@/lib/datetime";

type Props = {
  fullName: string;
  businessName: string;
};

export default function DashboardHeader({ fullName, businessName }: Props) {
  const greeting = greetingForNow();
  const today = longDateInSpanish();

  // El nombre puede venir como "Roberto (Administrador)": usamos solo el nombre.
  const firstName = fullName.split(" ")[0].split("(")[0].trim() || fullName;

  return (
    <header className="dash-header">
      <div className="dash-header__glow" aria-hidden="true" />
      <div className="dash-header__top">
        <span className="dash-header__business">{businessName}</span>
        <span className="dash-header__date">{today}</span>
      </div>
      <h1 className="dash-header__greeting">
        {greeting}, <span className="dash-header__name">{firstName}</span>
      </h1>
      <p className="dash-header__subtitle">
        Este es el resumen de tu negocio.
      </p>

      {/* Ranura reservada para las métricas (Entrega 2B). */}
      <div className="dash-header__metrics" />
    </header>
  );
}
