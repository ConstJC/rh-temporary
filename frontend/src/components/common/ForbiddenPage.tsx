import Link from 'next/link';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
      <p className="text-center text-slate-600">You don&apos;t have permission to view this page.</p>
      <Link
        href="/login"
        className="rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
      >
        Sign in
      </Link>
    </div>
  );
}
