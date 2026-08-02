import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { inviteUser } from "./actions";

const ROLE_TONE: Record<string, "brand" | "neutral"> = {
  owner: "brand",
  admin: "brand",
  manager: "neutral",
  member: "neutral",
  read_only: "neutral",
};

export default async function UsersAdminPage() {
  const entityId = await getEntityId();
  const supabase = createClient();

  const { data: members } = await supabase
    .from("entity_members")
    .select("user_id, role, profiles(full_name, is_super_admin)")
    .eq("entity_id", entityId)
    .order("role");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Users</h1>
        <p className="text-sm text-ink-muted">
          Invite teammates and manage who can see and do what. Accounts can only be created here — there's no public sign-up.
        </p>
      </div>

      <Card>
        <CardHeader className="font-medium">Invite someone</CardHeader>
        <CardBody>
          <form action={inviteUser} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-sm font-medium text-ink">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="colleague@worlebury.co.uk"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Role</label>
              <select name="role" defaultValue="member" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="admin">Admin (full access)</option>
                <option value="manager">Manager</option>
                <option value="member">Member (set tool permissions after)</option>
                <option value="read_only">Read only</option>
              </select>
            </div>
            <Button type="submit">Send invite</Button>
          </form>
          <p className="mt-2 text-xs text-ink-muted">
            'Member' and 'Read only' roles have no access by default — open their profile below to grant specific tool permissions.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-medium">Team members</CardHeader>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m: any) => (
                <tr key={m.user_id}>
                  <Td className="font-medium text-ink">
                    <Link href={`/admin/users/${m.user_id}`} className="hover:text-accent hover:underline">
                      {m.profiles?.full_name ?? m.user_id}
                    </Link>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <Badge tone={ROLE_TONE[m.role] ?? "neutral"}>{m.role.replace("_", " ")}</Badge>
                      {m.profiles?.is_super_admin && <Badge tone="warning">super admin</Badge>}
                    </span>
                  </Td>
                  <Td>
                    <Link href={`/admin/users/${m.user_id}`} className="text-xs font-medium text-accent hover:underline">
                      Manage access →
                    </Link>
                  </Td>
                </tr>
              ))}
              {(members ?? []).length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-ink-muted">No team members yet.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
