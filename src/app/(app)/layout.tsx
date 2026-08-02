import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
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

  const entityId = await getEntityId();

  const { data: entity } = await supabase.from("entities").select("name").eq("id", entityId).single();

  const access = await getCurrentAccess(entityId);
  if (!access) redirect("/login");

  const { count: pendingApprovals } = access.isSuperAdmin
    ? await supabase
        .from("finance_expenses")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", entityId)
        .eq("status", "pending")
    : { count: 0 };

  return (
    <div className="flex min-h-screen">
      <Sidebar access={access} pendingApprovals={pendingApprovals ?? 0} />
      <div className="flex flex-1 flex-col">
        <TopBar
          entityName={entity?.name ?? "Worlebury"}
          userName={profile?.full_name ?? user.email ?? ""}
        />
        <main className="flex-1 bg-surface-muted p-6 print:bg-white print:p-0">{children}</main>
      </div>
    </div>
  );
}
