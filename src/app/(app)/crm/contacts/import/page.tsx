"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const FIELDS = [
  { key: "first_name", label: "First name", required: true },
  { key: "last_name", label: "Last name", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

function guessColumn(headers: string[], key: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  return headers.find((h) => norm(h).includes(norm(key))) ?? "";
}

export default function ImportContactsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "importing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const h = result.meta.fields ?? [];
        setHeaders(h);
        setRows(result.data);
        const initialMap: Record<string, string> = {};
        for (const f of FIELDS) initialMap[f.key] = guessColumn(h, f.key);
        setMapping(initialMap);
      },
    });
  }

  async function handleImport() {
    if (!mapping.first_name) {
      setMessage("Map at least the First name column before importing.");
      return;
    }
    setStatus("importing");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: entityMember } = await supabase.from("entity_members").select("entity_id").eq("user_id", user!.id).limit(1).single();
    const entityId = entityMember?.entity_id;

    const payload = rows
      .map((r) => ({
        entity_id: entityId,
        first_name: r[mapping.first_name]?.trim(),
        last_name: mapping.last_name ? r[mapping.last_name]?.trim() : null,
        email: mapping.email ? r[mapping.email]?.trim() : null,
        phone: mapping.phone ? r[mapping.phone]?.trim() : null,
        notes: mapping.notes ? r[mapping.notes]?.trim() : null,
        type: "lead" as const,
        source: `import:${fileName}`,
        created_by: user!.id,
      }))
      .filter((r) => r.first_name);

    const { error } = await supabase.from("crm_contacts").insert(payload);
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    await supabase.from("crm_imports").insert({
      entity_id: entityId,
      file_name: fileName,
      row_count: payload.length,
      imported_by: user!.id,
    });

    setStatus("done");
    setMessage(`Imported ${payload.length} contacts.`);
    setTimeout(() => router.push("/crm/contacts"), 1200);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Import contacts</h1>
        <p className="text-sm text-ink-muted">Upload a CSV export from your current CRM or spreadsheet. Map the columns, then import.</p>
      </div>

      <Card>
        <CardBody>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="text-sm"
          />
        </CardBody>
      </Card>

      {headers.length > 0 && (
        <Card>
          <CardHeader className="font-medium">Map columns ({rows.length} rows detected)</CardHeader>
          <CardBody className="space-y-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <label className="text-sm text-ink">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={mapping[f.key] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                  className="w-56 rounded-lg border border-border px-2 py-1.5 text-sm"
                >
                  <option value="">— skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
            <Button onClick={handleImport} disabled={status === "importing"}>
              {status === "importing" ? "Importing..." : `Import ${rows.length} rows`}
            </Button>
            {message && <p className={`text-sm ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>{message}</p>}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
