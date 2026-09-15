# Contributor photos

Drop image files in this folder (`docs/gallery/`). Then add a row to `docs/data/gallery.json`. They show in the **contributor gallery** (`photos.html`), with a short preview on the guide. They do not replace the photos on place cards.

GitHub Pages cannot list the folder by itself. The JSON is the list the page reads.

## `docs/data/gallery.json`

Each item in `photos`:

| field | required | what it does |
| --- | --- | --- |
| `id` | yes | Stable slug, unique in the file |
| `file` | yes | Filename in this folder, or a full `https://` URL |
| `caption` | yes | What the picture is. Shown on the gallery card |
| `alt` | no | Screen-reader text. Falls back to caption |
| `by` | no | Photographer / who sent it |
| `lat`, `lng` | no | Map pin on the guide. City-map pins only work inside Bengaluru |

Example:

```json
{
  "photos": [
    {
      "id": "cubbon-jacaranda-2026",
      "file": "cubbon-jacaranda.jpg",
      "caption": "Jacaranda on the Cubbon path after a shower.",
      "alt": "Purple jacaranda over a Cubbon Park path",
      "by": "Your name",
      "lat": 12.9763,
      "lng": 77.5929
    }
  ]
}
```

Use JPG, PNG, or WebP. Keep files small enough for GitHub Pages (under about 2MB each is polite). No review-site grabs. If the shot is already on Wikimedia Commons, you can skip this folder and put a Commons `Special:FilePath` URL in `file`.
