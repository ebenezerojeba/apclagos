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

`people.ts`, `editorial.ts`, `media.ts` and `resources.ts` export empty arrays.
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
| A leader, chairman, senator, member or candidate | `src/data/people.ts` | `content/people.template.json` |
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

## Administration

There is deliberately **no login form, no hard-coded credential and no
client-side `isAdmin` flag**. A placeholder auth system is worse than none: it
looks like protection while providing none, and it survives to production.

Instead `src/lib/server/auth.ts` defines the contract a real identity provider
must satisfy, and fails closed:

- `ADMIN_ENABLED` defaults to false, and `/admin` returns 404
- `getSession()` returns `null` until `resolveSession()` is implemented
- `requireAdmin(capability)` is the single gate every admin route must call
- `src/middleware.ts` is a coarse first line of defence, never the check itself

`src/lib/server/repository.ts` defines the write side — list, get, create,
update, delete, publish, unpublish and image upload across all 16 collections.
The default implementation is read-only and throws a clear error rather than
pretending a write succeeded.

**To enable it:** connect a provider, implement `resolveSession()`, set
`ADMIN_ENABLED=true`, and implement `ApiContentRepository` against your API.

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
