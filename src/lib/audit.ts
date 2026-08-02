import { createClient } from "@/lib/supabase/server";

// Fire-and-forget audit trail for the actions that matter for compliance/
// accountability (approvals, deletions, permission and role changes).
// Deliberately swallows its own errors — a logging failure should never
// block the actual action the user is trying to take.
export async function logAudit(
  entityId: string,
  action: string,
  target?: { table: string; id: string },
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("audit_log").insert({
      entity_id: entityId,
      actor_id: user?.id ?? null,
      action,
      target_table: target?.table ?? null,
      target_id: target?.id ?? null,
      metadata: metadata ?? {},
    });
  } catch {
    // Non-fatal — see comment above.
  }
}
