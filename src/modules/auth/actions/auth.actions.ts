"use server";

import { redirect } from "next/navigation";
import * as authService from "../services/auth.service";
import type { LoginResult } from "../types";

/**
 * Server Action invocada desde `LoginForm`.
 *
 * Regla del proyecto: esta función NO contiene lógica de negocio.
 * Su único trabajo es leer el FormData, delegar en el service, y
 * traducir el resultado a una redirección o un estado de error para
 * la UI. Toda validación y decisión real vive en `auth.service.ts`.
 */
export async function loginAction(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  const result = await authService.loginWithPassword({ email, password });

  if (!result.success) {
    return result;
  }

  redirect(redirectTo || "/");
}

export async function logoutAction(): Promise<void> {
  await authService.logout();
  redirect("/login");
}
