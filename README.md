# APC Lagos

The digital information platform for the All Progressives Congress, Lagos State
Chapter — party leadership, the 57 local councils, elected representatives,
candidates, news, events and media.

---

## Running it

```bash
cp .env.example .env.local     # then fill in the values
npm install
npm run dev                    # http://localhost:3000
```

```bash
npm run build && npm start     # production build
npm run typecheck              # tsc --noEmit
npm run lint
```

Node 20.9+ is required.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Per-route metadata, canonical URLs, sitemap/robots, `[slug]` routes, route-level loading, image optimisation and a real server boundary for the admin area |
| Language | TypeScript, `strict` | Every content model is typed end to end |
| Styling | Tailwind CSS v4 | Design tokens live in `@theme` in `src/app/globals.css` |
| Motion | Framer Motion | Reveals, staggers, counters, parallax — all reduced-motion aware |
| 3D | Three.js + React Three Fiber | One use only: the hero depth field, dynamically imported and unmounted off-screen |
| Validation | Zod | Contact form and the search endpoint |

## How the data layer works

```
src/data/*.ts        typed records (the source of truth today)
      │
src/lib/content.ts   the repository — every read the site performs
      │
app/**/page.tsx      server components that render the results
```

**Nothing is hard-coded in JSX.** Directories, filters, search, the sitemap and
the structured data are all derived from `src/lib/content.ts`. Every function
there is `async` and returns plain serialisable objects, so moving to a
Node/Express + database API means editing only the bodies of those functions:

```ts
export async function getLeaders(): Promise<Leader[]> {
  const res = await fetch(`${process.env.CONTENT_API_URL}/leaders`, {
    headers: { authorization: `Bearer ${process.env.CONTENT_API_TOKEN}` },
    next: { revalidate: 300, tags: ["leaders"] },
  });
  return res.json();
}
```

No page or component changes. `import "server-only"` at the top of that module
guarantees the data source — and any future API token — can never be bundled
into the client.

### What ships with real data

`src/data/geography.ts` holds the structural facts about Lagos State, all of
them verifiable public record:

- 20 Local Government Areas and 37 Local Council Development Areas (57 councils)
- 3 senatorial districts, 24 federal constituencies, 40 state constituencies
- the relationships between all of them

Two things in that file are marked `NEEDS-VERIFICATION` and should be confirmed
before launch: per-LGA ward counts (left empty rather than estimated), and the
state→federal constituency mapping where an LGA carries two federal seats.

### What ships empty, on purpose

The CMS collections and `editorial.ts`, `media.ts` and `resources.ts` all start empty.
No name, office, biography, headline, achievement or electoral claim has been
invented. Each file carries a worked example in its header comment, and
`content/` holds machine-readable templates for every record type.

Until a record exists the UI renders a designed pending state that says what
will appear and which file to edit — never a fabricated placeholder person.

Add records and everything downstream updates automatically: directories,
filters, search, sitemap, structured data, Open Graph cards.

## Adding content

| To add | Edit | Template |
| --- | --- | --- |
| A leader, chairman, senator, member or candidate | **the editor at `/keystatic`** | — |
| A news article or event | `src/data/editorial.ts` | `content/news.template.json`, `content/events.template.json` |
| A photo album or video | `src/data/media.ts` | `content/media.template.json` |
| An achievement or document | `src/data/resources.ts` | `content/resources.template.json` |
| Wards | `src/data/resources.ts` | `content/wards.template.csv` |
| An election cycle | `src/data/elections.ts` | — |
| Contact details, navigation, social handles | `src/data/site.ts` | — |
| Homepage copy and hero image | `src/data/homepage.ts` | — |
| About page copy and milestones | `src/data/about.ts` | — |

Photographs: see `public/images/README.md` for the folder layout, the aspect
ratio each slot expects, and how a supplied file is mapped to a person.

## Routes

```
/                              /news                    /gallery
/about                         /news/[slug]             /gallery/[slug]
/structure                     /events                  /media
/leadership                    /events/[slug]           /media/[slug]
/leadership/[slug]             /candidates              /achievements
/councils                      /candidates/[slug]       /documents
/lgas        /lgas/[slug]      /elections               /contact
/lcdas       /lcdas/[slug]     /elections/[slug]        /search
/wards       /constituencies   /representatives/[chamber]/[slug]
```

Plus `/sitemap.xml`, `/robots.txt`, `/api/search`, `/api/contact`, `/api/og`
and the gated `/admin`.

87 pages are prerendered at build time, including all 57 council pages.

## Architecture

