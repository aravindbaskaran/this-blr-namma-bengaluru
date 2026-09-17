# Agent notes

Always-on Cursor rules live in `.cursor/rules/`. Follow them when editing this repo.

- No em dashes or en dashes. Use a period, comma, colon, ` - `, or ASCII `-`.
- No LLM punchlines or filler cadence. Write specific Bengaluru copy.
- Credit other people's dataset rows. If a spot, day trip, dish, habba, or similar entry came from someone else, set `addedBy` to their GitHub login, add them to `NAMMA_PEOPLE` in `docs/js/gallery.js`, and to `PEOPLE_NOTES` in `docs/js/guide.js`. Leave Aravind's own entries unsigned. Do not guess credit from git blame.

After any copy change in `docs/`, `README.md`, or `CONTRIBUTING.md`, run:

```
python3 scripts/check-copy.py
```

CI runs the same script on pull requests (`Copy check` workflow).
