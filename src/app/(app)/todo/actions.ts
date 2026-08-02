"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import type { TodoCard, TodoStatus } from "@/lib/types";

export async function createCard(input: {
  boardId: string;
  title: string;
  status: TodoStatus;
  position: number;
}): Promise<TodoCard> {
  const entityId = await getEntityId();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("todo_cards")
    .insert({
      entity_id: entityId,
      board_id: input.boardId,
      title: input.title,
      status: input.status,
      position: input.position,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create card.");
  revalidatePath("/todo");
  return data as TodoCard;
}

export async function updateCard(
  cardId: string,
  patch: Partial<Pick<TodoCard, "title" | "description" | "priority" | "due_date" | "assigned_to">>
): Promise<void> {
  const supabase = createClient();
  await supabase.from("todo_cards").update(patch).eq("id", cardId);
  revalidatePath("/todo");
}

// Called on drag-and-drop. Takes the full, already-reordered list of cards
// for every column touched by the drag (usually just the source + target
// column) and writes their status/position back in one go, so ordering
// stays consistent instead of drifting after repeated drags.
export async function reorderCards(updates: { id: string; status: TodoStatus; position: number }[]): Promise<void> {
  const supabase = createClient();
  await Promise.all(
    updates.map((u) => supabase.from("todo_cards").update({ status: u.status, position: u.position }).eq("id", u.id))
  );
  revalidatePath("/todo");
}

export async function deleteCard(cardId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("todo_cards").delete().eq("id", cardId);
  revalidatePath("/todo");
}