```
src/
├── app/                 routes, route handlers, sitemap, robots, error boundaries
├── components/
│   ├── layout/          header, mega menu, mobile drawer, footer, brand
│   ├── sections/        page-level compositions (hero, page header, profiles)
│   ├── directories/     the filterable listings (councils, people, media…)
│   ├── cards/           person, council, news, event, gallery, video, document
│   ├── ui/              buttons, controls, modal, lightbox, media, states
│   ├── motion/          Reveal, Stagger, Counter, SplitText, Parallax, Magnetic
│   ├── search/          command palette and the results-page input
│   ├── forms/           contact form
│   └── three/           the hero WebGL field
├── data/                content and configuration
├── hooks/               reduced motion, focus trap, scroll lock, debounce…
├── lib/                 content repository, search, SEO, formatting, labels
│   └── server/          auth boundary, admin repository contract, contact
├── types/               every domain model
└── middleware.ts        coarse gate on /admin
```

Two directory components cover most of the site: `CouncilDirectory` (the 57
councils) and `PersonDirectory` (leadership, each chamber, candidates). Both are
configured with plain serialisable data, so adding a filtered listing is a
matter of describing its facets rather than writing another one.

## Navigation feedback

The App Router emits no "navigation started" event, so a click on a slow
connection used to produce no acknowledgement at all — the classic cause of
people clicking the same link three times.

Three layers now cover it:

| Layer | File | What it does |
| --- | --- | --- |
| Global progress bar | `src/components/layout/RouteProgress.tsx` | A 3px crimson-to-brass bar appears on the same tick a link is pressed |
| Per-control state | `src/components/ui/LinkPending.tsx` | The pressed button shows a sweeping rule until its route arrives |
| Route skeletons | `src/app/**/loading.tsx` | 31 segment-level skeletons shaped like their destination |

`RouteProgress` listens for the click itself, then detects completion three
ways — `usePathname()` changing, `location.href` changing (which catches
query-string-only navigations like `/news?category=…`, where the pathname never
moves), and a safety timeout so a cancelled navigation can never strand the bar.
It writes `transform` and `opacity` straight to the node rather than through
state, so a bar that updates several times a second never re-renders the tree or
touches layout. External links, in-page anchors, downloads, modified clicks and
new-tab clicks are all skipped.

`LinkPending` uses Next's `useLinkStatus`, so it knows about *its own* link
rather than navigation in general. It draws a rule along the bottom of the
control instead of swapping in a spinner, which would resize the label at the
moment the viewer is looking at it.

Skeletons live in `src/components/ui/skeletons.tsx` and mirror the block
structure of the page they stand in for, so nothing jumps when the real content
arrives. Note that for prefetched routes Next keeps the current page on screen
rather than showing a skeleton — which is why the progress bar, not
`loading.tsx`, is the load-bearing part of this.

Both animated layers are reduced-motion aware, and both are deliberately
*exempt* from the global motion reset in `globals.css`: with their durations
zeroed they would convey nothing. They are a 3px bar and a hairline rule, not
the kind of movement the preference exists to suppress.

## Editing content

People records — leadership, council chairmen, senators, members of both federal
chambers and the State House of Assembly, and candidates — are edited in a CMS
and stored as JSON under `content/people/**`.

```
/keystatic          the editor  (/admin redirects here)
keystatic.config.ts the schema every form is generated from
src/lib/cms.ts      reads those files and maps them onto the domain types
src/lib/content.ts  the repository every page already used
```

Nothing downstream changed. Pages still consume `Senator`, `Leader` and
`Candidate` exactly as before — the content simply moved.

### Adding a representative

1. Open `/keystatic` and choose the chamber.
2. Fill in the name, title and position, and pick the constituency from the
   dropdown. Those lists are generated from `src/data/geography.ts`, so a slug
   can never be mistyped into a seat that does not exist.
3. Upload the photograph. It is written to `public/images/people/` and wired to
   the profile automatically — 3:4, at least 900x1200, face in the upper third.
4. Set **Status** to Published. Drafts stay off the public site.

One record populates the chamber directory, its filters, the profile page,
global search, the constituency page, the sitemap and the Open Graph card.

### How saving works

| | Development | Production |
| --- | --- | --- |
| Mode | `local` | `github` |
| Auth | none | GitHub sign-in |
| Saves to | your working tree | a commit on the repo |
| Goes live | on save | after the redeploy (~1 min) |

The mode is chosen by `NODE_ENV`, which `next build` and `next start` both set
to production — local mode, which has no authentication, cannot be switched on
in a deployment by setting a variable.

Every change is a commit with an author and a timestamp. For a register of who
holds which office, that audit trail is the point.

### Connecting it in production

Until the five `KEYSTATIC_*` variables in `.env.example` are set, `/keystatic`
shows a setup screen naming what is missing, and the public site builds and
deploys normally — an unconfigured editor must never block a deployment.

To set them up: run `npm run dev`, open `/keystatic`, and use Keystatic's own
setup screen to create the GitHub App. It writes the values into `.env.local`;
copy them into the deployment's environment and redeploy.

