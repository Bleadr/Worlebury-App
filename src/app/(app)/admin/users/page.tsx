import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { inviteUser, updateMemberRole, removeMember } from "./actions";

export default async function UsersAdminPage() {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();

  const { data: members } = await supabase
    .from("entity_members")
    .select("user_id, role, profiles(full_name)")
    .eq("entity_id", entityId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Users</h1>
        <p className="text-sm text-ink-muted">Invite teammates to this entity and set their role. Accounts can only be created here — there's no public sign-up.</p>
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
              <select name="role" defaultValue="member" className="rounded-lg border border-border px-3 py-2 text-sm">
                <option value="admin">Admin (full access)</option>
                <option value="manager">Manager</option>
                <option value="member">Member (set tool permissions after)</option>
                <option value="read_only">Read only</option>
              </select>
            </div>
            <Button type="submit">Send invite</Button>
          </form>
          <p className="mt-2 text-xs text-ink-muted">
            'Member' and 'Read only' roles have no access by default — grant specific tool permissions under Admin &gt; Permissions.
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
                  <Td>{m.profiles?.full_name ?? m.user_id}</Td>
                  <Td>
                    <form action={async (fd) => updateMemberRole(m.user_id, String(fd.get("role")) as any)} className="inline">
                      <select
                        name="role"
                        defaultValue={m.role}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="rounded-lg border border-border px-2 py-1 text-xs"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                        <option value="read_only">Read only</option>
                      </select>
                    </form>
                  </Td>
                  <Td>
                    <form action={async () => removeMember(m.user_id)}>
                      <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                    </form>
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
