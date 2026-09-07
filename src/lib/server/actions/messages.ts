"use server";

import { redirect } from "next/navigation";
import { ContactMessage, CONTACT_STATUSES } from "../models";
import { guard } from "../admin/guard";
import { str } from "../admin/forms";

/**
 * Managing the contact inbox.
 *
 * Messages are never edited - they are somebody else's words - so the only
 * operations are changing the status and deleting. Marking a message handled
 * records who did it and when, so a shared inbox does not become two people
 * answering the same enquiry.
 */

export async function setMessageStatus(form: FormData): Promise<void> {
  const auth = await guard("write");
  if (!auth.ok) {
    redirect(`/admin/messages?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }

  const id = str(form, "id");
  const status = str(form, "status");
  if (!id || !status || !CONTACT_STATUSES.includes(status as never)) {
    redirect("/admin/messages?error=Unknown+status.");
  }

  try {
    await ContactMessage.findByIdAndUpdate(id, {
      status,
      // Only a terminal status records a handler; re-opening clears it.
      ...(status === "handled"
        ? { handledAt: new Date(), handledBy: auth.session.userId }
        : { $unset: { handledAt: "", handledBy: "" } }),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[admin] update message status failed: ${name}`);
    redirect("/admin/messages?error=Could+not+update+that+message.");
  }

  redirect(`/admin/messages?saved=1&status=${status}`);
}

/**
 * Deletes a message permanently.
 *
 * Requires the `delete` capability, which only an owner holds: this is
 * correspondence from a member of the public and there is no second copy.
 */
export async function deleteMessage(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/messages?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }

  const id = str(form, "id");
  if (id) await ContactMessage.findByIdAndDelete(id).catch(() => null);

  redirect("/admin/messages?deleted=1");
}
