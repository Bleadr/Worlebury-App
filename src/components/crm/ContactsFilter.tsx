"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { CrmContact } from "@/lib/types";

type ToneKey = "brand" | "success" | "neutral" | "warning" | "danger";

export function ContactsFilter({
  contacts,
  typeTone,
}: {
  contacts: CrmContact[];
  typeTone: Record<string, ToneKey>;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const haystack = `${c.first_name} ${c.last_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""} ${c.source ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [contacts, query]);

  function exportCsv() {
    const csv = Papa.unparse(
      filtered.map((c) => ({
        first_name: c.first_name,
        last_name: c.last_name ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        type: c.type,
        source: c.source ?? "",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-64 rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <Button variant="secondary" size="sm" onClick={exportCsv}>Export CSV</Button>
      </div>
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
            {filtered.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium text-ink">
                  <Link href={`/crm/contacts/${c.id}`} className="hover:text-accent hover:underline">
                    {c.first_name} {c.last_name ?? ""}
                  </Link>
                </Td>
                <Td><Badge tone={typeTone[c.type] ?? "neutral"}>{c.type}</Badge></Td>
                <Td>{c.email ?? "—"}</Td>
                <Td>{c.phone ?? "—"}</Td>
                <Td>{c.source ?? "—"}</Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><Td colSpan={5} className="text-center text-ink-muted">No contacts match.</Td></tr>
            )}
          </tbody>
        </Table>
      </CardBody>
    </Card>
  );
}
