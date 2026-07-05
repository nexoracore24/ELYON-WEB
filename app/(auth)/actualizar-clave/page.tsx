/**
 * ELYON · Página para establecer nueva contraseña — Módulo 1 · Entrega 1D.
 * Se llega desde el enlace del correo de recuperación.
 */
import UpdateForm from "./UpdateForm";

export default function ActualizarClavePage() {
  return (
    <main className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo-img" src="/assets/images/elyon-logo.png" alt="ELYON" width={1377} height={240} />
          <p className="login-tagline">Crea tu nueva contraseña</p>
        </div>
        <UpdateForm />
      </div>
    </main>
  );
}
