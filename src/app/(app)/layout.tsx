import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccess } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin, full_name")
    .eq("id", user.id)
    .single();

  // Entities the user belongs to (or all active entities, if super admin).
  let entities: any[] = [];
  if (profile?.is_super_admin) {
    const { data } = await supabase.from("entities").select("*").eq("is_active", true).order("name");
    entities = data ?? [];
  } else {
    const { data } = await supabase.from("entity_members").select("entities(*)").eq("user_id", user.id);
    entities = (data ?? []).map((r: any) => r.entities).filter(Boolean);
  }

  if (entities.length === 0) {
    redirect("/no-access");
  }

  const cookieStore = cookies();
  const requestedId = cookieStore.get("current_entity")?.value;
  const currentEntity = entities.find((e: any) => e.id === requestedId) ?? entities[0];

  const access = await getCurrentAccess(currentEntity.id);
  if (!access) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar access={access} />
      <div className="flex flex-1 flex-col">
        <TopBar entities={entities as any} currentId={currentEntity.id} userName={profile?.full_name ?? user.email ?? ""} />
        <main className="flex-1 bg-surface-muted p-6">{children}</main>
      </div>
    </div>
  );
}
