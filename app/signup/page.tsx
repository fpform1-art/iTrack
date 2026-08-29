"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpWithPassword, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ActionState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUpWithPassword, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">iTrack</h1>
          <p className="mt-1 text-sm text-slate-500">Betting Performance Tracker</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-slate-900">Create your account</h2>

          <form action={formAction} className="space-y-4">
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div>
              <Label htmlFor="accessCode">
                Beta access code <span className="font-normal text-slate-400">(if you have one)</span>
              </Label>
              <Input id="accessCode" name="accessCode" type="text" autoComplete="off" />
            </div>
            <FormMessage error={state.error} success={state.success} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account…" : "Sign up"}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-slate-700 underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
