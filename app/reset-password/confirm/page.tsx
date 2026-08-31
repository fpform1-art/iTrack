"use client";

import { useActionState } from "react";
import { updatePassword, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { BetaBadge } from "@/components/ui/beta-badge";

const initialState: ActionState = {};

export default function ResetPasswordConfirmPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            iTrack
            <BetaBadge />
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Betting Performance Tracker</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Choose a new password</h2>

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
            </div>
            <FormMessage error={state.error} success={state.success} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving…" : "Save new password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
