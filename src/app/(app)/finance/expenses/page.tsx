import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { addExpense } from "./actions";

const CATEGORIES = ["travel", "software", "payroll", "marketing", "office", "professional_services", "utilities", "other"];
const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "brand"> = {
  pending: "warning",
  approved: "brand",
  reimbursed: "success",
  rejected: "danger",
};

export default async function ExpensesPage() {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();
  const { data: expenses } = await supabase
    .from("finance_expenses")
    .select("*")
    .eq("entity_id", entityId)
    .order("expense_date", { ascending: false });

  const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Expenses</h1>
        <p className="text-sm text-ink-muted">£{total.toLocaleString()} total this view</p>
      </div>

      <Card>
        <CardHeader className="font-medium">Log an expense</CardHeader>
        <CardBody>
          <form action={addExpense} className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <input name="description" placeholder="Description" required className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="vendor" placeholder="Vendor" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <select name="category" className="rounded-lg border border-border px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
            <input name="amount" type="number" step="0.01" placeholder="Amount" required className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="currency" defaultValue="GBP" className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input name="expense_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-lg border border-border px-3 py-2 text-sm" />
            <Button type="submit" className="col-span-full w-fit">Add expense</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Description</Th><Th>Vendor</Th><Th>Category</Th><Th>Status</Th><Th>Amount</Th>
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
                </tr>
              ))}
              {(expenses ?? []).length === 0 && (
                <tr><Td colSpan={6} className="text-center text-ink-muted">No expenses logged yet.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
