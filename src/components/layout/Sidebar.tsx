"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Receipt,
  Wallet,
  Boxes,
  ShieldCheck,
  ClipboardCheck,
  ListChecks,
  Building2,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { CurrentAccess } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tool: keyof CurrentAccess["permissions"] | "always";
  superAdminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tool: "reporting" },
  { href: "/crm/pipeline", label: "Pipeline", icon: KanbanSquare, tool: "crm" },
  { href: "/crm/contacts", label: "Contacts", icon: Users, tool: "crm" },
  { href: "/crm/companies", label: "Accounts", icon: Building2, tool: "crm" },
  { href: "/finance/invoices", label: "Invoices", icon: Receipt, tool: "finance" },
  { href: "/finance/expenses", label: "Expenses", icon: Wallet, tool: "finance" },
  { href: "/todo", label: "To-do board", icon: ListChecks, tool: "always" },
  { href: "/resources", label: "Resources", icon: Boxes, tool: "resources" },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck, tool: "admin", superAdminOnly: true },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText, tool: "admin" },
  { href: "/admin/users", label: "Admin", icon: ShieldCheck, tool: "admin" },
];

export function Sidebar({ access, pendingApprovals }: { access: CurrentAccess; pendingApprovals: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex print:hidden">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <img src="/logo.png" alt="Worlebury" className="h-8 w-8 rounded-lg" />
        <span className="font-serif text-lg font-semibold text-ink">Worlebury</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.filter((item) => {
          if (item.superAdminOnly && !access.isSuperAdmin) return false;
          return item.tool === "always" || access.permissions[item.tool]?.view;
        }).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center justify-between gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-accent bg-surface-muted text-ink"
                  : "border-transparent text-ink-muted hover:bg-surface-muted hover:text-ink"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} className={active ? "text-accent" : undefined} />
                {item.label}
              </span>
              {item.href === "/admin/approvals" && pendingApprovals > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {pendingApprovals}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
