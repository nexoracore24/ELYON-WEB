/**
 * Tipos de la base de datos.
 *
 * Este archivo se regenera automáticamente desde el esquema real de
 * Supabase con:
 *
 *   npm run db:types
 *
 * (ver package.json -> requiere SUPABASE_PROJECT_ID en el entorno).
 *
 * Mientras tanto, se mantiene a mano y cubre únicamente las tablas
 * que el módulo de autenticación necesita, para no bloquear el
 * tipado end-to-end del resto del código.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      businesses: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          logo_url: string | null;
          timezone: string;
          currency: string;
          locale: string;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          business_hours: Json;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          logo_url?: string | null;
          timezone?: string;
          currency?: string;
          locale?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          business_hours?: Json;
          slug: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          business_id: string;
          role: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          business_id: string;
          role: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          business_id: string;
          actor_id: string | null;
          actor_type: "user" | "system" | "ai";
          action: string;
          entity_type: string;
          entity_id: string;
          changes: Json | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          actor_id?: string | null;
          actor_type: "user" | "system" | "ai";
          action: string;
          entity_type: string;
          entity_id: string;
          changes?: Json | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
