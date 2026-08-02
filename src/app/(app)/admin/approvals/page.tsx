import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { getCurrentAccess } from "@/lib/permissions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { approveExpense, rejectExpense } from "../../finance/expenses/actions";

// Super-admin-only queue of everything waiting on a decision. Right now
// that's just expenses, but this is the natural home for any future
// approval type (e.g. invoice write-offs, resource requests).
export default async function ApprovalsPage() {
  const entityId = await getEntityId();
  const access = await getCurrentAccess(entityId);
  if (!access?.isSuperAdmin) redirect("/dashboard");

  const supabase = createClient();
  const { data: expenses } = await supabase
    .from("finance_expenses")
    .select("id, description, vendor, category, amount, currency, expense_date, submitted_by, profiles:submitted_by(full_name)")
    .eq("entity_id", entityId)
    .eq("status", "pending")
    .order("expense_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Approvals</h1>
        <p className="text-sm text-ink-muted">Only you can approve or decline these — everyone else can submit, but not sign off.</p>
      </div>

      <Card>
        <CardHeader className="font-medium">Expenses awaiting a decision ({(expenses ?? []).length})</CardHeader>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Description</Th><Th>Submitted by</Th><Th>Category</Th><Th>Amount</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {(expenses ?? []).map((e: any) => (
                <tr key={e.id}>
                  <Td>{e.expense_date}</Td>
                  <Td className="font-medium text-ink">
                    {e.description}
                    {e.vendor && <span className="text-ink-muted"> · {e.vendor}</span>}
                  </Td>
                  <Td>{e.profiles?.full_name ?? "—"}</Td>
                  <Td>{e.category.replace("_", " ")}</Td>
                  <Td>{e.currency} {Number(e.amount).toLocaleString()}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <form action={async () => approveExpense(e.id)}>
                        <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Approve</button>
                      </form>
                      <form action={async () => rejectExpense(e.id)}>
                        <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">Decline</button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))}
              {(expenses ?? []).length === 0 && (
                <tr><Td colSpan={6} className="text-center text-ink-muted">Nothing waiting on you right now.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
