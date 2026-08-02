import Link from "next/link";
import { signOut } from "@/app/(app)/actions";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function TopBar({ entityName, userName }: { entityName: string; userName: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 print:hidden">
      <span className="font-serif text-sm font-medium text-ink">{entityName}</span>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/settings" className="text-sm text-ink-muted hover:text-ink">{userName}</Link>
        <form action={signOut}>
          <button className="text-sm font-medium text-ink-muted hover:text-ink">Sign out</button>
        </form>
      </div>
    </header>
  );
}
