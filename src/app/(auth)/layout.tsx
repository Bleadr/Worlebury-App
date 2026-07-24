export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Worlebury" className="mx-auto mb-4 h-14 w-14 rounded-2xl" />
          <h1 className="font-serif text-2xl font-semibold text-white">Worlebury</h1>
          <p className="font-serif text-sm italic text-brand-200">Audit · Consulting · Finance</p>
        </div>
        <div className="rounded-card bg-surface p-6 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
