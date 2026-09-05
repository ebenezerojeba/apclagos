"use client";

import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";

/** Clears the session, then sends the browser back to the login screen. */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (pending) return;
        setPending(true);
        await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
        router.refresh();
        router.replace("/admin/login");
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-3.5" aria-hidden="true" />
      )}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
