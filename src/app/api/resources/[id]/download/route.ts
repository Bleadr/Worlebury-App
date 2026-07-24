import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Generates a short-lived signed URL and redirects to it. Kept as a route
// handler (rather than a server action) so it works as a plain link/download.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: resource } = await supabase.from("resources").select("storage_path").eq("id", params.id).single();
  if (!resource?.storage_path) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase.storage.from("resources").createSignedUrl(resource.storage_path, 300);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Could not sign URL" }, { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
