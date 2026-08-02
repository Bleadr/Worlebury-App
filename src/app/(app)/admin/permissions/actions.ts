"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import type { AppTool } from "@/lib/types";

// Called from a user's profile page (admin/users/[id]) to flip a single
// view/edit/delete/manage flag for one tool. Owners/admins/super admins
// always have full access regardless of these rows (see getCurrentAccess) —
// this only matters for 'manager', 'member' and 'read_only' roles.
export async function togglePermission(
  userId: string,
  tool: AppTool,
  field: "can_view" | "can_edit" | "can_delete" | "can_manage",
  value: boolean
): Promise<void> {
  const entityId = await getEntityId();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("tool_permissions")
    .upsert(
      { entity_id: entityId, user_id: userId, tool, [field]: value, granted_by: user?.id, updated_at: new Date().toISOString() },
      { onConflict: "entity_id,user_id,tool" }
    );

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}
