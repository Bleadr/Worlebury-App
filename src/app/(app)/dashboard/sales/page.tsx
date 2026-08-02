import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { DealsByStageChart } from "@/components/dashboard/Charts";

export default async function SalesDashboardPage() {
  const entityId = await getEntityId();
  const supabase = createClient();

  const { data: pipeline } = await supabase.from("crm_pipelines").select("id").eq("entity_id", entityId).eq("is_default", true).single();
  const { data: stages } = await supabase.from("crm_pipeline_stages").select("*").eq("pipeline_id", pipeline?.id).order("position");
  const { data: deals } = await supabase.from("crm_deals").select("stage_id, value_amount, status").eq("entity_id", entityId);

  const chartData = (stages ?? []).map((s) => ({
    name: s.name,
    value: (deals ?? []).filter((d) => d.stage_id === s.id && d.status === "open").reduce((sum, d) => sum + Number(d.value_amount), 0),
  }));

  const won = (deals ?? []).filter((d) => d.status === "won").length;
  const lost = (deals ?? []).filter((d) => d.status === "lost").length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Sales dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Deals won" value={`${won}`} />
        <StatCard label="Deals lost" value={`${lost}`} />
        <StatCard label="Win rate" value={`${winRate}%`} />
      </div>

      <Card>
        <CardHeader className="font-medium">Pipeline value by stage</CardHeader>
        <CardBody><DealsByStageChart data={chartData} /></CardBody>
      </Card>
    </div>
  );
}
