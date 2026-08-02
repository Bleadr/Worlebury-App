import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteInvoice } from "./actions";

const STATUS_TONE: Record<string, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  sent: "brand",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

export default async function InvoicesPage() {
  const entityId = await getEntityId();
  const supabase = createClient();
  const { data: invoices } = await supabase
    .from("finance_invoices")
    .select("*, crm_companies(name)")
    .eq("entity_id", entityId)
    .order("issue_date", { ascending: false });

  const outstanding = (invoices ?? []).filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Invoices</h1>
          <p className="text-sm text-ink-muted">£{outstanding.toLocaleString()} outstanding</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/finance/invoices/settings" className="text-sm font-medium text-ink-muted hover:text-ink">
            Edit template
          </Link>
          <Link href="/finance/invoices/new"><Button>New invoice</Button></Link>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Number</Th>
                <Th>Client</Th>
                <Th>Account</Th>
                <Th>Status</Th>
                <Th>Issue date</Th>
                <Th>Due date</Th>
                <Th>Total</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((i: any) => (
                <tr key={i.id}>
                  <Td className="font-medium text-ink">
                    <Link href={`/finance/invoices/${i.id}`} className="hover:text-accent hover:underline">
                      {i.invoice_number}
                    </Link>
                  </Td>
                  <Td>{i.client_name}</Td>
                  <Td>{i.crm_companies?.name ?? "—"}</Td>
                  <Td><Badge tone={STATUS_TONE[i.status] ?? "neutral"}>{i.status}</Badge></Td>
                  <Td>{i.issue_date}</Td>
                  <Td>{i.due_date ?? "—"}</Td>
                  <Td>{i.currency} {Number(i.total).toLocaleString()}</Td>
                  <Td>
                    <form action={async () => deleteInvoice(i.id)}>
                      <ConfirmButton message={`Delete invoice ${i.invoice_number}? This can't be undone.`} className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </ConfirmButton>
                    </form>
                  </Td>
                </tr>
              ))}
              {(invoices ?? []).length === 0 && (
                <tr><Td colSpan={8} className="text-center text-ink-muted">No invoices yet.</Td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
