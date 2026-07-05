/**
 * ELYON · Página "¿Olvidaste tu contraseña?" — Módulo 1 · Entrega 1D.
 */
import RecoverForm from "./RecoverForm";

export default function RecuperarPage() {
  return (
    <main className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo-img" src="/assets/images/elyon-logo.png" alt="ELYON" width={1377} height={240} />
          <p className="login-tagline">Recupera el acceso a tu cuenta</p>
        </div>
        <RecoverForm />
      </div>
    </main>
  );
}
