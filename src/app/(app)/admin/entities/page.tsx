import { createClient } from "@/lib/supabase/server";
import { getCurrentAccess } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createEntity } from "@/app/(app)/actions";

export default async function EntitiesAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user!.id).single();

  const currentEntityId = cookies().get("current_entity")?.value;
  const access = currentEntityId ? await getCurrentAccess(currentEntityId) : null;
  if (!profile?.is_super_admin && !access?.permissions.admin.manage) redirect("/dashboard");

  const { data: entities } = await supabase.from("entities").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Entities</h1>
        <p className="text-sm text-ink-muted">Companies using this platform. Each entity has its own CRM, finance, and resource data, fully isolated from the others.</p>
      </div>

      {profile?.is_super_admin && (
        <Card>
          <CardHeader className="font-medium">Create a new entity</CardHeader>
          <CardBody>
            <form action={createEntity} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-ink">Company name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Worlebury Consulting Ltd"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <Button type="submit">Create entity</Button>
            </form>
            <p className="mt-2 text-xs text-ink-muted">
              Only super admins can create new entities. A default sales pipeline is set up automatically.
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="font-medium">All entities</CardHeader>
        <CardBody className="divide-y divide-border p-0">
          {(entities ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{e.name}</p>
                <p className="text-xs text-ink-muted">{e.slug}</p>
              </div>
              <span className="text-xs text-ink-muted">{e.is_active ? "Active" : "Inactive"}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
