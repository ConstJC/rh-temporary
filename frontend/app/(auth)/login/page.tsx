import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { AuthSplitShell } from "@/features/auth/AuthSplitShell";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { role?: string; userType?: string }
    | undefined;

  if (session?.user) {
    if (user?.role === "ADMIN" && user?.userType === "SYSTEM_ADMIN")
      redirect("/dashboard");
    if (user?.userType === "TENANT") redirect("/tenant-use-mobile");
    redirect("/");
  }

  return (
    <AuthSplitShell
      title="Sign In"
      description="Enter your credentials to access your rental management dashboard."
    >
      <Suspense
        fallback={<div className="animate-pulse rounded bg-slate-200 py-10" />}
      >
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary-700 hover:text-primary-600 hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </AuthSplitShell>
  );
}
