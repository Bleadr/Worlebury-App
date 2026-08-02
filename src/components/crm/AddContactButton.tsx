"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createContact } from "@/app/(app)/crm/contacts/actions";

export function AddContactButton({ companies }: { companies: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setBusy(true);
    try {
      await createContact(formData);
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add contact</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-ink-muted">Add contact</span>
              <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink"><X size={18} /></button>
            </div>
            <form action={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="first_name" required placeholder="First name" className="rounded-lg border border-border px-3 py-2 text-sm" />
                <input name="last_name" placeholder="Last name" className="rounded-lg border border-border px-3 py-2 text-sm" />
              </div>
              <input name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              <input name="phone" placeholder="Phone" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select name="type" defaultValue="lead" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  <option value="lead">Lead</option>
                  <option value="contact">Contact</option>
                  <option value="customer">Customer</option>
                </select>
                <select name="crm_company_id" defaultValue="" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  <option value="">No account</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={busy} className="w-full justify-center">{busy ? "Adding..." : "Add contact"}</Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
