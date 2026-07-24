"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function switchEntity(entityId: string) {
  cookies().set("current_entity", entityId, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Called from the current entity's Admin area only (RLS still enforces this
// server-side regardless of who calls it).
export async function createEntity(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!name) return { error: "Name is required." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: entity, error } = await supabase
    .from("entities")
    .insert({ name, slug, created_by: user.id })
    .select()
    .single();
  if (error) return { error: error.message };

  await supabase.from("entity_members").insert({ entity_id: entity.id, user_id: user.id, role: "owner" });

  const { data: pipeline } = await supabase
    .from("crm_pipelines")
    .insert({ entity_id: entity.id, name: "Sales Pipeline", is_default: true })
    .select()
    .single();

  if (pipeline) {
    await supabase.from("crm_pipeline_stages").insert([
      { pipeline_id: pipeline.id, name: "New Lead", position: 1, probability: 10 },
      { pipeline_id: pipeline.id, name: "Contacted", position: 2, probability: 25 },
      { pipeline_id: pipeline.id, name: "Qualified", position: 3, probability: 50 },
      { pipeline_id: pipeline.id, name: "Proposal Sent", position: 4, probability: 75 },
      { pipeline_id: pipeline.id, name: "Won", position: 5, probability: 100, is_won: true },
      { pipeline_id: pipeline.id, name: "Lost", position: 6, probability: 0, is_lost: true },
    ]);
  }

  redirect("/admin/entities");
}
