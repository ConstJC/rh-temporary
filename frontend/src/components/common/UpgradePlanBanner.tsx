import Link from "next/link";

export function UpgradePlanBanner() {
  return (
    <div className="rounded-lg border border-warning-200 bg-warning-100 p-4">
      <p className="text-sm font-medium text-warning-700">
        You&apos;ve reached your plan limit. Upgrade to add more.
      </p>
      <Link
        href="/upgrade"
        className="mt-2 inline-block text-sm font-medium text-warning-700 underline"
      >
        Upgrade plan
      </Link>
    </div>
  );
}
