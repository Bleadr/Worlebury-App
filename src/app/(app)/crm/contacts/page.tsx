import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const TYPE_TONE: Record<string, "brand" | "success" | "neutral"> = {
  lead: "neutral",
  contact: "brand",
  customer: "success",
};

export default async function ContactsPage() {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();
  const { data: contacts } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Contacts</h1>
          <p className="text-sm text-ink-muted">{contacts?.length ?? 0} contacts, leads &amp; customers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/contacts/import"><Button variant="secondary">Import CSV</Button></Link>
          <Button>Add contact</Button>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Source</Th>
              </tr>
            </thead>
            <tbody>
              {(contacts ?? []).map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium text-ink">{c.first_name} {c.last_name ?? ""}</Td>
                  <Td><Badge tone={TYPE_TONE[c.type] ?? "neutral"}>{c.type}</Badge></Td>
                  <Td>{c.email ?? "—"}</Td>
                  <Td>{c.phone ?? "—"}</Td>
                  <Td>{c.source ?? "—"}</Td>
                </tr>
              ))}
              {(contacts ?? []).length === 0 && (
                <tr><Td colSpan={5} className="text-center text-ink-muted">No contacts yet. Add one or import a CSV.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
