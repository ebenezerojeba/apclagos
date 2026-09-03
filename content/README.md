# Content templates

Machine-readable templates for every record type on the platform. Copy a
template, replace every value, and paste the result into the matching file in
`src/data/`.

| Template | Goes into | Powers |
| --- | --- | --- |
| `people.template.json` | `src/data/people.ts` | Leadership, chairmen, senators, House of Reps, House of Assembly, candidates |
| `wards.template.csv` | `src/data/resources.ts` | `/wards`, council pages, structure explorer |
| `news.template.json` | `src/data/editorial.ts` | `/news`, homepage rails, search |
| `events.template.json` | `src/data/editorial.ts` | `/events`, homepage rail |
| `media.template.json` | `src/data/media.ts` | `/gallery`, `/media` |
| `resources.template.json` | `src/data/resources.ts` | `/achievements`, `/documents` |

## Rules that apply to every record

1. **`slug` is the URL and the primary key.** Lowercase, hyphenated, unique
   within its collection, and stable — changing a slug changes a public URL.
2. **`status` gates visibility.** Only `"published"` records appear on the site.
   Use `"draft"` to stage a record and `"archived"` to retire one without
   deleting it.
3. **Leave unknown fields out entirely.** Do not write `"TBC"`, `"N/A"` or an
   empty string — the UI renders a designed pending state for a missing field
   and an ugly placeholder for a fake one.
4. **Every image needs `alt`.** Describe what is in the photograph, not that it
   is a photograph.
5. **Dates are ISO-8601.** Use `YYYY-MM-DD` for dates and
   `YYYY-MM-DDTHH:MM:SS+01:00` for timestamps — the `+01:00` is West Africa Time.

## Where images go

See `public/images/README.md` for the folder layout, the aspect ratios each slot
expects, and how a supplied photograph is mapped to a person.

## Structural data you should not need to edit

`src/data/geography.ts` already contains the 20 LGAs, the 37 LCDAs, the 3
senatorial districts, the 24 federal constituencies and the 40 state
constituencies, along with the relationships between them. Two things in it are
marked `NEEDS-VERIFICATION` and should be confirmed before launch:

- per-LGA ward counts (deliberately left empty rather than estimated), and
- the mapping from state constituencies to federal constituencies where an LGA
  carries two federal seats.
