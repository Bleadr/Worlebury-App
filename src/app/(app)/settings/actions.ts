"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const fullName = String(formData.get("full_name") ?? "").trim();
  await supabase.from("profiles").update({ full_name: fullName || null }).eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}
