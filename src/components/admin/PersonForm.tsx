"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminField, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { ImageField, type ImageValue } from "@/components/admin/ImageField";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * One form for all seven kinds of person.
 *
 * Which fields appear depends on `kind`, held in client state so the form
 * re-shapes the moment the selector changes rather than after a round trip. The
 * hidden fields for kinds that are not shown are simply not rendered, so a
 * senator's record never carries a stray council role left over from a
 * mis-click.
 *
 * Everything else is an uncontrolled input with a `defaultValue`. That is what
 * lets a failed save re-render the error banner while the browser keeps every
 * word the editor typed — a controlled form would have to round-trip all of it
 * through server state to achieve the same thing.
 */

export interface Option {
  slug: string;
  name: string;
}

export interface PersonOptions {
  senatorialDistricts: Option[];
  federalConstituencies: Option[];
  stateConstituencies: Option[];
  lgas: Option[];
  lcdas: Option[];
  elections: Option[];
}

export interface PersonInitial {
  id?: string;
  kind: string;
  slug: string;
  status: string;
  order?: number;
  name: string;
  honorific?: string;
  postNominals?: string;
  position: string;
  shortPosition?: string;
  summary?: string;
  biography: string[];
  portrait?: ImageValue | null;
  jurisdiction?: string;
  senatorialDistrictSlug?: string;
  federalConstituencySlug?: string;
  stateConstituencySlug?: string;
  lgaSlug?: string;
  lcdaSlug?: string;
  body?: string;
  featured: boolean;
  councilSlug?: string;
  councilType?: string;
  councilRole?: string;
  electionSlug?: string;
  office?: string;
  contestedSeat?: string;
  runningMateSlug?: string;
  manifesto: string[];
  tenureStart?: string;
  tenureEnd?: string;
  education: string[];
  careerHighlights: string[];
  previousPositions: string[];
  committees: string[];
  tags: string[];
  social: Record<string, string | undefined>;
  email?: string;
  phone?: string;
}

const KINDS: { value: string; label: string }[] = [
  { value: "leader", label: "State leadership" },
  { value: "chairman", label: "Council chairman" },
  { value: "official", label: "Council official" },
  { value: "senator", label: "Senator" },
  { value: "house-of-representatives", label: "House of Representatives" },
  { value: "house-of-assembly", label: "House of Assembly" },
  { value: "candidate", label: "Election candidate" },
];

const BODIES = [
  { value: "state-executive", label: "State executive" },
  { value: "state-working-committee", label: "State working committee" },
  { value: "elders-council", label: "Elders' council" },
  { value: "government", label: "Government" },
  { value: "national-representation", label: "National representation" },
  { value: "party-organ", label: "Party organ" },
];

const COUNCIL_ROLES = [
  "Chairman",
  "Vice Chairman",
  "Secretary to the Local Government",
  "Supervisor",
  "Councillor",
  "Party Chairman",
].map((role) => ({ value: role, label: role }));

const OFFICES = [
  { value: "governor", label: "Governor" },
  { value: "deputy-governor", label: "Deputy Governor" },
  { value: "senate", label: "Senate" },
  { value: "house-of-representatives", label: "House of Representatives" },
  { value: "house-of-assembly", label: "House of Assembly" },
  { value: "local-government-chairman", label: "Local government chairman" },
  { value: "councillor", label: "Councillor" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "draft", label: "Draft — not visible on the site" },
  { value: "published", label: "Published — live on the site" },
  { value: "archived", label: "Archived — kept but hidden" },
];

function toOptions(list: Option[]) {
  return list.map((entry) => ({ value: entry.slug, label: entry.name }));
}

