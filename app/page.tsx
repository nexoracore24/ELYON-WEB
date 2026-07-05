/**
 * Raíz — Módulo 1 · Entrega 1A.
 * De momento redirige al login. En 1B, el guardián decidirá el destino
 * según haya sesión y rol.
 */
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
