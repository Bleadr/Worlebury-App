import Link from "next/link";
import { TrendingUp, Receipt, Wallet, Users, Plus, ListChecks, ArrowRight, ClipboardCheck, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { getCurrentAccess } from "@/lib/permissions";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}
function monthLabel(key: string) {
  return new Date(`${key}-01`).toLocaleDateString("en-GB", { month: "short" });
}

export default async function DashboardOverviewPage() {
  const entityId = await getEntityId();
  const supabase = createClient();
  const access = await getCurrentAccess(entityId);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user?.id).single();

  const [
    { data: openDeals },
    { data: invoices },
    { data: expenses },
    { data: contacts },
    { data: activities },
    { data: todoCards },
  ] = await Promise.all([
    supabase.from("crm_deals").select("value_amount").eq("entity_id", entityId).eq("status", "open"),
    supabase.from("finance_invoices").select("total, status, issue_date, paid_at, invoice_number, client_name").eq("entity_id", entityId),
    supabase.from("finance_expenses").select("amount, expense_date, status").eq("entity_id", entityId),
    supabase.from("crm_contacts").select("id").eq("entity_id", entityId),
    supabase
      .from("crm_activities")
      .select("id, type, body, created_at, crm_contacts(first_name, last_name), profiles:created_by(full_name)")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("todo_cards").select("status, due_date").eq("entity_id", entityId),
  ]);

  const pipelineValue = (openDeals ?? []).reduce((s, d) => s + Number(d.value_amount), 0);
  const outstanding = (invoices ?? []).filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.total), 0);

  const now = new Date();
  const thisMonth = monthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = monthKey(lastMonthDate);

  const spendThisMonth = (expenses ?? []).filter((e) => e.expense_date?.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0);
  const spendLastMonth = (expenses ?? []).filter((e) => e.expense_date?.startsWith(lastMonth)).reduce((s, e) => s + Number(e.amount), 0);
  const spendDelta = spendLastMonth > 0 ? ((spendThisMonth - spendLastMonth) / spendLastMonth) * 100 : 0;

  // Last 6 months of paid revenue vs logged expenses, oldest first.
  const months = Array.from({ length: 6 }).map((_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)));
  const trendData = months.map((m) => ({
    name: monthLabel(m),
    revenue: (invoices ?? []).filter((i) => i.status === "paid" && i.paid_at?.startsWith(m)).reduce((s, i) => s + Number(i.total), 0),
    expenses: (expenses ?? []).filter((e) => e.expense_date?.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0),
  }));

  const todoOpenCount = (todoCards ?? []).filter((c) => c.status !== "done").length;
  const todoDueSoonCount = (todoCards ?? []).filter((c) => {
    if (!c.due_date || c.status === "done") return false;
    const days = (new Date(c.due_date).getTime() - now.getTime()) / 86_400_000;
    return days <= 3;
  }).length;

  const pendingApprovals = access?.isSuperAdmin
    ? (expenses ?? []).filter((e) => e.status === "pending").length
    : 0;

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = (profile?.full_name ?? "").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-card bg-ink p-6 text-surface-muted">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-serif text-xl font-semibold">{greeting}{firstName ? `, ${firstName}` : ""}.</p>
            <p className="mt-1 text-sm text-brand-300">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              {outstanding > 0 && <> · £{outstanding.toLocaleString()} outstanding across invoices</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickAction href="/finance/invoices/new" icon={Plus} label="New invoice" />
            <QuickAction href="/crm/contacts" icon={Users} label="New contact" />
            <QuickAction href="/todo" icon={ListChecks} label="To-do board" />
          </div>
        </div>
      </div>

      {pendingApprovals > 0 && (
        <Link href="/admin/approvals">
          <Card className="border-amber-200 bg-amber-50 p-4 hover:border-amber-300">
            <div className="flex items-center gap-3">
              <ClipboardCheck size={18} className="text-amber-700" />
              <p className="text-sm font-medium text-amber-800">
                {pendingApprovals} expense{pendingApprovals === 1 ? "" : "s"} waiting on your approval
              </p>
              <ArrowRight size={14} className="ml-auto text-amber-700" />
            </div>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open pipeline" value={`£${pipelineValue.toLocaleString()}`} sub={`${openDeals?.length ?? 0} open deals`} icon={TrendingUp} />
        <StatCard label="Outstanding invoices" value={`£${outstanding.toLocaleString()}`} icon={Receipt} />
        <StatCard
          label="Spend this month"
          value={`£${spendThisMonth.toLocaleString()}`}
          icon={Wallet}
          trend={spendLastMonth > 0 ? { value: spendDelta, positive: spendDelta <= 0 } : undefined}
        />
        <StatCard label="Contacts" value={`${contacts?.length ?? 0}`} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="font-medium">Revenue vs. expenses — last 6 months</CardHeader>
          <CardBody>
            <RevenueTrendChart data={trendData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between font-medium">
            <span>To-do board</span>
            <Link href="/todo" className="text-xs font-normal text-accent hover:underline">Open →</Link>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">Open cards</span>
              <span className="text-lg font-semibold text-ink">{todoOpenCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">Due within 3 days</span>
              {todoDueSoonCount > 0 ? <Badge tone="warning">{todoDueSoonCount}</Badge> : <span className="text-sm text-ink-muted">—</span>}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="font-medium">Recent activity</CardHeader>
          <CardBody className="space-y-3">
            {(activities ?? []).map((a: any) => (
              <div key={a.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <span className="font-medium text-ink">{a.profiles?.full_name ?? "Someone"}</span>{" "}
                  <span className="text-ink-muted">
                    logged a {a.type}
                    {a.crm_contacts && <> with {a.crm_contacts.first_name} {a.crm_contacts.last_name ?? ""}</>}
                  </span>
                  {a.body && <p className="mt-0.5 text-ink-muted">{a.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-muted">{new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
            {(activities ?? []).length === 0 && <p className="text-sm text-ink-muted">No activity logged yet.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium">Jump to</CardHeader>
          <CardBody className="space-y-1">
            <DashLink href="/dashboard/sales" label="Sales dashboard" sub="Pipeline breakdown & win rate" />
            <DashLink href="/dashboard/finance" label="Finance dashboard" sub="Invoices, expenses, cash flow" />
            <DashLink href="/dashboard/team" label="Team dashboard" sub="Activity by teammate" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-surface-muted backdrop-blur-sm transition-colors hover:bg-white/20"
    >
      <Icon size={14} /> {label}
    </Link>
  );
}

function DashLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-muted">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
      </div>
      <ArrowRight size={14} className="text-ink-muted" />
    </Link>
  );
}
