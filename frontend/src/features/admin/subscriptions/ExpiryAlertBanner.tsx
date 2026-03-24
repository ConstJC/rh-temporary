"use client";

export function ExpiryAlertBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
      <span className="font-semibold">{count}</span> subscription
      {count === 1 ? "" : "s"} expiring within 7 days.
    </div>
  );
}
