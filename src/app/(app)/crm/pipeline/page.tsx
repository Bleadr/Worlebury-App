import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/crm/PipelineBoard";

export default async function PipelinePage() {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();

  const { data: pipeline } = await supabase
    .from("crm_pipelines")
    .select("id")
    .eq("entity_id", entityId)
    .eq("is_default", true)
    .single();

  const { data: stages } = await supabase
    .from("crm_pipeline_stages")
    .select("*")
    .eq("pipeline_id", pipeline?.id)
    .order("position");

  const { data: deals } = await supabase
    .from("crm_deals")
    .select("id, title, value_amount, value_currency, stage_id")
    .eq("entity_id", entityId)
    .eq("status", "open");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Pipeline</h1>
        <p className="text-sm text-ink-muted">Drag deals between stages. Totals update per column.</p>
      </div>
      <PipelineBoard stages={stages ?? []} deals={deals ?? []} />
    </div>
  );
}
