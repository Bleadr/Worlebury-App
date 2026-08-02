import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContactsFilter } from "@/components/crm/ContactsFilter";
import { AddContactButton } from "@/components/crm/AddContactButton";

const TYPE_TONE: Record<string, "brand" | "success" | "neutral"> = {
  lead: "neutral",
  contact: "brand",
  customer: "success",
};

export default async function ContactsPage() {
  const entityId = await getEntityId();
  const supabase = createClient();
  const { data: contacts } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: companies } = await supabase.from("crm_companies").select("id, name").eq("entity_id", entityId).order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Contacts</h1>
          <p className="text-sm text-ink-muted">{contacts?.length ?? 0} contacts, leads &amp; customers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/contacts/import"><Button variant="secondary">Import CSV</Button></Link>
          <AddContactButton companies={companies ?? []} />
        </div>
      </div>

      <ContactsFilter contacts={contacts ?? []} typeTone={TYPE_TONE} />
    </div>
  );
}
