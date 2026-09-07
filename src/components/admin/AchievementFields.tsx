"use client";

import { AdminField, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import { EditorialForm, type EditorialInitial } from "@/components/admin/EditorialForm";
import type { Option } from "@/components/admin/PersonForm";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * `EditorialForm` with the fields particular to an achievement.
 *
 * Two things here are not in the other collections. **Attribution** credits the
 * milestone to a named person by slug, chosen from the people already in the
 * database — so crediting another leader means adding their record, never
 * editing this file. **Metrics** are the figures shown on the card, entered as
 * two aligned lists rather than repeatable input pairs, because the numbers
 * usually arrive pasted out of a report.
 */

export interface AchievementInitial extends EditorialInitial {
  category: string;
  year?: number;
  location?: string;
  lgaSlug?: string;
  personSlug?: string;
  source?: string;
  metricLabels: string[];
  metricValues: string[];
}

const CATEGORIES = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "security", label: "Security" },
  { value: "economy", label: "Economy" },
  { value: "transport", label: "Transport" },
  { value: "environment", label: "Environment" },
  { value: "social", label: "Social" },
  { value: "party-organisation", label: "Party organisation" },
];

export function AchievementFormScreen({
  action,
  initial,
  canPublish,
  people,
  lgas,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: AchievementInitial;
  canPublish: boolean;
  people: Option[];
  lgas: Option[];
}) {
  return (
    <EditorialForm
      action={action}
      initial={initial}
      canPublish={canPublish}
      folder="general"
      cancelHref="/admin/achievements"
      titleLabel="Title"
      summaryName="summary"
      summaryLabel="Summary"
      summaryHint="One sentence. This is what the card shows and what search engines use."
      bodyName="description"
      bodyLabel="Detail"
      extras={(errors) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminSelect
            id="category"
            name="category"
            label="Sector"
            options={CATEGORIES}
            defaultValue={initial.category}
            error={errors.category}
          />
          <AdminField
            id="year"
            name="year"
            label="Year"
            type="number"
            hint="The year the milestone is attributed to."
            defaultValue={initial.year ?? ""}
            error={errors.year}
          />
          <AdminSelect
            id="personSlug"
            name="personSlug"
            label="Credited to"
            placeholder="Not credited to an individual"
            options={people.map((person) => ({ value: person.slug, label: person.name }))}
            defaultValue={initial.personSlug}
            hint={
              people.length === 0
                ? "No people exist yet. Add them under People and they will appear here."
                : "Optional. Leave blank for party- or government-wide delivery."
            }
            error={errors.personSlug}
          />
          <AdminSelect
            id="lgaSlug"
            name="lgaSlug"
            label="Local government area"
            placeholder="Statewide"
            options={lgas.map((lga) => ({ value: lga.slug, label: lga.name }))}
            defaultValue={initial.lgaSlug}
            error={errors.lgaSlug}
          />
          <AdminField
            id="location"
            name="location"
            label="Location"
            hint="Where it was delivered, in plain words."
            defaultValue={initial.location}
            error={errors.location}
            className="sm:col-span-2"
          />
        </div>
      )}
      footerExtras={(errors) => (
        <div className="space-y-4">
          <AdminField
            id="source"
            name="source"
            label="Source"
            hint="The ministry, agency or council that published this. Every claim should be attributable."
            defaultValue={initial.source}
            error={errors.source}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminTextarea
              id="metricLabels"
              name="metricLabels"
              label="Metric labels"
              rows={4}
              hint="One per line, e.g. “Kilometres delivered”."
              defaultValue={initial.metricLabels.join("\n")}
              error={errors.metrics}
            />
            <AdminTextarea
              id="metricValues"
              name="metricValues"
              label="Metric values"
              rows={4}
              hint="One per line, matching the labels beside it."
              defaultValue={initial.metricValues.join("\n")}
            />
          </div>
          <p className="text-xs text-fg-muted">
            Labels and values are paired by line. A line missing either half is
            ignored rather than saved half-empty.
          </p>
        </div>
      )}
    />
  );
}
