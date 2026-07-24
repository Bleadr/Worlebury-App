"use client";

import { switchEntity } from "@/app/(app)/actions";
import type { Entity } from "@/lib/types";

export function EntitySwitcher({ entities, currentId }: { entities: Entity[]; currentId: string }) {
  if (entities.length <= 1) {
    return <span className="text-sm font-medium text-ink">{entities[0]?.name ?? "—"}</span>;
  }

  return (
    <form action={async (fd) => switchEntity(String(fd.get("entity_id")))}>
      <select
        name="entity_id"
        defaultValue={currentId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm font-medium text-ink"
      >
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </form>
  );
}
