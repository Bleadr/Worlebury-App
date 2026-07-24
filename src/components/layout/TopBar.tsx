import { signOut } from "@/app/(app)/actions";
import { EntitySwitcher } from "@/components/layout/EntitySwitcher";
import type { Entity } from "@/lib/types";

export function TopBar({
  entities,
  currentId,
  userName,
}: {
  entities: Entity[];
  currentId: string;
  userName: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <EntitySwitcher entities={entities} currentId={currentId} />
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-muted">{userName}</span>
        <form action={signOut}>
          <button className="text-sm font-medium text-ink-muted hover:text-ink">Sign out</button>
        </form>
      </div>
    </header>
  );
}