export function PersonForm({
  action,
  initial,
  options,
  canPublish,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: PersonInitial;
  options: PersonOptions;
  canPublish: boolean;
}) {
  const [kind, setKind] = useState(initial.kind);

  const isCouncil = kind === "chairman" || kind === "official";
  const isCandidate = kind === "candidate";

  return (
    <AdminForm action={action}>
      {(state) => {
        const errors = state.fieldErrors ?? {};

        return (
          <>
            {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

            <Section
              title="Record type"
              hint="This decides where the person appears on the public site, and which references are required."
            >
              <AdminSelect
                id="kind"
                name="kind"
                label="Kind"
                required
                options={KINDS}
                defaultValue={initial.kind}
                onChange={(event) => setKind(event.target.value)}
                error={errors.kind}
              />
            </Section>

            <Section title="Identity">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  id="name"
                  name="name"
                  label="Full name"
                  required
                  defaultValue={initial.name}
                  error={errors.name}
                  className="sm:col-span-2"
                />
                <AdminField
                  id="honorific"
                  name="honorific"
                  label="Honorific"
                  hint="Chief, Otunba, Engr., Dr."
                  defaultValue={initial.honorific}
                  error={errors.honorific}
                />
                <AdminField
                  id="postNominals"
                  name="postNominals"
                  label="Post-nominals"
                  hint="CON, SAN, MFR"
                  defaultValue={initial.postNominals}
                  error={errors.postNominals}
                />
                <AdminField
                  id="position"
                  name="position"
                  label="Office or position"
                  required
                  hint="Written exactly as it should appear."
                  defaultValue={initial.position}
                  error={errors.position}
                  className="sm:col-span-2"
                />
                <AdminField
                  id="shortPosition"
                  name="shortPosition"
                  label="Short position"
                  hint="Used on cards where space is tight."
                  defaultValue={initial.shortPosition}
                  error={errors.shortPosition}
                />
                <AdminField
                  id="jurisdiction"
                  name="jurisdiction"
                  label="Jurisdiction"
                  hint="The area or remit this office covers."
                  defaultValue={initial.jurisdiction}
                  error={errors.jurisdiction}
                />
                <AdminTextarea
                  id="summary"
                  name="summary"
                  label="Summary"
                  rows={3}
                  hint="One or two sentences, used on listing cards and as the page description."
                  defaultValue={initial.summary}
                  error={errors.summary}
                  className="sm:col-span-2"
                />
              </div>
            </Section>

            <Section title="Portrait">
              <ImageField
                name="portrait"
                label="Portrait photograph"
                folder="people"
                hint="A head-and-shoulders photograph. Portrait or square framing works best."
                initial={initial.portrait ?? null}
                error={errors.portrait}
              />
            </Section>

            {/* --- Kind-specific references ------------------------------- */}

            {kind === "leader" ? (
              <Section
                title="Leadership organ"
                hint="Required for leadership records — it decides which section of the structure page this person appears under."
              >
                <AdminSelect
                  id="body"
                  name="body"
                  label="Organ"
                  required
                  placeholder="Select an organ…"
                  options={BODIES}
                  defaultValue={initial.body}
                  error={errors.body}
                />
              </Section>
            ) : null}

            {kind === "senator" ? (
              <Section title="Constituency">
                <AdminSelect
                  id="senatorialDistrictSlug"
                  name="senatorialDistrictSlug"
                  label="Senatorial district"
                  required
                  placeholder="Select a district…"
                  options={toOptions(options.senatorialDistricts)}
                  defaultValue={initial.senatorialDistrictSlug}
                  error={errors.senatorialDistrictSlug}
                />
              </Section>
            ) : null}

            {kind === "house-of-representatives" ? (
              <Section title="Constituency">
                <AdminSelect
                  id="federalConstituencySlug"
                  name="federalConstituencySlug"
                  label="Federal constituency"
                  required
                  placeholder="Select a constituency…"
                  options={toOptions(options.federalConstituencies)}
                  defaultValue={initial.federalConstituencySlug}
                  error={errors.federalConstituencySlug}
                />
              </Section>
            ) : null}

            {kind === "house-of-assembly" ? (
              <Section title="Constituency">
                <AdminSelect
                  id="stateConstituencySlug"
                  name="stateConstituencySlug"
                  label="State constituency"
                  required
                  placeholder="Select a constituency…"
                  options={toOptions(options.stateConstituencies)}
                  defaultValue={initial.stateConstituencySlug}
                  error={errors.stateConstituencySlug}
                />
              </Section>
            ) : null}

            {isCouncil ? (
              <Section title="Council">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminSelect
                    id="councilSlug"
                    name="councilSlug"
                    label="Council"
                    required={kind === "chairman"}
                    placeholder="Select a council…"
                    options={[
                      ...toOptions(options.lgas).map((option) => ({
                        ...option,
                        label: `${option.label} (LGA)`,
                      })),
                      ...toOptions(options.lcdas).map((option) => ({
                        ...option,
                        label: `${option.label} (LCDA)`,
                      })),
                    ]}
                    defaultValue={initial.councilSlug}
                    error={errors.councilSlug}
                    className="sm:col-span-2"
                  />
                  <AdminSelect
                    id="councilType"
                    name="councilType"
                    label="Council type"
                    placeholder="Select…"
                    options={[
                      { value: "LGA", label: "Local Government Area" },
                      { value: "LCDA", label: "Local Council Development Area" },
                    ]}
                    defaultValue={initial.councilType}
                    error={errors.councilType}
                  />
                  <AdminSelect
                    id="councilRole"
                    name="councilRole"
                    label="Role"
                    placeholder="Select…"
                    options={COUNCIL_ROLES}
                    defaultValue={initial.councilRole}
                    error={errors.councilRole}
                  />
                </div>
              </Section>
            ) : null}

            {isCandidate ? (
              <Section title="Candidacy">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminSelect
                    id="electionSlug"
                    name="electionSlug"
                    label="Election"
                    required
                    placeholder="Select an election…"
                    options={toOptions(options.elections)}
                    defaultValue={initial.electionSlug}
                    error={errors.electionSlug}
                  />
                  <AdminSelect
                    id="office"
                    name="office"
                    label="Office contested"
                    placeholder="Select…"
                    options={OFFICES}
                    defaultValue={initial.office}
                    error={errors.office}
                  />
                  <AdminField
                    id="contestedSeat"
                    name="contestedSeat"
                    label="Seat contested"
                    hint="The specific seat, where the office alone is not enough."
                    defaultValue={initial.contestedSeat}
                    error={errors.contestedSeat}
                  />
                  <AdminField
                    id="runningMateSlug"
                    name="runningMateSlug"
                    label="Running mate slug"
                    hint="The URL slug of another candidate record."
                    defaultValue={initial.runningMateSlug}
                    error={errors.runningMateSlug}
                  />
                  <AdminTextarea
                    id="manifesto"
                    name="manifesto"
                    label="Manifesto"
                    rows={6}
                    hint="One paragraph per block, separated by a blank line."
                    defaultValue={initial.manifesto.join("\n\n")}
                    error={errors.manifesto}
                    className="sm:col-span-2"
                  />
                </div>
              </Section>
            ) : null}

            <Section
              title="Location"
              hint="Optional. Links this person to a local government area, which several pages use to group people geographically."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminSelect
                  id="lgaSlug"
                  name="lgaSlug"
                  label="Local government area"
                  placeholder="None"
                  options={toOptions(options.lgas)}
                  defaultValue={initial.lgaSlug}
                  error={errors.lgaSlug}
                />
                <AdminSelect
                  id="lcdaSlug"
                  name="lcdaSlug"
                  label="LCDA"
                  placeholder="None"
                  options={toOptions(options.lcdas)}
                  defaultValue={initial.lcdaSlug}
                  error={errors.lcdaSlug}
                />
              </div>
            </Section>

            <Section title="Biography and record">
              <div className="space-y-4">
                <AdminTextarea
                  id="biography"
                  name="biography"
                  label="Biography"
                  rows={10}
                  hint="One paragraph per block, separated by a blank line."
                  defaultValue={initial.biography.join("\n\n")}
                  error={errors.biography}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminTextarea
                    id="education"
                    name="education"
                    label="Education"
                    rows={4}
                    hint="One entry per line."
                    defaultValue={initial.education.join("\n")}
                    error={errors.education}
                  />
                  <AdminTextarea
                    id="careerHighlights"
                    name="careerHighlights"
                    label="Career highlights"
                    rows={4}
                    hint="One entry per line."
                    defaultValue={initial.careerHighlights.join("\n")}
                    error={errors.careerHighlights}
                  />
                  <AdminTextarea
                    id="previousPositions"
                    name="previousPositions"
                    label="Previous positions"
                    rows={4}
                    hint="One entry per line."
                    defaultValue={initial.previousPositions.join("\n")}
                    error={errors.previousPositions}
                  />
                  <AdminTextarea
                    id="committees"
                    name="committees"
                    label="Committees"
                    rows={4}
                    hint="One entry per line."
                    defaultValue={initial.committees.join("\n")}
                    error={errors.committees}
                  />
                  <AdminField
                    id="tenureStart"
                    name="tenureStart"
                    label="Tenure start"
                    type="date"
                    defaultValue={initial.tenureStart}
                    error={errors.tenureStart}
                  />
                  <AdminField
                    id="tenureEnd"
                    name="tenureEnd"
                    label="Tenure end"
                    type="date"
                    hint="Leave blank if this office is currently held."
                    defaultValue={initial.tenureEnd}
                    error={errors.tenureEnd}
                  />
                </div>
              </div>
            </Section>

            <Section title="Contact and channels">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  defaultValue={initial.email}
                  error={errors.email}
                />
                <AdminField
                  id="phone"
                  name="phone"
                  label="Telephone"
                  type="tel"
                  defaultValue={initial.phone}
                  error={errors.phone}
                />
                {(["facebook", "x", "instagram", "linkedin", "youtube", "website"] as const).map(
                  (channel) => (
                    <AdminField
                      key={channel}
                      id={`social-${channel}`}
                      name={`social.${channel}`}
                      label={channel === "x" ? "X (Twitter)" : capitalise(channel)}
                      type="url"
                      placeholder="https://"
                      defaultValue={initial.social[channel]}
                    />
                  ),
                )}
              </div>
            </Section>

            <Section title="Publication">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  id="slug"
                  name="slug"
                  label="URL slug"
                  hint={
                    initial.id
                      ? "Changing this changes the page's address. Existing links will break."
                      : "Left blank, this is generated from the name."
                  }
                  defaultValue={initial.slug}
                  error={errors.slug}
                />
                <AdminSelect
                  id="status"
                  name="status"
                  label="Status"
                  options={
                    canPublish
                      ? STATUSES
                      : STATUSES.filter((status) => status.value !== "published")
                  }
                  defaultValue={initial.status}
                  hint={
                    canPublish
                      ? undefined
                      : "Your role can draft but not publish. An editor can publish this for you."
                  }
                  error={errors.status}
                />
                <AdminField
                  id="order"
                  name="order"
                  label="Sort order"
                  type="number"
                  hint="Lower numbers appear first. Leave blank to sort by name."
                  defaultValue={initial.order ?? ""}
                  error={errors.order}
                />
                <AdminField
                  id="tags"
                  name="tags"
                  label="Tags"
                  hint="Comma separated."
                  defaultValue={initial.tags.join(", ")}
                  error={errors.tags}
                />
                <label className="flex items-start gap-3 sm:col-span-2">
                  <input type="hidden" name="featured" value="0" />
                  <input
                    type="checkbox"
                    name="featured"
                    value="1"
                    defaultChecked={initial.featured}
                    className="mt-0.5 size-4 rounded border-border accent-ink-900"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-fg">Featured</span>
                    <span className="mt-0.5 block text-fg-muted">
                      Highlight this person on the homepage and section landing pages.
                    </span>
                  </span>
                </label>
              </div>
            </Section>

            <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
              <SubmitButton>{initial.id ? "Save changes" : "Create record"}</SubmitButton>
              <Link
                href="/admin/people"
                className="rounded-full px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
              >
                Cancel
              </Link>
            </div>
          </>
        );
      }}
    </AdminForm>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg text-fg">{title}</h2>
      {hint ? <p className="mt-1 text-[0.8125rem] text-fg-muted">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function capitalise(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}
