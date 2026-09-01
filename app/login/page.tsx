"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInWithPassword, signInWithMagicLink, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { BetaBadge } from "@/components/ui/beta-badge";

const initialState: ActionState = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    initialState
  );
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    initialState
  );

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
          <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Log in</h2>

          {mode === "password" ? (
            <form action={passwordAction} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <FormMessage error={passwordState.error} success={passwordState.success} />
              <Button type="submit" className="w-full" disabled={passwordPending}>
                {passwordPending ? "Logging in…" : "Log in"}
              </Button>
            </form>
          ) : (
            <form action={magicAction} className="space-y-4">
              <div>
                <Label htmlFor="magic-email">Email</Label>
                <Input id="magic-email" name="email" type="email" autoComplete="email" required />
              </div>
              <FormMessage error={magicState.error} success={magicState.success} />
              <Button type="submit" className="w-full" disabled={magicPending}>
                {magicPending ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === "password" ? "magic" : "password")}
            className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {mode === "password" ? "Use a magic link instead" : "Use a password instead"}
          </button>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <Link href="/reset-password" className="hover:text-slate-700 dark:hover:text-slate-200">
              Forgot password?
            </Link>
            <Link href="/signup" className="hover:text-slate-700 dark:hover:text-slate-200">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
