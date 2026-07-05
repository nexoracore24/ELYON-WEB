"use client";

import { useActionState } from "react";
import { loginAction } from "../actions/auth.actions";
import type { LoginResult } from "../types";

const initialState: LoginResult | null = null;

type LoginFormProps = {
  redirectTo?: string;
};

/**
 * Componente de presentación. No contiene lógica de negocio ni
 * llamadas directas a Supabase: solo recolecta el input y delega
 * en la Server Action `loginAction`, que a su vez delega en
 * `auth.service.ts`.
 */
export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-6" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo ?? "/"} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-elyon-900">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-elyon-300 bg-white px-3.5 py-2.5 text-elyon-900 outline-none transition-colors placeholder:text-elyon-500/60 focus:border-elyon-accent focus:ring-2 focus:ring-elyon-accent/30"
          placeholder="tu@negocio.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-elyon-900">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-elyon-300 bg-white px-3.5 py-2.5 text-elyon-900 outline-none transition-colors focus:border-elyon-accent focus:ring-2 focus:ring-elyon-accent/30"
          placeholder="••••••••"
        />
      </div>

      {state && !state.success && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-elyon-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-elyon-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Verificando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
