"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";

export async function addContactNote(contactId: string, formData: FormData): Promise<void> {
  const entityId = await getEntityId();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("crm_activities").insert({
    entity_id: entityId,
    contact_id: contactId,
    type: "note",
    body,
    created_by: user?.id,
  });

  revalidatePath(`/crm/contacts/${contactId}`);
}
