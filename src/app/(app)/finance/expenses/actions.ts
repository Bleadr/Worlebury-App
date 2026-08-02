"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { logAudit } from "@/lib/audit";

export async function addExpense(formData: FormData): Promise<void> {
  const entityId = await getEntityId();
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
    status: "pending",
  });

  revalidatePath("/finance/expenses");
}

// Approvals are gated to super admins only (checked server-side here, not
// just hidden in the UI — the guard_expense_status_change trigger added in
// 0007_v2_updates.sql also blocks any status change at the DB level unless
// the caller is a super admin, so this check is defense in depth, not the
// only line of defence).
async function assertSuperAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single();
  if (!profile?.is_super_admin) throw new Error("Only a super admin can approve or decline expenses.");
  return user;
}

export async function approveExpense(expenseId: string): Promise<void> {
  const user = await assertSuperAdmin();
  const entityId = await getEntityId();
  const supabase = createClient();
  await supabase
    .from("finance_expenses")
    .update({ status: "approved", approved_by: user.id })
    .eq("id", expenseId);
  await logAudit(entityId, "expense.approved", { table: "finance_expenses", id: expenseId });
  revalidatePath("/finance/expenses");
  revalidatePath("/admin/approvals");
}

export async function rejectExpense(expenseId: string): Promise<void> {
  const user = await assertSuperAdmin();
  const entityId = await getEntityId();
  const supabase = createClient();
  await supabase
    .from("finance_expenses")
    .update({ status: "rejected", approved_by: user.id })
    .eq("id", expenseId);
  await logAudit(entityId, "expense.rejected", { table: "finance_expenses", id: expenseId });
  revalidatePath("/finance/expenses");
  revalidatePath("/admin/approvals");
}

export async function markExpenseReimbursed(expenseId: string): Promise<void> {
  await assertSuperAdmin();
  const entityId = await getEntityId();
  const supabase = createClient();
  await supabase.from("finance_expenses").update({ status: "reimbursed" }).eq("id", expenseId);
  await logAudit(entityId, "expense.reimbursed", { table: "finance_expenses", id: expenseId });
  revalidatePath("/finance/expenses");
}
