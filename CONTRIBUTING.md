# How to contribute

This is a static GitHub Pages field guide. The live site is built from `docs/`. If you know a spot, spotted a mistake, or want to add a Kannada phrase, there is a path for that.

## The easy way: open an issue from the site

On [the guide](https://aravindbaskaran.github.io/this-blr-namma-bengaluru/), scroll to **Write in**.

- **Know a spot** pre-fills a GitHub issue with the name, area, kind, and why it matters.
- **Spot a mistake** does the same for a correction or a missing fact.

You need a GitHub account to submit. Nothing is posted until you press submit on GitHub.

## Pull requests

Fork the repo, edit, and open a PR against `main`.

- Lists live in `docs/data/*.json`. Bengaluru spots are `locations.json`. Day trips are `karnataka-places.json`. Dishes, phrases, festivals, and asides have their own files. Do not put new lists back into `docs/index.html`.
- Markup is `docs/index.html`. Styles are `docs/css/`. Behaviour is `docs/js/guide.js` (the guide) and `docs/js/stage.js` (the background).
- Keep the voice: Bengaluru-first, specific, no generic "Incredible India" filler.
- Preview locally with `./scripts/preview.sh`, then open http://127.0.0.1:5600/

A location entry usually looks like: `id`, `name`, `area`, `category`, `blurb`, optional `kn`, `photos`, `personalPick`, `skipCrowd`, and a short `try` list.

## Kannada audio

Speaker buttons play clips in `docs/audio/kn/`. If you add a Kannada string to the data files, a GitHub Action can build the missing clip. Details, including how to record a real voice, are in the README.

## Credit

GitHub contributors and people who open issues show up on the guide's **About the people behind this** section. If you want a name or a one-line role other than your GitHub login, say so in the PR or issue.
