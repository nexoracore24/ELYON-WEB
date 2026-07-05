/**
 * ELYON · Utilidades de fecha y saludo, en español.
 * Zona horaria del negocio (Europe/Madrid) para coherencia.
 */

const TZ = "Europe/Madrid";

/** Saludo según la hora local del negocio. */
export function greetingForNow(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("es-ES", {
      hour: "numeric",
      hour12: false,
      timeZone: TZ,
    }).format(now)
  );

  if (hour >= 6 && hour < 13) return "Buenos días";
  if (hour >= 13 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

/** Fecha larga en español: "viernes, 4 de julio de 2026". */
export function longDateInSpanish(now: Date = new Date()): string {
  const text = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(now);
  // Capitalizar la primera letra (el día de la semana).
  return text.charAt(0).toUpperCase() + text.slice(1);
}
