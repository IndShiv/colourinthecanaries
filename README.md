# Colour the Caries 🦷

A browser-based practice tool for dental students learning to spot
**pediatric interproximal caries** on bitewing radiographs — inspired by the
computer-assisted learning (CAL) platform described in Goertzen et al.,
*"Interactive computer-assisted learning as an educational method for
learning pediatric interproximal dental caries identification"* (Oral Surg
Oral Med Oral Pathol Oral Radiol, 2023).

Like the study's platform, this app has students review a case, mark where
they believe caries is present, get immediate visual feedback, and tracks
accuracy/sensitivity/specificity toward a 75% competency standard with a
learning-curve view over time. The twist here: instead of clicking
checkboxes, students **colour in** the suspect areas with a paint tool.

## How it works

- **Practice** — view a case (schematic bitewing-style image), pick a
  colour and brush, paint over any interproximal contact you suspect has
  caries, then submit. Leaving the image blank is a valid "caries-free"
  diagnosis. Feedback overlays show what you got right, missed, or
  over-called.
- **Progress** — running accuracy/sensitivity/specificity, a competency
  badge (75% on all three, after at least 10 cases, mirroring the source
  study's standard), a learning-curve chart, and full case history.
- **Author** — for instructors: upload a real bitewing image, drag on it
  to mark each interproximal contact you want scored (caries or clear,
  and lesion size), then save. The case is added to the practice deck
  immediately, mixed in with the built-in set.

Progress and authored cases are stored in the browser (`localStorage` for
metadata/progress, IndexedDB for uploaded image bytes) — no account or
backend needed.

## Case images

The built-in case bank (`src/data/cases.ts`) is **procedurally generated,
illustrative schematic diagrams** — not real clinical radiographs. Cases
are fully data-driven (an optional image reference + interproximal contact
zones + ground truth, all plain objects), which is what makes the Author
tool possible: it just writes more of the same shape of data, backed by a
real uploaded photo instead of a generated SVG.

## Tech stack

Client-side only for now: React + TypeScript + Vite, Tailwind CSS,
Zustand (+ `persist` for localStorage), Recharts. State is accessed only
through the store hooks (`src/store/`), so moving persistence to a real
backend later is a matter of swapping what's behind them.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
```
