import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { getCurrentAccess } from "@/lib/permissions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { addExpense, approveExpense, rejectExpense, markExpenseReimbursed } from "./actions";

const CATEGORIES = ["travel", "software", "payroll", "marketing", "office", "professional_services", "utilities", "other"];
const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "brand"> = {
  pending: "warning",
  approved: "brand",
  reimbursed: "success",
  rejected: "danger",
};

export default async function ExpensesPage() {
  const entityId = await getEntityId();
  const supabase = createClient();
  const access = await getCurrentAccess(entityId);

  const { data: expenses } = await supabase
    .from("finance_expenses")
    .select("*")
    .eq("entity_id", entityId)
    .order("expense_date", { ascending: false });

  const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const pendingCount = (expenses ?? []).filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Expenses</h1>
        <p className="text-sm text-ink-muted">
          £{total.toLocaleString()} total this view
          {pendingCount > 0 && <span className="ml-2 text-amber-600">· {pendingCount} awaiting approval</span>}
        </p>
      </div>

      <Card>
        <CardHeader className="font-medium">Log an expense</CardHeader>
        <CardBody>
          <form action={addExpense} className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <input name="description" placeholder="Description" required className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="vendor" placeholder="Vendor" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <select name="category" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
            <input name="amount" type="number" step="0.01" placeholder="Amount" required className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="currency" defaultValue="GBP" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="expense_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-lg border border-border px-3 py-2 text-sm" />
            <Button type="submit" className="col-span-full w-fit">Add expense</Button>
          </form>
          <p className="mt-2 text-xs text-ink-muted">New expenses start as 'pending' until a super admin approves or declines them.</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Description</Th><Th>Vendor</Th><Th>Category</Th><Th>Status</Th><Th>Amount</Th>
                {access?.isSuperAdmin && <Th></Th>}
              </tr>
            </thead>
            <tbody>
              {(expenses ?? []).map((e) => (
                <tr key={e.id}>
                  <Td>{e.expense_date}</Td>
                  <Td className="font-medium text-ink">{e.description}</Td>
                  <Td>{e.vendor ?? "—"}</Td>
                  <Td>{e.category.replace("_", " ")}</Td>
                  <Td><Badge tone={STATUS_TONE[e.status] ?? "neutral"}>{e.status}</Badge></Td>
                  <Td>{e.currency} {Number(e.amount).toLocaleString()}</Td>
                  {access?.isSuperAdmin && (
                    <Td>
                      <div className="flex gap-2">
                        {e.status === "pending" && (
                          <>
                            <form action={async () => approveExpense(e.id)}>
                              <button className="text-xs font-medium text-emerald-600 hover:underline">Approve</button>
                            </form>
                            <form action={async () => rejectExpense(e.id)}>
                              <button className="text-xs font-medium text-red-600 hover:underline">Decline</button>
                            </form>
                          </>
                        )}
                        {e.status === "approved" && (
                          <form action={async () => markExpenseReimbursed(e.id)}>
                            <button className="text-xs font-medium text-accent hover:underline">Mark reimbursed</button>
                          </form>
                        )}
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
              {(expenses ?? []).length === 0 && (
                <tr><Td colSpan={access?.isSuperAdmin ? 7 : 6} className="text-center text-ink-muted">No expenses logged yet.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
