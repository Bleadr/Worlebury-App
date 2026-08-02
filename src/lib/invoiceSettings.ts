import { createClient } from "@/lib/supabase/server";

export interface InvoiceSettings {
  entity_id: string;
  company_name: string;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  logo_url: string | null;
  accent_color: string;
  footer_note: string;
  payment_terms: string;
  bank_details: string | null;
  next_invoice_number: number;
}

const DEFAULTS: Omit<InvoiceSettings, "entity_id"> = {
  company_name: "Worlebury",
  company_address: null,
  company_email: null,
  company_phone: null,
  logo_url: "/logo.png",
  accent_color: "#B8863B",
  footer_note: "Thank you for your business.",
  payment_terms: "Payment due within 30 days.",
  bank_details: null,
  next_invoice_number: 1,
};

// The invoice_settings row is created lazily — most entities will never
// touch it and can just use the Worlebury defaults above, so there's no
// migration-time seeding to worry about.
export async function getInvoiceSettings(entityId: string): Promise<InvoiceSettings> {
  const supabase = createClient();
  const { data } = await supabase.from("invoice_settings").select("*").eq("entity_id", entityId).maybeSingle();
  if (data) return data as InvoiceSettings;
  return { entity_id: entityId, ...DEFAULTS };
}