Access is the repository's collaborator list. Adding someone on GitHub gives
them editing rights; removing them takes those rights away. There is no separate
user list to keep in step.

### Still in TypeScript files

News, events, media, achievements, documents, wards and elections are still
edited in `src/data/*.ts`. Adding them to the CMS is a matter of describing them
in `keystatic.config.ts` and adding a reader to `src/lib/cms.ts` — the article
body model needs the most thought, since it maps to a block field rather than a
plain text one.

## Environment variables

No secret is required to build or to serve the public site — every variable
below is optional, and the app falls back to safe defaults. Values are read only
in `server-only` modules unless the name is prefixed `NEXT_PUBLIC_`.

| Variable | Used by | Scope | Build | Runtime | Format |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `src/data/site.ts` → canonicals, sitemap, OG, JSON-LD | client + server | yes | yes | absolute origin, e.g. `https://www.apclagos.org` |
| `GOOGLE_SITE_VERIFICATION` | `src/app/layout.tsx` | server | yes | no | Search Console token |
| `CONTACT_FORM_SECRET` | `src/lib/server/contact.ts` | server | no | yes | long random string |
| `CONTACT_INBOX_EMAIL` | `src/lib/server/contact.ts` | server | no | yes | email address |
| `ADMIN_ENABLED` | `src/lib/server/auth.ts`, `src/middleware.ts` | server | no | yes | `"true"` to expose `/admin`; anything else 404s it |
| `CONTENT_API_URL` | `src/lib/server/repository.ts` | server | no | yes | base URL of the future admin API |
| `CONTENT_API_TOKEN` | reserved for `ApiContentRepository` | server | no | yes | bearer token |

`NEXT_PUBLIC_SITE_URL` is validated at import time: a value missing its protocol
fails the build with a message naming the variable, rather than a bare
`TypeError: Invalid URL`. Leave it unset and the site uses its fallback origin.

Without `CONTACT_FORM_SECRET` the contact endpoint refuses every submission and
says so — it fails closed rather than silently accepting mail it cannot sign.

## Security

- Strict CSP plus HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options` and `Permissions-Policy` — all in `next.config.ts`
- Article bodies use a closed block model, so no raw HTML from the data layer
  ever reaches the page; there is no `dangerouslySetInnerHTML` outside the
  JSON-LD emitter, which escapes `<`
- Contact form: Zod validation, an HMAC-signed and expiring form token, a
  minimum fill time, a honeypot, and a per-IP rate limit
- Search: query validated and length-capped, with the index never leaving the
  server
- Secrets are unprefixed and read only in `server-only` modules

## Accessibility

- One `<h1>` per page, landmarks throughout, a skip link
- Full keyboard support: mega menu, mobile drawer, custom select, command
  palette (combobox semantics), lightbox (arrow keys), focus trapping and
  restoration on every overlay
- Visible focus ring everywhere, with a light variant on dark panels
- `prefers-reduced-motion` honoured globally in CSS *and* per component
- Every image has `alt`; decorative layers are `aria-hidden`
- Filter results are announced through live regions

## Performance

- 103 kB shared JS; ~178 kB first load on the heaviest route
- Three.js is a separate chunk, only mounted while the hero is on screen, with
  its frame loop stopped when it is not, and never mounted under reduced motion
- Video embeds load nothing from YouTube or Vimeo until the viewer presses play
- Every image goes through `next/image` with an explicit `sizes`, a reserved
  aspect box and lazy loading below the fold
- 87 routes prerendered; `/news`, `/search`, `/contact` and `/admin` are
  dynamic because they read request state

## SEO

Every page composes its metadata through `buildMetadata()` in `src/lib/seo.ts`:
unique title, description, canonical URL, Open Graph and Twitter cards. Search
and deep pagination views are `noindex`. Structured data covers
`PoliticalParty`, `WebSite` + `SearchAction`, `BreadcrumbList`, `Person`,
`NewsArticle`, `Event` and `ItemList`. `/api/og` generates a branded social card
per page.

## Before launch

- [ ] Replace `NEEDS-VERIFICATION` values in `src/data/site.ts` — address, phone,
      email, social handles
- [ ] Replace the mission, vision and principles placeholders in
      `src/data/about.ts`
- [ ] Confirm ward delimitation and load `content/wards.template.csv`
- [ ] Confirm the state→federal constituency mapping in `src/data/geography.ts`
- [ ] Add leadership, council, representative and candidate records with
      photographs
- [ ] Set `NEXT_PUBLIC_SITE_URL` and a strong `CONTACT_FORM_SECRET`
- [ ] Connect an email provider in `deliverContactMessage()`
- [ ] Save the party's official logo to `public/images/logos/apc-logo.png`
      (already wired up; see `public/images/README.md`) and replace `src/app/icon.svg`
