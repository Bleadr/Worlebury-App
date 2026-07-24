"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function addExpense(formData: FormData) {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("finance_expenses").insert({
    entity_id: entityId,
    category: String(formData.get("category")),
    description: String(formData.get("description")),
    amount: Number(formData.get("amount")),
    currency: String(formData.get("currency") || "GBP"),
    expense_date: String(formData.get("expense_date")),
    vendor: String(formData.get("vendor") || "") || null,
    submitted_by: user?.id,
  });

  revalidatePath("/finance/expenses");
}
