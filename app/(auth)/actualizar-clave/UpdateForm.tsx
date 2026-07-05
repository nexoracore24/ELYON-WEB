"use client";

import { useActionState } from "react";
import { updatePasswordAction, type UpdateState } from "./actions";

const initialState: UpdateState = { error: null };

export default function UpdateForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="login-form">
      <div className="login-field">
        <label htmlFor="password">Nueva contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
      </div>
      <div className="login-field">
        <label htmlFor="confirm">Repite la contraseña</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" placeholder="Repite la contraseña" required />
      </div>

      {state.error && <p className="login-error">{state.error}</p>}

      <button type="submit" className="login-button" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
