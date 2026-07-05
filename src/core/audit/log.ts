import "server-only";
import { createSupabaseServerClient } from "@/core/supabase/server";

type ActorType = "user" | "system" | "ai";

type AuditEntry = {
  businessId: string;
  actorId: string | null;
  actorType: ActorType;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * Registro de auditoría (tabla `audit_logs`).
 *
 * Se invoca EXCLUSIVAMENTE desde `services/`, nunca desde repositories
 * (que no conocen el "por qué" de una acción) ni desde componentes.
 *
 * Este es un wrapper mínimo para el módulo auth. Cuando se implementen
 * más módulos, esta función se mantiene igual: solo cambia quién la llama.
 */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("audit_logs").insert({
    business_id: entry.businessId,
    actor_id: entry.actorId,
    actor_type: entry.actorType,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    changes: entry.changes ?? null,
    metadata: entry.metadata ?? null,
  });

  // Una falla al auditar no debe romper la operación de negocio principal,
  // pero sí queremos verla en logs del servidor.
  if (error) {
    console.error("[audit] No se pudo registrar el evento de auditoría:", error, entry);
  }
}
