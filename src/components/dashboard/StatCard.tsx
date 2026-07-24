import { Card, CardBody } from "@/components/ui/Card";

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
        {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
      </CardBody>
    </Card>
  );
}
