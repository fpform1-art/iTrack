"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { BetaBadge } from "@/components/ui/beta-badge";

const initialState: ActionState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            iTraxc
            <BetaBadge />
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Betting Performance Tracker</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">Reset your password</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            We&apos;ll email you a link to choose a new password.
          </p>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <FormMessage error={state.error} success={state.success} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            <Link href="/login" className="text-slate-700 underline dark:text-slate-300">
              Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
