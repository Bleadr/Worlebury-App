import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { getCurrentAccess } from "@/lib/permissions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { togglePermission } from "../../permissions/actions";
import { updateMemberRole, removeMember } from "../actions";
import type { AppTool } from "@/lib/types";

const TOOLS: { key: AppTool; label: string; hint: string }[] = [
  { key: "crm", label: "CRM", hint: "Contacts, companies, deals, pipeline" },
  { key: "finance", label: "Finance", hint: "Invoices, expenses, accounts" },
  { key: "reporting", label: "Reporting", hint: "Dashboards and reports" },
  { key: "resources", label: "Resources", hint: "Files and asset library" },
  { key: "admin", label: "Admin", hint: "Users and access management" },
];
const FIELDS = [
  { key: "can_view", label: "View" },
  { key: "can_edit", label: "Edit" },
  { key: "can_delete", label: "Delete" },
  { key: "can_manage", label: "Manage" },
] as const;

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const entityId = await getEntityId();
  const supabase = createClient();

  const access = await getCurrentAccess(entityId);
  const isViewingSelf = access?.userId === params.id;

  const { data: member } = await supabase
    .from("entity_members")
    .select("user_id, role, profiles(full_name, is_super_admin)")
    .eq("entity_id", entityId)
    .eq("user_id", params.id)
    .maybeSingle();

  if (!member) notFound();

  const profile: any = member.profiles;
  const hasFullAccess = profile?.is_super_admin || member.role === "owner" || member.role === "admin";

  let email = "";
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(params.id);
    email = data.user?.email ?? "";
  } catch {
    // Non-fatal — email is a nice-to-have here, the page still works without it.
  }

  const { data: perms } = await supabase
    .from("tool_permissions")
    .select("*")
    .eq("entity_id", entityId)
    .eq("user_id", params.id);

  const permMap = new Map<string, any>();
  for (const p of perms ?? []) permMap.set(p.tool, p);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-ink-muted hover:text-ink">← Back to users</Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-ink">{profile?.full_name ?? "Unnamed user"}</h1>
          {profile?.is_super_admin && <Badge tone="warning">super admin</Badge>}
        </div>
        {email && <p className="text-sm text-ink-muted">{email}</p>}
      </div>

      <Card>
        <CardHeader className="font-medium">Role</CardHeader>
        <CardBody>
          <form action={async (fd) => updateMemberRole(member.user_id, String(fd.get("role")) as any)} className="flex items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Entity role</label>
              <select
                name="role"
                defaultValue={member.role}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
                <option value="read_only">Read only</option>
              </select>
            </div>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
              Save role
            </button>
          </form>
          <p className="mt-2 text-xs text-ink-muted">Owners and admins always have full access to every tool, regardless of the toggles below.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-medium">Tool access</CardHeader>
        <CardBody className="p-0">
          {hasFullAccess ? (
            <p className="px-5 py-4 text-sm text-ink-muted">
              This person has the '{member.role}' role{profile?.is_super_admin ? " and is a super admin" : ""}, so they already have full access to every tool. Change their role above to grant only specific permissions instead.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-ink-muted">
                  <th className="px-5 py-2 font-medium">Tool</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} className="px-3 py-2 font-medium">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOOLS.map((t) => {
                  const p = permMap.get(t.key) ?? {};
                  return (
                    <tr key={t.key} className="border-t border-border">
                      <td className="px-5 py-2">
                        <div className="font-medium text-ink">{t.label}</div>
                        <div className="text-xs text-ink-muted">{t.hint}</div>
                      </td>
                      {FIELDS.map((f) => (
                        <td key={f.key} className="px-3 py-2">
                          <form action={async (fd) => togglePermission(member.user_id, t.key, f.key, fd.get("v") === "1")}>
                            <input type="hidden" name="v" value={p[f.key] ? "0" : "1"} />
                            <button
                              type="submit"
                              className={`h-5 w-5 rounded border transition-colors ${p[f.key] ? "border-accent bg-accent" : "border-border bg-surface"}`}
                              aria-label={`${f.label} for ${t.label}`}
                            />
                          </form>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {!isViewingSelf && (
        <Card>
          <CardHeader className="font-medium text-red-600">Danger zone</CardHeader>
          <CardBody>
            <p className="mb-3 text-sm text-ink-muted">Removes this person from the team. They'll lose access immediately.</p>
            <form action={async () => removeMember(member.user_id)}>
              <ConfirmButton
                message={`Remove ${profile?.full_name ?? "this person"} from the team? They'll lose access immediately.`}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                Remove from team
              </ConfirmButton>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
