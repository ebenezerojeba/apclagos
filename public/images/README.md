# Images

Where supplied photographs go, and how each one is mapped to a record.

Nothing on this site invents a likeness. Where a photograph has not been
supplied, a portrait slot renders a monogram and a "Photograph pending" label,
and a cover slot renders a neutral engraved panel. Adding the file and pointing a
record at it is all that is needed to replace either.

## Folder layout

```
public/images/
├── people/       Portraits — leaders, chairmen, representatives, candidates
├── hero/         Homepage and page-header background photography
├── news/         Article cover and inline images
├── events/       Event cover images
├── gallery/      One sub-folder per album: gallery/<album-slug>/01.jpg …
├── logos/        Official party artwork, if it is to replace the SVG emblem
└── documents/    Thumbnails for downloadable documents (optional)
```

## Mapping a photograph to a person

The link is the `portrait.src` field on the person's record — nothing is matched
by filename magic, so a file can live anywhere under `public/`. The convention
below simply makes records easy to read:

1. Name the file after the person's `slug`:
   `public/images/people/ade-okonkwo.jpg`
2. Reference it from the record in `src/data/people.ts`:

```ts
portrait: {
  src: "/images/people/ade-okonkwo.jpg",
  alt: "Portrait of Chief Ade Okonkwo, State Chairman of APC Lagos",
  width: 900,
  height: 1200,
  focal: "top",
  role: "portrait",
}
```

That one field feeds the profile page, every directory card, the search result,
the Open Graph card and the structured data.

## Specifications

| Slot | Ratio | Minimum size | Notes |
| --- | --- | --- | --- |
| Portrait | 3:4 | 900 × 1200 | Head and shoulders, eyes in the upper third |
| Hero / page header | 16:9 | 2400 × 1350 | Keep the left third free for the headline |
| News cover | 16:9 | 1600 × 900 | Also used as the Open Graph card |
| Event cover | 3:2 | 1600 × 1067 | |
| Gallery | any | 1600px on the long edge | Real ratios are preserved by the masonry grid |
| Logo | any | SVG preferred | See "Using official artwork" below |

### Always supply `width` and `height`

They reserve the correct space before the file loads, which is what keeps
Cumulative Layout Shift at zero. They do not need to be the file's exact pixel
dimensions — only the correct ratio.

### `focal` stops faces being cropped

Cards crop to a fixed ratio with `object-fit: cover`. `focal: "top"` keeps the
head in frame on a portrait; `"center"` is the default and is right for most
scenes.

### `alt` is required

Describe what is in the photograph. For a portrait: name and office. For a
scene: what is happening and where. Never "image", "photo" or a filename.

## Formats and size

Next.js converts and resizes on demand, so upload the highest-quality original
you have and let the build produce AVIF/WebP at each breakpoint.

- Portraits and covers: JPEG or PNG originals, quality 85+.
- Keep single files under about 3 MB; anything larger slows the first build with
  no visible benefit.
- Do not pre-optimise or pre-resize — that only removes information the image
  pipeline could have used.

## Using official artwork

The site is already wired to use the party's official logo. It expects one file:

```
public/images/logos/apc-logo.png
```

Save the APC mark there and it appears immediately in the header, the mobile
drawer and the footer — no code change needed. Until the file exists (or if it
ever fails to load) the lockup falls back to the SVG emblem in
`src/components/layout/Brand.tsx`, so the header can never show a broken image.

**Preparing the file**

- PNG, 640px wide or larger, transparent or white background.
- Trim it to the artwork's own edges — no baked-in whitespace, or the logo will
  look smaller than everything beside it.
- If your file's proportions differ from the default 640 x 504, update
  `width`/`height` in `brandLogo` (`src/data/site.ts`) to match. The lockup sizes
  by height and lets the width follow, so a wrong ratio is the one thing that
  will distort it.

**Two related files**

- `src/app/icon.svg` — the browser-tab favicon. Replace it with a square,
  simplified version of the mark; a full landscape lockup is illegible at 16px.
- `src/lib/seo.ts` already points the organisation's structured-data `logo` at
  `/images/logos/apc-logo.png`, so it picks up the same file.

## Hero photography

The homepage hero renders a generated backdrop until a photograph is supplied.
To use one, set `background` in `src/data/homepage.ts`:

```ts
background: {
  src: "/images/hero/state-secretariat.jpg",
  alt: "The APC Lagos State secretariat",
  width: 2400,
  height: 1350,
  role: "hero",
}
```
