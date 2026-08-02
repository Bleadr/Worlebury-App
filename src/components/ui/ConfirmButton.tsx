"use client";

// A submit button that asks for confirmation before letting its parent
// <form action={...}> actually submit. Used for anything destructive
// (deleting invoices, removing team members) so a stray click can't
// silently delete real financial records.
export function ConfirmButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
