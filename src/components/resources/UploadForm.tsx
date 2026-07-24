"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createResourceRecord } from "@/app/(app)/resources/actions";
import { Button } from "@/components/ui/Button";

export function UploadForm({ entityId }: { entityId: string }) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage("");

    const path = `${entityId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resources").upload(path, file);
    if (uploadError) {
      setMessage(uploadError.message);
      setBusy(false);
      return;
    }

    await createResourceRecord({
      title: title || file.name,
      category,
      kind: "file",
      storage_path: path,
    });

    setTitle("");
    setCategory("");
    setFile(null);
    setBusy(false);
    setMessage("Uploaded.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">File</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" placeholder="Optional — defaults to filename" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Category</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" placeholder="e.g. Onboarding, Brand Assets" />
      </div>
      <Button type="submit" disabled={!file || busy}>{busy ? "Uploading..." : "Upload"}</Button>
      {message && <span className="text-sm text-ink-muted">{message}</span>}
    </form>
  );
}
