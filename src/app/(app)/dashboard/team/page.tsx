import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";

export default async function TeamDashboardPage() {
  const entityId = cookies().get("current_entity")?.value!;
  const supabase = createClient();

  const { data: members } = await supabase.from("entity_members").select("user_id, role, profiles(full_name)").eq("entity_id", entityId);
  const { data: activities } = await supabase.from("crm_activities").select("created_by").eq("entity_id", entityId);
  const { data: deals } = await supabase.from("crm_deals").select("owner_id, status").eq("entity_id", entityId);

  const rows = (members ?? []).map((m: any) => ({
    name: m.profiles?.full_name ?? m.user_id,
    role: m.role,
    activities: (activities ?? []).filter((a) => a.created_by === m.user_id).length,
    dealsWon: (deals ?? []).filter((d) => d.owner_id === m.user_id && d.status === "won").length,
    dealsOpen: (deals ?? []).filter((d) => d.owner_id === m.user_id && d.status === "open").length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Team dashboard</h1>
      <Card>
        <CardHeader className="font-medium">Activity by teammate</CardHeader>
        <CardBody className="p-0">
          <Table>
            <thead><tr><Th>Name</Th><Th>Role</Th><Th>Open deals</Th><Th>Deals won</Th><Th>Activities logged</Th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}><Td className="font-medium text-ink">{r.name}</Td><Td>{r.role}</Td><Td>{r.dealsOpen}</Td><Td>{r.dealsWon}</Td><Td>{r.activities}</Td></tr>
              ))}
              {rows.length === 0 && <tr><Td colSpan={5} className="text-center text-ink-muted">No team data yet.</Td></tr>}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
