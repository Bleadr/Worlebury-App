import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { addContactNote } from "./actions";

const TYPE_TONE: Record<string, "brand" | "success" | "neutral"> = {
  lead: "neutral",
  contact: "brand",
  customer: "success",
};

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: contact } = await supabase.from("crm_contacts").select("*").eq("id", params.id).single();
  if (!contact) notFound();

  const { data: activities } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("contact_id", params.id)
    .order("created_at", { ascending: false });

  const { data: deals } = await supabase
    .from("crm_deals")
    .select("id, title, status, value_amount, value_currency")
    .eq("contact_id", params.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/crm/contacts" className="text-xs text-ink-muted hover:text-ink">&larr; Back to contacts</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-ink">{contact.first_name} {contact.last_name ?? ""}</h1>
          <Badge tone={TYPE_TONE[contact.type] ?? "neutral"}>{contact.type}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="font-medium">Details</CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p><span className="text-ink-muted">Email:</span> {contact.email ?? "—"}</p>
            <p><span className="text-ink-muted">Phone:</span> {contact.phone ?? "—"}</p>
            <p><span className="text-ink-muted">Source:</span> {contact.source ?? "—"}</p>
            {contact.notes && <p><span className="text-ink-muted">Notes:</span> {contact.notes}</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium">Deals</CardHeader>
          <CardBody className="space-y-2">
            {(deals ?? []).length === 0 && <p className="text-sm text-ink-muted">No deals linked yet.</p>}
            {(deals ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{d.title}</span>
                <span className="text-ink-muted">{d.value_currency} {Number(d.value_amount).toLocaleString()}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="font-medium">Activity</CardHeader>
        <CardBody className="space-y-4">
          <form action={async (fd) => addContactNote(contact.id, fd)} className="flex gap-2">
            <input
              name="body"
              placeholder="Log a call, email, or note..."
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark">
              Add
            </button>
          </form>

          <div className="space-y-3 border-t border-border pt-4">
            {(activities ?? []).map((a) => (
              <div key={a.id} className="text-sm">
                <p className="text-ink">{a.body}</p>
                <p className="text-xs text-ink-muted">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            ))}
            {(activities ?? []).length === 0 && <p className="text-sm text-ink-muted">No activity logged yet.</p>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
