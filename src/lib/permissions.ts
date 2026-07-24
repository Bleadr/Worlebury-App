import { createClient } from "@/lib/supabase/server";
import type { AppTool, EntityRole } from "@/lib/types";

export interface CurrentAccess {
  userId: string;
  isSuperAdmin: boolean;
  role: EntityRole | null;
  permissions: Record<AppTool, { view: boolean; edit: boolean; delete: boolean; manage: boolean }>;
}

const EMPTY_PERM = { view: false, edit: false, delete: false, manage: false };

// Server-side helper: resolve everything the current user can do within one
// entity, in a single pair of queries. Use this in Server Components / route
// handlers to decide what to render — RLS is still the real enforcement
// layer, this is just for UI decisions (hiding buttons, etc).
export async function getCurrentAccess(entityId: string): Promise<CurrentAccess | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("entity_members")
    .select("role")
    .eq("entity_id", entityId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isSuperAdmin = !!profile?.is_super_admin;
  const role = (membership?.role as EntityRole) ?? null;
  const fullAccess = isSuperAdmin || role === "owner" || role === "admin";

  const tools: AppTool[] = ["crm", "finance", "reporting", "resources", "admin"];
  const permissions = {} as CurrentAccess["permissions"];

  if (fullAccess) {
    for (const t of tools) permissions[t] = { view: true, edit: true, delete: true, manage: true };
  } else {
    const { data: rows } = await supabase
      .from("tool_permissions")
      .select("tool, can_view, can_edit, can_delete, can_manage")
      .eq("entity_id", entityId)
      .eq("user_id", user.id);

    for (const t of tools) permissions[t] = { ...EMPTY_PERM };
    for (const row of rows ?? []) {
      permissions[row.tool as AppTool] = {
        view: row.can_view,
        edit: row.can_edit,
        delete: row.can_delete,
        manage: row.can_manage,
      };
    }
  }

  return { userId: user.id, isSuperAdmin, role, permissions };
}
