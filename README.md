# Fourths

Voice-led jazz chord progressions drawn on the Novation Launchpad X in chromatic
fourths layout (C bottom left, each row up is a fourth).

Plain static site: `index.html`, `style.css`, `app.js`. No build step.

## Run locally

    npx serve .

or just open `index.html` in a browser.

## Deploy to Vercel

    npx vercel        # preview
    npx vercel --prod # production

Or push to GitHub and import the repo in Vercel. Pick "Other" as the framework
preset and leave the build command empty.

## Where things live in app.js

- `FAM`: chord families, their brightness levels and the order tones are added
- `PROGS`: the progressions (scale degree + quality, relative to the key)
- `solve()`: picks voicings and pads with the smoothest voice leading
- `fingers()`: suggested fingering heuristic
