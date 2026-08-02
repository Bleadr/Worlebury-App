import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Single-entity app: resolves the one Worlebury entity for the current
// request. Wrapped in React's cache() so repeated calls within the same
// request/render tree are de-duplicated into a single DB round trip.
export const getEntityId = cache(async (): Promise<string> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_super_admin) {
    const { data } = await supabase
      .from("entities")
      .select("id")
      .eq("is_active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (!data) redirect("/no-access");
    return data.id;
  }

  const { data } = await supabase
    .from("entity_members")
    .select("entity_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!data) redirect("/no-access");
  return data.entity_id;
});
