"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { logAudit } from "@/lib/audit";
import type { EntityRole } from "@/lib/types";

// Invites a new person by email. They receive a Supabase auth invite email
// linking to /signup to set a password. No self-service sign-up exists —
// this is the only way a new account gets created, and only an entity
// admin/owner (or super admin) can call it (enforced again by RLS below).
export async function inviteUser(formData: FormData): Promise<void> {
  const entityId = await getEntityId();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as EntityRole;
  if (!email) throw new Error("Email is required.");

  const supabase = createClient();
  const {
    data: { user: actingUser },
  } = await supabase.auth.getUser();

  const { data: myRole } = await supabase
    .from("entity_members")
    .select("role")
    .eq("entity_id", entityId)
    .eq("user_id", actingUser?.id)
    .maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", actingUser?.id).single();
  if (!profile?.is_super_admin && !["owner", "admin"].includes(myRole?.role ?? "")) {
    throw new Error("Only entity admins can invite users.");
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${headers().get("host")}`;
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/signup`,
  });
  if (error) throw new Error(error.message);

  await supabase.from("entity_members").insert({
    entity_id: entityId,
    user_id: invited.user.id,
    role,
    invited_by: actingUser?.id,
  });

  revalidatePath("/admin/users");
}

export async function updateMemberRole(userId: string, role: EntityRole): Promise<void> {
  const entityId = await getEntityId();
  const supabase = createClient();
  await supabase.from("entity_members").update({ role }).eq("entity_id", entityId).eq("user_id", userId);
  await logAudit(entityId, "member.role_changed", { table: "entity_members", id: userId }, { role });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function removeMember(userId: string): Promise<void> {
  const entityId = await getEntityId();
  const supabase = createClient();
  await supabase.from("entity_members").delete().eq("entity_id", entityId).eq("user_id", userId);
  await logAudit(entityId, "member.removed", { table: "entity_members", id: userId });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
