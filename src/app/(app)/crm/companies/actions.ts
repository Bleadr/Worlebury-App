"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";

export async function createCompany(formData: FormData): Promise<void> {
  const entityId = await getEntityId();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");

  await supabase.from("crm_companies").insert({
    entity_id: entityId,
    name,
    website: String(formData.get("website") || "") || null,
    industry: String(formData.get("industry") || "") || null,
    created_by: user?.id,
  });

  revalidatePath("/crm/companies");
}

export async function updateCompanyNotes(companyId: string, formData: FormData): Promise<void> {
  const supabase = createClient();
  await supabase.from("crm_companies").update({ notes: String(formData.get("notes") || "") || null }).eq("id", companyId);
  revalidatePath(`/crm/companies/${companyId}`);
}

export async function deleteCompany(companyId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("crm_companies").delete().eq("id", companyId);
  revalidatePath("/crm/companies");
  redirect("/crm/companies");
}
