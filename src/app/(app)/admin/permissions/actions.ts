"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AppTool } from "@/lib/types";

export async function togglePermission(
  userId: string,
  tool: AppTool,
  field: "can_view" | "can_edit" | "can_delete" | "can_manage",
  value: boolean
) {
  const entityId = cookies().get("current_entity")?.value!;
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

  revalidatePath("/admin/permissions");
}
