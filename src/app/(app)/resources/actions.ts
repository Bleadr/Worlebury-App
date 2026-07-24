"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function assignResource(resourceId: string, userId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("resources").update({ assigned_to: userId || null }).eq("id", resourceId);
  if (userId) {
    await supabase.from("resource_assignments").insert({ resource_id: resourceId, user_id: userId, assigned_by: user?.id });
  }
  revalidatePath("/resources");
}

export async function createResourceRecord(input: {
  title: string;
  category: string;
  kind: string;
  storage_path?: string;
  external_url?: string;
}) {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("resources").insert({
    entity_id: entityId,
    title: input.title,
    category: input.category || null,
    kind: input.kind as any,
    storage_path: input.storage_path ?? null,
    external_url: input.external_url ?? null,
    created_by: user?.id,
  });
  revalidatePath("/resources");
}
