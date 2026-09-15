# Agent notes

Always-on Cursor rules live in `.cursor/rules/`. Follow them when editing this repo.

- No em dashes or en dashes. Use a period, comma, colon, ` - `, or ASCII `-`.
- No LLM punchlines or filler cadence. Write specific Bengaluru copy.

After any copy change in `docs/`, `README.md`, or `CONTRIBUTING.md`, run:

```
python3 scripts/check-copy.py
```

CI runs the same script on pull requests (`Copy check` workflow).
