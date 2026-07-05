"use client";

/**
 * ELYON · Formulario de recuperación de contraseña.
 * Pide el correo y muestra confirmación tras el envío.
 */
import { useActionState } from "react";
import { recoverAction, type RecoverState } from "./actions";

const initialState: RecoverState = { done: false, error: null };

export default function RecoverForm() {
  const [state, formAction, pending] = useActionState(recoverAction, initialState);

  if (state.done) {
    return (
      <div className="login-form">
        <p className="recover-success">
          Si ese correo está registrado, te hemos enviado un enlace para
          restablecer tu contraseña. Revisa tu bandeja de entrada.
        </p>
        <a href="/login" className="login-button" style={{ textAlign: "center", textDecoration: "none" }}>
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="login-form">
      <div className="login-field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </div>

      {state.error && <p className="login-error">{state.error}</p>}

      <button type="submit" className="login-button" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace de recuperación"}
      </button>

      <a href="/login" className="login-forgot">
        Volver al inicio de sesión
      </a>
    </form>
  );
}
