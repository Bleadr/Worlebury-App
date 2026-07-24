"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { EntityRole } from "@/lib/types";

function currentEntityId() {
  const id = cookies().get("current_entity")?.value;
  if (!id) throw new Error("No entity selected.");
  return id;
}

// Invites a new person by email. They receive a Supabase auth invite email
// linking to /signup to set a password. No self-service sign-up exists —
// this is the only way a new account gets created, and only an entity
// admin/owner (or super admin) can call it (enforced again by RLS below).
export async function inviteUser(formData: FormData) {
  const entityId = currentEntityId();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as EntityRole;
  if (!email) return { error: "Email is required." };

  const supabase = createClient();
  const {
    data: { user: actingUser },
  } = await supabase.auth.getUser();

  // RLS on entity_members already blocks non-admins from inserting, but we
  // check explicitly here too so we can give a clean error message.
  const { data: myRole } = await supabase
    .from("entity_members")
    .select("role")
    .eq("entity_id", entityId)
    .eq("user_id", actingUser?.id)
    .maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", actingUser?.id).single();
  if (!profile?.is_super_admin && !["owner", "admin"].includes(myRole?.role ?? "")) {
    return { error: "Only entity admins can invite users." };
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${headers().get("host")}`;
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/signup`,
  });
  if (error) return { error: error.message };

  await supabase.from("entity_members").insert({
    entity_id: entityId,
    user_id: invited.user.id,
    role,
    invited_by: actingUser?.id,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateMemberRole(userId: string, role: EntityRole) {
  const entityId = currentEntityId();
  const supabase = createClient();
  await supabase.from("entity_members").update({ role }).eq("entity_id", entityId).eq("user_id", userId);
  revalidatePath("/admin/users");
}

export async function removeMember(userId: string) {
  const entityId = currentEntityId();
  const supabase = createClient();
  await supabase.from("entity_members").delete().eq("entity_id", entityId).eq("user_id", userId);
  revalidatePath("/admin/users");
}
