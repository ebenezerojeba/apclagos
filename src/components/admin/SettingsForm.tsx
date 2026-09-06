"use client";

import { AdminField, AdminTextarea } from "@/components/admin/AdminField";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { ImageField, type ImageValue } from "@/components/admin/ImageField";
import { Section } from "@/components/admin/EditorialForm";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * The site-wide contact and identity settings.
 */

export interface SettingsInitial {
  organisationName: string;
  tagline: string;
  description: string;
  addressLines: string[];
  city: string;
  state: string;
  phones: string[];
  emails: string[];
  openingHours: string;
  mapQuery: string;
  social: Record<string, string>;
  logo?: ImageValue | null;
}

export function SettingsForm({
  action,
  initial,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: SettingsInitial;
}) {
  return (
    <AdminForm action={action}>
      {(state) => {
        const errors = state.fieldErrors ?? {};

        return (
          <>
            <Section title="Identity">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  id="organisationName"
                  name="organisationName"
                  label="Organisation name"
                  defaultValue={initial.organisationName}
                  error={errors.organisationName}
                />
                <AdminField
                  id="tagline"
                  name="tagline"
                  label="Tagline"
                  defaultValue={initial.tagline}
                  error={errors.tagline}
                />
                <AdminTextarea
                  id="description"
                  name="description"
                  label="Description"
                  rows={3}
                  hint="Used as the site's default meta description."
                  defaultValue={initial.description}
                  error={errors.description}
                  className="sm:col-span-2"
                />
              </div>
            </Section>

            <Section title="Logo">
              <ImageField
                name="logo"
                label="Logo"
                folder="logos"
                hint="Optional. The built-in wordmark is used when this is not set."
                initial={initial.logo ?? null}
                error={errors.logo}
              />
            </Section>

            <Section title="Contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminTextarea
                  id="addressLines"
                  name="addressLines"
                  label="Address"
                  rows={4}
                  hint="One line per line."
                  defaultValue={initial.addressLines.join("\n")}
                  error={errors.addressLines}
                  className="sm:col-span-2"
                />
                <AdminField
                  id="city"
                  name="city"
                  label="City"
                  defaultValue={initial.city}
                  error={errors.city}
                />
                <AdminField
                  id="state"
                  name="state"
                  label="State"
                  defaultValue={initial.state}
                  error={errors.state}
                />
                <AdminTextarea
                  id="phones"
                  name="phones"
                  label="Telephone numbers"
                  rows={3}
                  hint="One per line."
                  defaultValue={initial.phones.join("\n")}
                  error={errors.phones}
                />
                <AdminTextarea
                  id="emails"
                  name="emails"
                  label="Email addresses"
                  rows={3}
                  hint="One per line."
                  defaultValue={initial.emails.join("\n")}
                  error={errors.emails}
                />
                <AdminField
                  id="openingHours"
                  name="openingHours"
                  label="Opening hours"
                  defaultValue={initial.openingHours}
                  error={errors.openingHours}
                />
                <AdminField
                  id="mapQuery"
                  name="mapQuery"
                  label="Map search term"
                  hint="What the embedded map should search for."
                  defaultValue={initial.mapQuery}
                  error={errors.mapQuery}
                />
              </div>
            </Section>

            <Section title="Social channels">
              <div className="grid gap-4 sm:grid-cols-2">
                {(["facebook", "x", "instagram", "linkedin", "youtube"] as const).map(
                  (channel) => (
                    <AdminField
                      key={channel}
                      id={`social-${channel}`}
                      name={`social.${channel}`}
                      label={channel === "x" ? "X (Twitter)" : capitalise(channel)}
                      type="url"
                      placeholder="https://"
                      defaultValue={initial.social[channel] ?? ""}
                    />
                  ),
                )}
              </div>
            </Section>

            <div className="border-t border-border-subtle pt-6">
              <SubmitButton>Save settings</SubmitButton>
            </div>
          </>
        );
      }}
    </AdminForm>
  );
}

function capitalise(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}
