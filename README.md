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

Progress is stored in the browser (`localStorage`) — no account needed.

## Case images

The current case bank (`src/data/cases.ts`) is **procedurally generated,
illustrative schematic diagrams** — not real clinical radiographs. Each
case is fully data-driven (teeth, interproximal contact zones, and ground
truth are plain objects), so a real de-identified/licensed bitewing image
set with an answer key can be substituted later without touching the
practice UI or scoring logic.

## Tech stack

Client-side only for now: React + TypeScript + Vite, Tailwind CSS,
Zustand (+ `persist` for localStorage), Recharts. State is accessed only
through `src/store/useProgressStore.ts`, so moving persistence to a real
backend later is a matter of swapping what's behind that hook.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
```
