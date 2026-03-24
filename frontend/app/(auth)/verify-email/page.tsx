"use client";

import { Suspense } from "react";
import { VerifyEmailForm } from "@/features/auth/VerifyEmailForm";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Verify your email
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the token from your email
          </p>
        </div>
        <Suspense
          fallback={<div className="animate-pulse rounded bg-slate-200 py-8" />}
        >
          <VerifyEmailForm />
        </Suspense>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-slate-500 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
