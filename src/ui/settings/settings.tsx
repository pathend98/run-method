"use client";

import Link from "next/link";

import { Button } from "@/ui/components/button";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";
import { SettingsForm } from "./components/settings-form";

export function Settings() {
  const currentUser = useCurrentUserQuery();

  if (currentUser.isPending) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-10">
        Loading settings...
      </section>
    );
  }

  if (currentUser.isError) {
    return (
      <section className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-10">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p role="alert">Unable to load settings.</p>
        <Button onClick={() => void currentUser.refetch()}>Retry</Button>
      </section>
    );
  }

  const user = currentUser.data;

  if (user.kind === "GUEST") {
    return (
      <section className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-10">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p>You need to register before you can use settings.</p>
        <Link
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          href="/auth"
        >
          Register
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-950">Settings</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage your running profile.
        </p>
      </div>
      <SettingsForm user={user} />
      <div className="border-t border-zinc-200 pt-6">
        <h2 className="text-lg font-semibold text-zinc-950">Account details</h2>
        <dl className="mt-4 grid gap-4 text-sm">
          <div>
            <dt className="text-zinc-600">Account ID</dt>
            <dd className="mt-1 break-all text-zinc-950">{user.id}</dd>
          </div>
          <div>
            <dt className="text-zinc-600">Account type</dt>
            <dd className="mt-1 text-zinc-950">Registered</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
