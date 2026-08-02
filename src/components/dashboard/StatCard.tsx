import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { clsx } from "clsx";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  /** Positive = good news, shown in emerald; negative shown in red — direction of the arrow follows the sign. */
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
          {Icon && (
            <span className="rounded-lg bg-accent-tint p-1.5 text-accent-dark">
              <Icon size={16} />
            </span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        <div className="mt-1 flex items-center gap-2">
          {sub && <p className="text-xs text-ink-muted">{sub}</p>}
          {trend && (
            <span className={clsx("flex items-center gap-0.5 text-xs font-medium", trend.positive ? "text-emerald-600" : "text-red-500")}>
              {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend.value).toFixed(0)}%
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
