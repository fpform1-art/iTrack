"use client";

import { useActionState } from "react";
import { useAppData } from "@/components/shell/app-data-context";
import { updateProfile } from "@/lib/actions/profile";
import { submitFeedback } from "@/lib/actions/feedback";
import { signOut } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Currency } from "@/types/database";

const CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "EUR", "AUD", "NZD"];
const initialState: ActionState = {};

export function SettingsClient() {
  const { profile, refreshData } = useAppData();
  const [profileState, profileAction, profilePending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if (result.success) refreshData();
      return result;
    },
    initialState
  );
  const [feedbackState, feedbackAction, feedbackPending] = useActionState(submitFeedback, initialState);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your profile defaults and account.</p>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Profile</h2>
        <form action={profileAction} className="space-y-4">
          <div>
            <Label htmlFor="display_name">Profile Name</Label>
            <Input id="display_name" name="display_name" defaultValue={profile.display_name ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" name="currency" defaultValue={profile.currency}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="default_sportsbook">Default Sportsbook</Label>
              <Input
                id="default_sportsbook"
                name="default_sportsbook"
                defaultValue={profile.default_sportsbook ?? ""}
                placeholder="bet365"
              />
            </div>
            <div>
              <Label htmlFor="default_wager">Default Wager</Label>
              <Input
                id="default_wager"
                name="default_wager"
                type="number"
                step="0.01"
                min="0"
                defaultValue={profile.default_wager ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="starting_bankroll">Starting Bankroll</Label>
              <Input
                id="starting_bankroll"
                name="starting_bankroll"
                type="number"
                step="0.01"
                min="0"
                defaultValue={profile.starting_bankroll}
                required
              />
            </div>
          </div>
          <FormMessage error={profileState.error} success={profileState.success} />
          <Button type="submit" disabled={profilePending}>
            {profilePending ? "Saving…" : "Save Settings"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Beta Feedback</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Bugs, feature ideas, or anything confusing — we read all of it.</p>
        <form action={feedbackAction} className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue="bug">
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="ux">UX</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={4000}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-100/10 dark:focus:border-slate-500"
            />
          </div>
          <FormMessage error={feedbackState.error} success={feedbackState.success} />
          <Button type="submit" variant="secondary" disabled={feedbackPending}>
            {feedbackPending ? "Sending…" : "Submit Feedback"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Import from old tracker</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Have data from the Google Sheets tracker? Import it from a CSV export.
        </p>
        <Link href="/settings/import">
          <Button variant="secondary" size="sm">
            Go to CSV Import
          </Button>
        </Link>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Log out
        </Button>
      </form>
    </div>
  );
}
