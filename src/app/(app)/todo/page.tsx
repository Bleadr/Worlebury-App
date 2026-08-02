import { createClient } from "@/lib/supabase/server";
import { getEntityId } from "@/lib/entity";
import { KanbanBoard } from "@/components/todo/KanbanBoard";

export default async function TodoPage() {
  const entityId = await getEntityId();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // One shared board per entity — created lazily on first visit.
  let { data: board } = await supabase
    .from("todo_boards")
    .select("id, name")
    .eq("entity_id", entityId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!board) {
    const { data: created } = await supabase
      .from("todo_boards")
      .insert({ entity_id: entityId, name: "Team board", created_by: user?.id })
      .select("id, name")
      .single();
    board = created;
  }

  const { data: cards } = await supabase
    .from("todo_cards")
    .select("*")
    .eq("board_id", board!.id)
    .order("position");

  const { data: members } = await supabase
    .from("entity_members")
    .select("user_id, profiles(full_name)")
    .eq("entity_id", entityId);

  const memberOptions = (members ?? []).map((m: any) => ({ id: m.user_id, name: m.profiles?.full_name ?? "Unnamed" }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">To-do board</h1>
        <p className="text-sm text-ink-muted">Drag cards between columns. Shared by the whole team.</p>
      </div>
      <KanbanBoard boardId={board!.id} initialCards={cards ?? []} members={memberOptions} currentUserId={user?.id ?? ""} />
    </div>
  );
}
