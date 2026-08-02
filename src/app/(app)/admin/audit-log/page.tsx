import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { getCurrentAccess } from "@/lib/permissions";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";

const ACTION_LABEL: Record<string, string> = {
  "expense.approved": "Approved an expense",
  "expense.rejected": "Declined an expense",
  "expense.reimbursed": "Marked an expense reimbursed",
  "invoice.deleted": "Deleted an invoice",
  "member.role_changed": "Changed a team member's role",
  "member.removed": "Removed a team member",
};

// Read-only trail of the sensitive actions logged via src/lib/audit.ts —
// approvals, deletions, role/permission changes. Visible to owners, admins
// and super admins only (also enforced by RLS on audit_log itself).
export default async function AuditLogPage() {
  const entityId = await getEntityId();
  const access = await getCurrentAccess(entityId);
  if (!access || !(access.isSuperAdmin || access.role === "owner" || access.role === "admin")) {
    redirect("/dashboard");
  }

  const supabase = createClient();
  const { data: entries } = await supabase
    .from("audit_log")
    .select("id, action, target_table, target_id, metadata, created_at, profiles:actor_id(full_name)")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Audit log</h1>
        <p className="text-sm text-ink-muted">The last 100 sensitive actions — approvals, deletions, and access changes.</p>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Details</Th></tr>
            </thead>
            <tbody>
              {(entries ?? []).map((e: any) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap">{new Date(e.created_at).toLocaleString("en-GB")}</Td>
                  <Td>{e.profiles?.full_name ?? "System"}</Td>
                  <Td className="font-medium text-ink">{ACTION_LABEL[e.action] ?? e.action}</Td>
                  <Td className="text-ink-muted">
                    {e.metadata && Object.keys(e.metadata).length > 0 ? JSON.stringify(e.metadata) : "—"}
                  </Td>
                </tr>
              ))}
              {(entries ?? []).length === 0 && (
                <tr><Td colSpan={4} className="text-center text-ink-muted">Nothing logged yet.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
