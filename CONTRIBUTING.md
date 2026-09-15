# How to contribute to this guide

This repo is the Namma Bengaluru field guide. The live page is [aravindbaskaran.github.io/this-blr-namma-bengaluru](https://aravindbaskaran.github.io/this-blr-namma-bengaluru/). GitHub Pages publishes `docs/` from `main`.

If you know a Bengaluru or Karnataka spot, spotted a wrong fact, or want to add a Kannada phrase, there is a path for that.

## The easy way: Write in on the site

On the guide, scroll to **Write in**.

- **Know a spot** pre-fills a GitHub issue on this repo with the name, area, kind, and why it matters.
- **Spot a mistake** does the same for a correction or a missing fact.

You need a GitHub account. Nothing is posted until you press submit on GitHub. Those issues show up on the page's people rail as well.

## Pull requests

Fork, edit, and open a PR against `main`.

- Bengaluru spots: `docs/data/locations.json`. Set `tourist: true` for the visitor shortlist, `stay: true` for the local list. **Both** (the default on the page) shows either flag. Custom spots from the to-do list always show.
- Day trips: `docs/data/karnataka-places.json`. Same `tourist` / `stay` flags.
- Dishes, Kannada phrases, habbas, asides, and This not that: `dishes.json`, `phrases.json`, `festivals.json`, `did-you-know.json`, `not-that.json`.
- Your own photos: drop the file in `docs/gallery/`, then add a row to `docs/data/gallery.json` (caption, optional `lat`/`lng`). They show on `photos.html`, with a short preview on the guide. Details are in `docs/gallery/README.md`.
- Do not dump new lists into `docs/index.html`.
- Markup is `docs/index.html`. Styles are `docs/css/`. Guide behaviour is `docs/js/guide.js`. Saree bands are `docs/js/stage-bands.js` and `stage-bands-straight.js`.
- Keep the voice: Bengaluru-first, specific, no generic India filler. Follow `AGENTS.md` and run `python3 scripts/check-copy.py` before you open a PR.
- Preview with `./scripts/preview.sh`, then open http://127.0.0.1:5600/

A location entry usually looks like: `id`, `name`, `area`, `category`, `blurb`, optional `kn`, `photos`, `tourist`, `stay`, `personalPick`, `skipCrowd`, and a short `try` list.

## Kannada audio

Speaker buttons play clips in `docs/audio/kn/`. If you add a Kannada string to the data files, a GitHub Action can build the missing clip. Details, including how to record a real voice, are in the README.

## Credit on the page

GitHub commits and issues on **this** repo (`aravindbaskaran/this-blr-namma-bengaluru`) fill the **About the people behind this** rail. Aravind is the lead card. Everyone else is listed from the GitHub API, plus a name and one-line role if they asked for one (`PEOPLE_NOTES` in `docs/js/guide.js`). Say what you want written in the PR or issue.
