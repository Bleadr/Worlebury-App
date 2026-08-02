import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusPieChart, DealsByStageChart } from "@/components/dashboard/Charts";

export default async function FinanceDashboardPage() {
  const entityId = await getEntityId();
  const supabase = createClient();

  const { data: invoices } = await supabase.from("finance_invoices").select("status, total").eq("entity_id", entityId);
  const { data: expenses } = await supabase.from("finance_expenses").select("category, amount").eq("entity_id", entityId);

  const invoiceByStatus = ["draft", "sent", "paid", "overdue", "void"].map((s) => ({
    name: s,
    value: (invoices ?? []).filter((i) => i.status === s).length,
  })).filter((x) => x.value > 0);

  const expenseByCategory = Array.from(
    (expenses ?? []).reduce((map, e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
      return map;
    }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  const totalPaid = (invoices ?? []).filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const totalExpense = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Finance dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Revenue collected" value={`£${totalPaid.toLocaleString()}`} />
        <StatCard label="Total expenses" value={`£${totalExpense.toLocaleString()}`} />
        <StatCard label="Net" value={`£${(totalPaid - totalExpense).toLocaleString()}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader className="font-medium">Invoices by status</CardHeader><CardBody><StatusPieChart data={invoiceByStatus} /></CardBody></Card>
        <Card><CardHeader className="font-medium">Expenses by category</CardHeader><CardBody><DealsByStageChart data={expenseByCategory} /></CardBody></Card>
      </div>
    </div>
  );
}
