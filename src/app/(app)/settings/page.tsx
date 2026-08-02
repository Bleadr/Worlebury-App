import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "./actions";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, is_super_admin").eq("id", user.id).single();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Your profile</h1>
        <p className="text-sm text-ink-muted">This is how your name shows up across the app — assigned cards, activity, approvals.</p>
      </div>

      <Card>
        <CardHeader className="font-medium">Details</CardHeader>
        <CardBody>
          <form action={updateProfile} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
              <input
                name="full_name"
                defaultValue={profile?.full_name ?? ""}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Email</label>
              <input value={user.email ?? ""} disabled className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-ink-muted" />
              <p className="mt-1 text-xs text-ink-muted">Contact a super admin to change your sign-in email.</p>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
