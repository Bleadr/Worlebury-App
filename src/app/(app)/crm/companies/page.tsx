import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { createCompany } from "./actions";

export default async function CompaniesPage() {
  const entityId = await getEntityId();
  const supabase = createClient();

  const { data: companies } = await supabase
    .from("crm_companies")
    .select("id, name, website, industry, crm_contacts(id), finance_invoices(id)")
    .eq("entity_id", entityId)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Accounts</h1>
        <p className="text-sm text-ink-muted">Companies you deal with — link contacts and invoices to keep everything in one place.</p>
      </div>

      <Card>
        <CardHeader className="font-medium">Add an account</CardHeader>
        <CardBody>
          <form action={createCompany} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-ink">Company name</label>
              <input name="name" required className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Website</label>
              <input name="website" placeholder="example.com" className="rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Industry</label>
              <input name="industry" className="rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <Button type="submit">Add account</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr><Th>Name</Th><Th>Industry</Th><Th>Website</Th><Th>Contacts</Th><Th>Invoices</Th></tr>
            </thead>
            <tbody>
              {(companies ?? []).map((c: any) => (
                <tr key={c.id}>
                  <Td className="font-medium text-ink">
                    <Link href={`/crm/companies/${c.id}`} className="hover:text-accent hover:underline">{c.name}</Link>
                  </Td>
                  <Td>{c.industry ?? "—"}</Td>
                  <Td>{c.website ?? "—"}</Td>
                  <Td>{c.crm_contacts?.length ?? 0}</Td>
                  <Td>{c.finance_invoices?.length ?? 0}</Td>
                </tr>
              ))}
              {(companies ?? []).length === 0 && (
                <tr><Td colSpan={5} className="text-center text-ink-muted">No accounts yet.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
