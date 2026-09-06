"use client";

import { AdminField, AdminSelect } from "@/components/admin/AdminField";
import { EditorialForm, type EditorialInitial } from "@/components/admin/EditorialForm";
import type { Option } from "@/components/admin/PersonForm";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * `EditorialForm` with the fields particular to an event.
 */

export interface EventInitial extends EditorialInitial {
  category: string;
  startsAt?: string;
  endsAt?: string;
  venueName?: string;
  venueAddress?: string;
  lgaSlug?: string;
  registrationUrl?: string;
  notice?: string;
}

const CATEGORIES = [
  { value: "congress", label: "Congress" },
  { value: "rally", label: "Rally" },
  { value: "meeting", label: "Meeting" },
  { value: "town-hall", label: "Town hall" },
  { value: "commissioning", label: "Commissioning" },
  { value: "training", label: "Training" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

export function EventFormScreen({
  action,
  initial,
  canPublish,
  lgas,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: EventInitial;
  canPublish: boolean;
  lgas: Option[];
}) {
  return (
    <EditorialForm
      action={action}
      initial={initial}
      canPublish={canPublish}
      folder="events"
      cancelHref="/admin/events"
      titleLabel="Event title"
      summaryName="summary"
      summaryLabel="Summary"
      summaryHint="One line describing what this event is, used on cards and in the calendar."
      extras={(errors) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminSelect
            id="category"
            name="category"
            label="Category"
            options={CATEGORIES}
            defaultValue={initial.category}
            error={errors.category}
          />
          <AdminField
            id="notice"
            name="notice"
            label="Notice"
            hint="A short banner, e.g. “Delegates only”."
            defaultValue={initial.notice}
            error={errors.notice}
          />
          <AdminField
            id="startsAt"
            name="startsAt"
            label="Starts"
            type="datetime-local"
            required
            defaultValue={initial.startsAt}
            error={errors.startsAt}
          />
          <AdminField
            id="endsAt"
            name="endsAt"
            label="Ends"
            type="datetime-local"
            hint="Optional. Must not be before the start."
            defaultValue={initial.endsAt}
            error={errors.endsAt}
          />
        </div>
      )}
      footerExtras={(errors) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            id="venueName"
            name="venueName"
            label="Venue"
            defaultValue={initial.venueName}
            error={errors.venueName}
          />
          <AdminSelect
            id="lgaSlug"
            name="lgaSlug"
            label="Local government area"
            placeholder="None"
            options={lgas.map((lga) => ({ value: lga.slug, label: lga.name }))}
            defaultValue={initial.lgaSlug}
            error={errors.lgaSlug}
          />
          <AdminField
            id="venueAddress"
            name="venueAddress"
            label="Address"
            defaultValue={initial.venueAddress}
            error={errors.venueAddress}
            className="sm:col-span-2"
          />
          <AdminField
            id="registrationUrl"
            name="registrationUrl"
            label="Registration link"
            type="url"
            placeholder="https://"
            defaultValue={initial.registrationUrl}
            error={errors.registrationUrl}
            className="sm:col-span-2"
          />
        </div>
      )}
    />
  );
}
