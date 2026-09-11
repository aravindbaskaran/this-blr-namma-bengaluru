# namma-blr-not-that
Namma Bengaluru, not that

This is a static GitHub Pages site. The published source is `docs/`.

- `docs/index.html` — markup only
- `docs/css/` — `tokens.css` (palette and type), `layout.css` (chrome and cards), `stage.css` (background stage and loader)
- `docs/js/` — `guide.js` (data, rendering, forms), `stage.js` (scroll decorations)
- `docs/data/*.json` — lists. Bengaluru spots live in `locations.json` (including `personalPick`, `skipCrowd`, and a `try` list). Day trips live in `karnataka-places.json`. Dishes live in `dishes.json`. Asides live in `did-you-know.json`. The page fetches those files on load.

Do not put new lists back into the HTML.

## Local preview

From the repo root:

```bash
./scripts/preview.sh
```

Then open http://127.0.0.1:5600/

In Cursor / VS Code, run the **Preview GitHub Pages** task (default build task). Edit files under `docs/` and refresh the browser.

Override the port with `PORT=8080 ./scripts/preview.sh` if 5600 is already in use.
