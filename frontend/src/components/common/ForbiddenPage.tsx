import Link from "next/link";

interface ForbiddenPageProps {
  title?: string;
  message?: string;
  ctaHref?: string;
  ctaLabel?: string;
  fullScreen?: boolean;
}

export function ForbiddenPage({
  title = "Access denied",
  message = "You don't have permission to view this page.",
  ctaHref = "/login",
  ctaLabel = "Sign in",
  fullScreen = true,
}: ForbiddenPageProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-slate-100 px-4 ${
        fullScreen
          ? "min-h-screen"
          : "min-h-[60vh] rounded-lg border border-slate-200"
      }`}
    >
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="text-center text-slate-600">{message}</p>
      <Link
        href={ctaHref}
        className="rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
