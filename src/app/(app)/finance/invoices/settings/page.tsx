import { redirect } from "next/navigation";
import Link from "next/link";
import { getEntityId } from "@/lib/entity";
import { getCurrentAccess } from "@/lib/permissions";
import { getInvoiceSettings } from "@/lib/invoiceSettings";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateInvoiceSettings } from "./actions";

export default async function InvoiceSettingsPage() {
  const entityId = await getEntityId();
  const access = await getCurrentAccess(entityId);
  if (!access?.permissions.finance.manage) redirect("/finance/invoices");

  const settings = await getInvoiceSettings(entityId);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/finance/invoices" className="text-sm text-ink-muted hover:text-ink">← Back to invoices</Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Invoice template</h1>
        <p className="text-sm text-ink-muted">This branding is applied to every invoice's PDF/print view.</p>
      </div>

      <form action={updateInvoiceSettings}>
        <Card>
          <CardHeader className="font-medium">Company details</CardHeader>
          <CardBody className="space-y-4">
            <Field label="Company name" name="company_name" defaultValue={settings.company_name} />
            <Field label="Logo URL" name="logo_url" defaultValue={settings.logo_url ?? ""} hint="Defaults to /logo.png — the app's existing logo." />
            <Field label="Address" name="company_address" defaultValue={settings.company_address ?? ""} textarea />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" name="company_email" defaultValue={settings.company_email ?? ""} />
              <Field label="Phone" name="company_phone" defaultValue={settings.company_phone ?? ""} />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader className="font-medium">Invoice content</CardHeader>
          <CardBody className="space-y-4">
            <Field label="Payment terms" name="payment_terms" defaultValue={settings.payment_terms} />
            <Field label="Bank details" name="bank_details" defaultValue={settings.bank_details ?? ""} textarea hint="Shown at the bottom of the invoice, e.g. sort code and account number." />
            <Field label="Footer note" name="footer_note" defaultValue={settings.footer_note} />
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Accent colour</label>
              <input name="accent_color" type="color" defaultValue={settings.accent_color} className="h-10 w-20 rounded-lg border border-border" />
            </div>
          </CardBody>
        </Card>

        <Button type="submit" className="mt-6">Save template</Button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  textarea,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  textarea?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />
      )}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
