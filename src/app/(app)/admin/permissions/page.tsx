import { redirect } from "next/navigation";

// Superseded by the per-user profile page, which combines role + permission
// toggles in one place instead of a separate matrix. Kept as a redirect
// rather than deleted so any old bookmarks/links still land somewhere useful.
export default function PermissionsPage() {
  redirect("/admin/users");
}
