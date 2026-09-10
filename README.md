# namma-blr-not-that
Namma Bengaluru, not that

This is a static GitHub Pages site. The published source is `docs/` (`docs/index.html` plus lists in `docs/data/*.json`).

To change places, categories, phrases, dishes, festivals, or This-not-that rows, edit the matching file under `docs/data/` — not arrays in the HTML. Bengaluru spots live in `locations.json` (including `personalPick` and `skipCrowd` on a place). Day trips and other Karnataka spots live in `karnataka-places.json`. Dishes live in `dishes.json` with `tags`. The page fetches those JSON files on load.

## Local preview

From the repo root:

```bash
./scripts/preview.sh
```

Then open http://127.0.0.1:5600/

In Cursor / VS Code, run the **Preview GitHub Pages** task (default build task). Edit `docs/index.html` and refresh the browser to see changes.

Override the port with `PORT=8080 ./scripts/preview.sh` if 5600 is already in use.
