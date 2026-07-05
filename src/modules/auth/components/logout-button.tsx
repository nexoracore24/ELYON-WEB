"use client";

import { logoutAction } from "../actions/auth.actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md border border-elyon-300 px-3.5 py-2 text-sm font-medium text-elyon-700 transition-colors hover:border-elyon-500 hover:text-elyon-900"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
