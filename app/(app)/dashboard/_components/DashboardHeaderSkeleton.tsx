/**
 * ELYON · Skeleton de la cabecera (estado de carga).
 * Se muestra mientras llegan los datos: nunca pantalla en blanco.
 */
export default function DashboardHeaderSkeleton() {
  return (
    <header className="dash-header">
      <div className="dash-header__top">
        <span className="skeleton skeleton--sm" style={{ width: 140 }} />
        <span className="skeleton skeleton--sm" style={{ width: 180 }} />
      </div>
      <span className="skeleton skeleton--lg" style={{ width: 320, marginTop: 8 }} />
      <span className="skeleton skeleton--md" style={{ width: 220, marginTop: 14 }} />
    </header>
  );
}
