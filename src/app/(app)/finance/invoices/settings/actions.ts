"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";

export async function updateInvoiceSettings(formData: FormData): Promise<void> {
  const entityId = await getEntityId();
  const supabase = createClient();

  await supabase.from("invoice_settings").upsert(
    {
      entity_id: entityId,
      company_name: String(formData.get("company_name") || "Worlebury"),
      company_address: String(formData.get("company_address") || "") || null,
      company_email: String(formData.get("company_email") || "") || null,
      company_phone: String(formData.get("company_phone") || "") || null,
      logo_url: String(formData.get("logo_url") || "") || null,
      accent_color: String(formData.get("accent_color") || "#B8863B"),
      footer_note: String(formData.get("footer_note") || "Thank you for your business."),
      payment_terms: String(formData.get("payment_terms") || "Payment due within 30 days."),
      bank_details: String(formData.get("bank_details") || "") || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_id" }
  );

  revalidatePath("/finance/invoices/settings");
  revalidatePath("/finance/invoices");
}
