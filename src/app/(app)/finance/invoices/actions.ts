"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function createInvoice(formData: FormData): Promise<void> {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const descriptions = formData.getAll("description") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitPrices = formData.getAll("unit_price") as string[];

  const lines = descriptions
    .map((description, idx) => ({
      description,
      quantity: Number(quantities[idx] || 1),
      unit_price: Number(unitPrices[idx] || 0),
      position: idx,
    }))
    .filter((l) => l.description)
    .map((l) => ({ ...l, line_total: l.quantity * l.unit_price }));

  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const taxRate = Number(formData.get("tax_rate") || 0) / 100;
  const tax_amount = Math.round(subtotal * taxRate * 100) / 100;

  const { data: invoice, error } = await supabase
    .from("finance_invoices")
    .insert({
      entity_id: entityId,
      invoice_number: String(formData.get("invoice_number")),
      client_name: String(formData.get("client_name")),
      issue_date: String(formData.get("issue_date")),
      due_date: String(formData.get("due_date")) || null,
      currency: String(formData.get("currency") || "GBP"),
      subtotal,
      tax_amount,
      total: subtotal + tax_amount,
      status: "draft",
      created_by: user?.id,
    })
    .select()
    .single();

  if (error || !invoice) throw new Error(error?.message ?? "Could not create invoice.");

  if (lines.length > 0) {
    await supabase.from("finance_invoice_lines").insert(lines.map((l) => ({ ...l, invoice_id: invoice.id })));
  }

  redirect("/finance/invoices");
}
