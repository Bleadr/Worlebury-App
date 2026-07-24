"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { moveDeal } from "@/app/(app)/crm/pipeline/actions";

interface Stage {
  id: string;
  name: string;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
}
interface Deal {
  id: string;
  title: string;
  value_amount: number;
  value_currency: string;
  stage_id: string;
}

export function PipelineBoard({ stages, deals }: { stages: Stage[]; deals: Deal[] }) {
  const [items, setItems] = useState(deals);
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);

  function onDrop(stage: Stage) {
    if (!dragging) return;
    setItems((prev) => prev.map((d) => (d.id === dragging ? { ...d, stage_id: stage.id } : d)));
    startTransition(() => moveDeal(dragging, stage.id, stage.is_won, stage.is_lost));
    setDragging(null);
  }

  const totalFor = (stageId: string) =>
    items.filter((d) => d.stage_id === stageId).reduce((sum, d) => sum + Number(d.value_amount), 0);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div
          key={stage.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(stage)}
          className="w-72 shrink-0"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-ink">{stage.name}</h3>
            <span className="text-xs text-ink-muted">£{totalFor(stage.id).toLocaleString()}</span>
          </div>
          <div className="space-y-2 rounded-card bg-surface-muted p-2 min-h-[120px]">
            {items
              .filter((d) => d.stage_id === stage.id)
              .map((deal) => (
                <Card
                  key={deal.id}
                  draggable
                  onDragStart={() => setDragging(deal.id)}
                  className="cursor-grab p-3 active:cursor-grabbing"
                >
                  <p className="text-sm font-medium text-ink">{deal.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {deal.value_currency} {Number(deal.value_amount).toLocaleString()}
                  </p>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
