import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, ShieldCheck, Zap } from "lucide-react";

interface AuthSplitShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthSplitShell({
  title,
  description,
  children,
}: AuthSplitShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden min-h-screen overflow-hidden bg-primary-800 text-white lg:flex">
          <Image
            src="/auth-side-house.jpg"
            alt="Modern house exterior"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-900/86 via-primary-800/76 to-primary-700/68" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-950/52 via-transparent to-primary-500/34" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.95)_1px,transparent_0)] [background-size:34px_34px]" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between px-12 py-10 xl:px-16 xl:py-14">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="text-3xl font-semibold tracking-tight">
                RentHub
              </span>
            </Link>

            <div className="max-w-xl">
              <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
                Welcome to smarter rental operations
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-blue-100/85">
                Simplify your daily workflow with one dashboard for properties,
                tenants, payments, and lease lifecycle management.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                    <ShieldCheck className="h-4 w-4 text-blue-100" />
                  </span>
                  <div>
                    <p className="font-semibold">Secure Access</p>
                    <p className="text-sm text-blue-100/70">
                      Enterprise-ready protection
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                    <Zap className="h-4 w-4 text-blue-100" />
                  </span>
                  <div>
                    <p className="font-semibold">Fast Sync</p>
                    <p className="text-sm text-blue-100/70">
                      Real-time data updates
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-blue-100/60">
              © 2026 RentHub SaaS Platform. All rights reserved.
            </p>
          </div>
        </aside>

        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-12">
          <div className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white px-7 py-8 shadow-sm sm:px-10 sm:py-10">
            <div className="mb-8">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 lg:hidden"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-white">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="text-xl font-semibold text-slate-900">
                  RentHub
                </span>
              </Link>

              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="mt-3 text-sm text-slate-500">{description}</p>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
