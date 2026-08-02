import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { getInvoiceSettings } from "@/lib/invoiceSettings";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteInvoice, updateInvoiceStatus, updateInvoiceAccount } from "../actions";
import { PrintButton } from "./PrintButton";

const STATUSES = ["draft", "sent", "paid", "overdue", "void"];

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const entityId = await getEntityId();
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("finance_invoices")
    .select("*, crm_companies(id, name)")
    .eq("entity_id", entityId)
    .eq("id", params.id)
    .maybeSingle();

  if (!invoice) notFound();

  const { data: lines } = await supabase
    .from("finance_invoice_lines")
    .select("*")
    .eq("invoice_id", invoice.id)
    .order("position");

  const { data: companies } = await supabase.from("crm_companies").select("id, name").eq("entity_id", entityId).order("name");

  const settings = await getInvoiceSettings(entityId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Screen-only controls — hidden entirely when printing */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/finance/invoices" className="text-sm text-ink-muted hover:text-ink">← Back to invoices</Link>
        <div className="flex flex-wrap items-center gap-3">
          <form action={async (fd) => updateInvoiceStatus(invoice.id, String(fd.get("status")))}>
            <select
              name="status"
              defaultValue={invoice.status}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </form>
          <form action={async (fd) => updateInvoiceAccount(invoice.id, String(fd.get("crm_company_id")))}>
            <select
              name="crm_company_id"
              defaultValue={invoice.crm_company_id ?? ""}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">No linked account</option>
              {(companies ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </form>
          <PrintButton />
          <form action={async () => deleteInvoice(invoice.id)}>
            <ConfirmButton
              message={`Delete invoice ${invoice.invoice_number}? This can't be undone.`}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>

      {/* Printable invoice */}
      <div className="rounded-card border border-border bg-surface p-10 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-border pb-8">
          <div className="flex items-center gap-3">
            {settings.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt={settings.company_name} className="h-12 w-12 rounded-lg object-contain" />
            )}
            <div>
              <div className="font-serif text-lg font-semibold text-ink">{settings.company_name}</div>
              {settings.company_address && <div className="whitespace-pre-line text-xs text-ink-muted">{settings.company_address}</div>}
              {settings.company_email && <div className="text-xs text-ink-muted">{settings.company_email}</div>}
              {settings.company_phone && <div className="text-xs text-ink-muted">{settings.company_phone}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-serif text-2xl font-semibold text-ink">Invoice</div>
            <div className="text-sm text-ink-muted">{invoice.invoice_number}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">Billed to</div>
            <div className="mt-1 font-medium text-ink">{invoice.client_name}</div>
            {invoice.crm_companies?.name && <div className="text-sm text-ink-muted">{invoice.crm_companies.name}</div>}
          </div>
          <div className="text-right text-sm">
            <div><span className="text-ink-muted">Issue date: </span>{invoice.issue_date}</div>
            <div><span className="text-ink-muted">Due date: </span>{invoice.due_date ?? "—"}</div>
            <div><span className="text-ink-muted">Status: </span><span className="capitalize">{invoice.status}</span></div>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Unit price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(lines ?? []).map((l) => (
              <tr key={l.id} className="border-b border-border">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">{Number(l.quantity)}</td>
                <td className="py-2 text-right">{invoice.currency} {Number(l.unit_price).toLocaleString()}</td>
                <td className="py-2 text-right">{invoice.currency} {Number(l.line_total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-6 w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Subtotal</span><span>{invoice.currency} {Number(invoice.subtotal).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Tax</span><span>{invoice.currency} {Number(invoice.tax_amount).toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold text-ink"><span>Total</span><span>{invoice.currency} {Number(invoice.total).toLocaleString()}</span></div>
        </div>

        <div className="mt-10 space-y-2 border-t border-border pt-6 text-xs text-ink-muted">
          <div>{settings.payment_terms}</div>
          {settings.bank_details && <div className="whitespace-pre-line">{settings.bank_details}</div>}
          <div className="pt-2 text-center italic">{settings.footer_note}</div>
        </div>
      </div>
    </div>
  );
}
