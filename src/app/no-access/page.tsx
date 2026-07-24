export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 text-center">
      <div>
        <h1 className="text-lg font-semibold text-ink">No access yet</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          Your account isn't attached to any company yet. Ask a Worlebury admin to add you to an entity.
        </p>
      </div>
    </div>
  );
}
