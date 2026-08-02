import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { updateCompanyNotes, deleteCompany } from "../actions";

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const entityId = await getEntityId();
  const supabase = createClient();

  const { data: company } = await supabase
    .from("crm_companies")
    .select("*")
    .eq("entity_id", entityId)
    .eq("id", params.id)
    .maybeSingle();

  if (!company) notFound();

  const { data: contacts } = await supabase
    .from("crm_contacts")
    .select("id, first_name, last_name, email, type")
    .eq("crm_company_id", company.id)
    .order("first_name");

  const { data: invoices } = await supabase
    .from("finance_invoices")
    .select("id, invoice_number, status, total, currency, issue_date")
    .eq("crm_company_id", company.id)
    .order("issue_date", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/crm/companies" className="text-sm text-ink-muted hover:text-ink">← Back to accounts</Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">{company.name}</h1>
            <p className="text-sm text-ink-muted">{company.industry ?? "No industry set"}{company.website && <> · {company.website}</>}</p>
          </div>
          <form action={async () => deleteCompany(company.id)}>
            <ConfirmButton
              message={`Delete ${company.name}? Contacts and invoices linked to it will be kept, just unlinked.`}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete account
            </ConfirmButton>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader className="font-medium">Notes</CardHeader>
        <CardBody>
          <form action={async (fd) => updateCompanyNotes(company.id, fd)} className="space-y-2">
            <textarea
              name="notes"
              defaultValue={company.notes ?? ""}
              rows={3}
              placeholder="Anything worth remembering about this account..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted">Save notes</button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-medium">Contacts ({contacts?.length ?? 0})</CardHeader>
        <CardBody className="p-0">
          <Table>
            <thead><tr><Th>Name</Th><Th>Email</Th><Th>Type</Th></tr></thead>
            <tbody>
              {(contacts ?? []).map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium text-ink">
                    <Link href={`/crm/contacts/${c.id}`} className="hover:text-accent hover:underline">{c.first_name} {c.last_name ?? ""}</Link>
                  </Td>
                  <Td>{c.email ?? "—"}</Td>
                  <Td><Badge tone="neutral">{c.type}</Badge></Td>
                </tr>
              ))}
              {(contacts ?? []).length === 0 && <tr><Td colSpan={3} className="text-center text-ink-muted">No contacts linked yet.</Td></tr>}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-medium">Invoices ({invoices?.length ?? 0})</CardHeader>
        <CardBody className="p-0">
          <Table>
            <thead><tr><Th>Number</Th><Th>Status</Th><Th>Date</Th><Th>Total</Th></tr></thead>
            <tbody>
              {(invoices ?? []).map((i) => (
                <tr key={i.id}>
                  <Td className="font-medium text-ink">
                    <Link href={`/finance/invoices/${i.id}`} className="hover:text-accent hover:underline">{i.invoice_number}</Link>
                  </Td>
                  <Td><Badge tone="neutral">{i.status}</Badge></Td>
                  <Td>{i.issue_date}</Td>
                  <Td>{i.currency} {Number(i.total).toLocaleString()}</Td>
                </tr>
              ))}
              {(invoices ?? []).length === 0 && <tr><Td colSpan={4} className="text-center text-ink-muted">No invoices linked yet.</Td></tr>}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
