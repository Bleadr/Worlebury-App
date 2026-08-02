"use client";

import { useMemo, useState } from "react";
import { Plus, X, Trash2, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { createCard, deleteCard, reorderCards, updateCard } from "@/app/(app)/todo/actions";
import type { TodoCard, TodoStatus } from "@/lib/types";

const COLUMNS: { key: TodoStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

const PRIORITY_TONE: Record<TodoCard["priority"], "neutral" | "brand" | "warning" | "danger"> = {
  low: "neutral",
  normal: "brand",
  high: "warning",
  urgent: "danger",
};

interface Member {
  id: string;
  name: string;
}

export function KanbanBoard({
  boardId,
  initialCards,
  members,
  currentUserId,
}: {
  boardId: string;
  initialCards: TodoCard[];
  members: Member[];
  currentUserId: string;
}) {
  const [cards, setCards] = useState<TodoCard[]>(initialCards);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<TodoStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const map: Record<TodoStatus, TodoCard[]> = { backlog: [], todo: [], in_progress: [], done: [] };
    for (const c of cards) map[c.status].push(c);
    (Object.keys(map) as TodoStatus[]).forEach((k) => map[k].sort((a, b) => a.position - b.position));
    return map;
  }, [cards]);

  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name;

  async function handleAdd(status: TodoStatus) {
    const title = newTitle.trim();
    if (!title) {
      setAddingTo(null);
      return;
    }
    const position = (columns[status].at(-1)?.position ?? 0) + 1000;
    setNewTitle("");
    setAddingTo(null);
    try {
      const card = await createCard({ boardId, title, status, position });
      setCards((prev) => [...prev, card]);
    } catch {
      // Non-fatal — the input is already cleared; user can just retry.
    }
  }

  function handleDrop(targetStatus: TodoStatus, targetIndex: number | null, e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId) return;
    const dragged = cards.find((c) => c.id === draggedId);
    if (!dragged) return;

    const destList = columns[targetStatus].filter((c) => c.id !== draggedId);
    const insertAt = targetIndex === null ? destList.length : targetIndex;
    destList.splice(insertAt, 0, { ...dragged, status: targetStatus });

    const updates = destList.map((c, i) => ({ id: c.id, status: targetStatus, position: i * 1000 }));
    setCards((prev) =>
      prev.map((c) => {
        const u = updates.find((x) => x.id === c.id);
        return u ? { ...c, status: u.status, position: u.position } : c;
      })
    );
    setDraggedId(null);
    reorderCards(updates).catch(() => {});
  }

  async function handleDelete(cardId: string) {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setEditingId(null);
    deleteCard(cardId).catch(() => {});
  }

  async function handleSaveEdit(cardId: string, patch: Partial<TodoCard>) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...patch } : c)));
    updateCard(cardId, patch).catch(() => {});
  }

  const editingCard = cards.find((c) => c.id === editingId) ?? null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(col.key, null, e)}
            className="flex min-h-[200px] flex-col rounded-card border border-border bg-surface-muted"
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm font-medium text-ink">{col.label}</span>
              <span className="text-xs text-ink-muted">{columns[col.key].length}</span>
            </div>
            <div className="flex-1 space-y-2 px-2 pb-2">
              {columns[col.key].map((card, idx) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => setDraggedId(card.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(col.key, idx, e)}
                  onClick={() => setEditingId(card.id)}
                  className="cursor-pointer rounded-lg border border-border bg-surface p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Badge tone={PRIORITY_TONE[card.priority]}>{card.priority}</Badge>
                    {card.due_date && (
                      <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                        <Calendar size={11} /> {card.due_date}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-ink">{card.title}</div>
                  {card.assigned_to && (
                    <div className="mt-1.5 text-xs text-ink-muted">{memberName(card.assigned_to) ?? "Unassigned"}</div>
                  )}
                </div>
              ))}

              {addingTo === col.key ? (
                <div className="rounded-lg border border-border bg-surface p-2">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd(col.key);
                      if (e.key === "Escape") { setAddingTo(null); setNewTitle(""); }
                    }}
                    onBlur={() => handleAdd(col.key)}
                    placeholder="Card title"
                    className="w-full rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAddingTo(col.key)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface hover:text-ink"
                >
                  <Plus size={14} /> Add card
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingCard && (
        <CardEditor
          card={editingCard}
          members={members}
          onClose={() => setEditingId(null)}
          onSave={(patch) => handleSaveEdit(editingCard.id, patch)}
          onDelete={() => handleDelete(editingCard.id)}
        />
      )}
    </>
  );
}

function CardEditor({
  card,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  card: TodoCard;
  members: Member[];
  onClose: () => void;
  onSave: (patch: Partial<TodoCard>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [priority, setPriority] = useState(card.priority);
  const [dueDate, setDueDate] = useState(card.due_date ?? "");
  const [assignedTo, setAssignedTo] = useState(card.assigned_to ?? "");

  function save() {
    onSave({
      title: title.trim() || card.title,
      description: description || null,
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-muted">Edit card</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium outline-none focus:border-accent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoCard["priority"])}
                className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Assigned to</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button onClick={onDelete} className={clsx("flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline")}>
            <Trash2 size={14} /> Delete card
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted">Cancel</button>
            <button onClick={save} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
