import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { UploadForm } from "@/components/resources/UploadForm";
import { assignResource } from "./actions";

export default async function ResourcesPage() {
  const entityId = await getEntityId();
  const supabase = createClient();

  const { data: resources } = await supabase.from("resources").select("*").eq("entity_id", entityId).order("created_at", { ascending: false });
  const { data: members } = await supabase.from("entity_members").select("user_id, profiles(full_name)").eq("entity_id", entityId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Resources</h1>
        <p className="text-sm text-ink-muted">Files and assets to hand out to staff — onboarding docs, brand assets, equipment records.</p>
      </div>

      <Card>
        <CardHeader className="font-medium">Add a resource</CardHeader>
        <CardBody><UploadForm entityId={entityId} /></CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead><tr><Th>Title</Th><Th>Category</Th><Th>Assigned to</Th><Th></Th></tr></thead>
            <tbody>
              {(resources ?? []).map((r) => (
                <tr key={r.id}>
                  <Td className="font-medium text-ink">{r.title}</Td>
                  <Td>{r.category ?? "—"}</Td>
                  <Td>
                    <form action={async (fd) => assignResource(r.id, String(fd.get("user_id")))}>
                      <select
                        name="user_id"
                        defaultValue={r.assigned_to ?? ""}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="rounded-lg border border-border px-2 py-1 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {(members ?? []).map((m: any) => (
                          <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name ?? m.user_id}</option>
                        ))}
                      </select>
                    </form>
                  </Td>
                  <Td>
                    {r.storage_path && (
                      <a href={`/api/resources/${r.id}/download`} className="text-xs font-medium text-accent hover:underline">
                        Download
                      </a>
                    )}
                  </Td>
                </tr>
              ))}
              {(resources ?? []).length === 0 && <tr><Td colSpan={4} className="text-center text-ink-muted">No resources yet.</Td></tr>}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
