import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createInvoice } from "../actions";

export default async function NewInvoicePage() {
  const entityId = await getEntityId();
  const supabase = createClient();
  const { data: companies } = await supabase.from("crm_companies").select("id, name").eq("entity_id", entityId).order("name");

  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-ink">New invoice</h1>
      <form action={createInvoice} className="space-y-6">
        <Card>
          <CardHeader className="font-medium">Details</CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Invoice number" name="invoice_number" defaultValue={`INV-${Date.now().toString().slice(-6)}`} />
            <Field label="Client name" name="client_name" />
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Account (optional)</label>
              <select name="crm_company_id" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option value="">Not linked to an account</option>
                {(companies ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Field label="Issue date" name="issue_date" type="date" defaultValue={today} />
            <Field label="Due date" name="due_date" type="date" />
            <Field label="Currency" name="currency" defaultValue="GBP" />
            <Field label="Tax rate %" name="tax_rate" type="number" defaultValue="20" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium">Line items</CardHeader>
          <CardBody className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px] gap-2">
                <input name="description" placeholder="Description" className="rounded-lg border border-border px-2 py-1.5 text-sm" />
                <input name="quantity" type="number" placeholder="Qty" defaultValue={1} className="rounded-lg border border-border px-2 py-1.5 text-sm" />
                <input name="unit_price" type="number" placeholder="Unit price" className="rounded-lg border border-border px-2 py-1.5 text-sm" />
              </div>
            ))}
          </CardBody>
        </Card>

        <Button type="submit">Save invoice</Button>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", defaultValue }: { label: string; name: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent" />
    </div>
  );
}
