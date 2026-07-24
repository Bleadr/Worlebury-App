import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { togglePermission } from "./actions";
import type { AppTool } from "@/lib/types";

const TOOLS: { key: AppTool; label: string }[] = [
  { key: "crm", label: "CRM" },
  { key: "finance", label: "Finance" },
  { key: "reporting", label: "Reporting" },
  { key: "resources", label: "Resources" },
  { key: "admin", label: "Admin" },
];
const FIELDS = ["can_view", "can_edit", "can_delete", "can_manage"] as const;

export default async function PermissionsPage() {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();

  const { data: members } = await supabase
    .from("entity_members")
    .select("user_id, role, profiles(full_name)")
    .eq("entity_id", entityId)
    .in("role", ["manager", "member", "read_only"]); // owners/admins already have full access

  const { data: perms } = await supabase
    .from("tool_permissions")
    .select("*")
    .eq("entity_id", entityId);

  const permMap = new Map<string, any>();
  for (const p of perms ?? []) permMap.set(`${p.user_id}:${p.tool}`, p);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Permissions</h1>
        <p className="text-sm text-ink-muted">
          Owners and admins always have full access. For everyone else, choose exactly what they can view, edit, delete, or manage in each tool.
        </p>
      </div>

      {(members ?? []).length === 0 && (
        <p className="text-sm text-ink-muted">No members with restricted roles yet — invite someone as 'Member' or 'Read only' first.</p>
      )}

      {(members ?? []).map((m: any) => (
        <Card key={m.user_id}>
          <CardHeader className="font-medium">{m.profiles?.full_name ?? m.user_id} <span className="ml-2 text-xs font-normal text-ink-muted">({m.role})</span></CardHeader>
          <CardBody className="p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-ink-muted">
                  <th className="px-5 py-2 font-medium">Tool</th>
                  <th className="px-3 py-2 font-medium">View</th>
                  <th className="px-3 py-2 font-medium">Edit</th>
                  <th className="px-3 py-2 font-medium">Delete</th>
                  <th className="px-3 py-2 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map((t) => {
                  const p = permMap.get(`${m.user_id}:${t.key}`) ?? {};
                  return (
                    <tr key={t.key} className="border-t border-border">
                      <td className="px-5 py-2 font-medium text-ink">{t.label}</td>
                      {FIELDS.map((f) => (
                        <td key={f} className="px-3 py-2">
                          <form action={async (fd) => togglePermission(m.user_id, t.key, f, fd.get("v") === "1")}>
                            <input type="hidden" name="v" value={p[f] ? "0" : "1"} />
                            <button
                              type="submit"
                              className={`h-5 w-5 rounded border ${p[f] ? "border-accent bg-accent" : "border-border bg-surface"}`}
                              aria-label={`${f} for ${t.label}`}
                            />
                          </form>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
