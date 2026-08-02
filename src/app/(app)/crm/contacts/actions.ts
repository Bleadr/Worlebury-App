"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";

export async function createContact(formData: FormData): Promise<void> {
  const entityId = await getEntityId();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = String(formData.get("first_name") ?? "").trim();
  if (!firstName) throw new Error("First name is required.");

  await supabase.from("crm_contacts").insert({
    entity_id: entityId,
    crm_company_id: String(formData.get("crm_company_id") || "") || null,
    first_name: firstName,
    last_name: String(formData.get("last_name") || "") || null,
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    type: String(formData.get("type") || "lead"),
    owner_id: user?.id,
  });

  revalidatePath("/crm/contacts");
}
