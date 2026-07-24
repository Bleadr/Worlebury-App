"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function moveDeal(dealId: string, stageId: string, isWon: boolean, isLost: boolean) {
  const supabase = createClient();
  const status = isWon ? "won" : isLost ? "lost" : "open";
  await supabase
    .from("crm_deals")
    .update({ stage_id: stageId, status, closed_at: isWon || isLost ? new Date().toISOString() : null })
    .eq("id", dealId);
  revalidatePath("/crm/pipeline");
}
