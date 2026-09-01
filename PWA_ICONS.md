# PWA icon assets — replace when real iTraxc artwork exists

Every icon in this app is currently a placeholder: a solid blue (`#2563eb`)
square with a white "iX" monogram, generated programmatically (see
`scripts/generate-pwa-icons.mjs`). None of it is final brand artwork.

## Files to replace

| File | Used for | Size | Notes |
|---|---|---|---|
| `public/icons/icon-192.png` | Manifest icon (`purpose: any`) | 192×192 | Android home screen / app drawer |
| `public/icons/icon-512.png` | Manifest icon (`purpose: any`) | 512×512 | Android splash screen, larger install surfaces |
| `public/icons/icon-512-maskable.png` | Manifest icon (`purpose: maskable`) | 512×512 | Must be full-bleed with the important content inside the centered ~80%-diameter "safe zone" — the OS applies its own mask shape (circle, squircle, etc.) and can crop anything outside it |
| `app/icon.tsx` | Browser tab favicon | 32×32 | Currently a `next/og`-generated placeholder — replace with a static `app/icon.png` (or edit the JSX design) once real artwork exists |
| `app/apple-icon.tsx` | iOS home screen icon (`apple-touch-icon`) | 180×180 | Same as above — iOS applies its own rounded-corner mask, so keep this full-bleed with no baked-in rounding |

## How to replace them

**Simplest path:** just overwrite the three PNGs in `public/icons/` with real
artwork at the same filenames and dimensions — nothing else needs to change,
since `app/manifest.ts` already references these exact paths.

For the two code-generated icons (`app/icon.tsx`, `app/apple-icon.tsx`),
either:
- Replace the file with a static image instead (e.g. delete `app/icon.tsx`
  and add `app/icon.png` at 32×32 — Next.js's file-convention icons work
  the same way for static files as for generated ones), or
- Keep the `.tsx` file and just change the JSX/design inside it.

## Design notes for whoever creates the real artwork

- Brand color used throughout the placeholder set: `#2563eb` (blue-600) —
  matches the BETA badge (`components/ui/beta-badge.tsx`).
- Maskable icon safe zone: keep the logo mark within the centered 80%
  diameter of the 512×512 canvas; the background color should fill the
  canvas edge-to-edge.
- Apple touch icon: no transparency, no baked-in rounded corners (iOS masks
  it automatically) — same full-bleed treatment as the maskable icon.
- The "any"-purpose icons (192/512) can use more of the canvas since they
  aren't cropped by an OS-applied mask.

## Regenerating placeholders

`scripts/generate-pwa-icons.mjs` regenerates the three static PNGs in
`public/icons/` from `next/og` (no extra dependencies). Run it from the
project root with `node scripts/generate-pwa-icons.mjs` if you want to
tweak the placeholder color/text before real artwork is ready.
