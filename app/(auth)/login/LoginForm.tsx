"use client";

/**
 * ELYON · Formulario de login (componente cliente).
 * Gestiona el estado del envío y muestra errores. La autenticación
 * real ocurre en la acción de servidor loginAction.
 */
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

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

      <div className="login-field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          required
        />
      </div>

      {state.error && <p className="login-error">{state.error}</p>}

      <button type="submit" className="login-button" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>

      <a href="/recuperar" className="login-forgot">
        ¿Olvidaste tu contraseña?
      </a>
    </form>
  );
}
