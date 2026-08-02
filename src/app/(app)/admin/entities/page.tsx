import { redirect } from "next/navigation";

// Worlebury runs as a single entity now — this route just redirects any
// bookmarked/old links to Admin > Users instead of 404ing.
export default function EntitiesAdminPage() {
  redirect("/admin/users");
}
