"use client";

import { RegisterForm } from "@/features/auth/RegisterForm";
import Link from "next/link";
import { AuthSplitShell } from "@/features/auth/AuthSplitShell";

export default function RegisterPage() {
  return (
    <AuthSplitShell
      title="Create Account"
      description="Set up your landlord account and start managing your properties in one place."
    >
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary-700 hover:text-primary-600 hover:underline"
        >
          Sign In
        </Link>
      </p>
    </AuthSplitShell>
  );
}
