import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default async function DashboardOverviewPage() {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();

  const [{ data: openDeals }, { data: invoices }, { data: expenses }, { data: contacts }] = await Promise.all([
    supabase.from("crm_deals").select("value_amount").eq("entity_id", entityId).eq("status", "open"),
    supabase.from("finance_invoices").select("total, status").eq("entity_id", entityId),
    supabase.from("finance_expenses").select("amount, expense_date").eq("entity_id", entityId),
    supabase.from("crm_contacts").select("id").eq("entity_id", entityId),
  ]);

  const pipelineValue = (openDeals ?? []).reduce((s, d) => s + Number(d.value_amount), 0);
  const outstanding = (invoices ?? []).filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.total), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const spendThisMonth = (expenses ?? []).filter((e) => e.expense_date?.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Overview</h1>
        <p className="text-sm text-ink-muted">A snapshot across the business.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open pipeline" value={`£${pipelineValue.toLocaleString()}`} sub={`${openDeals?.length ?? 0} open deals`} />
        <StatCard label="Outstanding invoices" value={`£${outstanding.toLocaleString()}`} />
        <StatCard label="Spend this month" value={`£${spendThisMonth.toLocaleString()}`} />
        <StatCard label="Contacts" value={`${contacts?.length ?? 0}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/sales"><Card className="p-5 hover:border-accent-light"><p className="font-medium text-ink">Sales dashboard →</p><p className="text-sm text-ink-muted">Pipeline breakdown & win rate</p></Card></Link>
        <Link href="/dashboard/finance"><Card className="p-5 hover:border-accent-light"><p className="font-medium text-ink">Finance dashboard →</p><p className="text-sm text-ink-muted">Invoices, expenses, cash flow</p></Card></Link>
        <Link href="/dashboard/team"><Card className="p-5 hover:border-accent-light"><p className="font-medium text-ink">Team dashboard →</p><p className="text-sm text-ink-muted">Activity by teammate</p></Card></Link>
      </div>
    </div>
  );
}
