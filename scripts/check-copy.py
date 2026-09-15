#!/usr/bin/env python3
"""Fail if published copy uses em/en dashes or banned LLM cadence."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SCAN_DIRS = [ROOT / 'docs']
SCAN_FILES = [ROOT / 'README.md', ROOT / 'CONTRIBUTING.md', ROOT / 'AGENTS.md']
SKIP_PARTS = {'.git', 'audio', 'node_modules'}
EXTS = {'.html', '.json', '.md', '.js', '.css'}

# Phrase checks are case-insensitive. Keep this list in sync with
# .cursor/rules/no-ai-isms.mdc
PHRASES = [
    r"that's the whole (visit|format|premise|problem|point|order|night|thing)",
    r"that is the whole (visit|format|premise|problem|point|order|night|thing)",
    r"\bon purpose\b",
    r"worth knowing",
    r"kind of place",
    r"kind of aside",
    r"funnily enough",
    r"belonging a little bit everywhere",
    r"deserves a space of its own",
    r"none of this is a discovery",
    r"credit, not discovery",
    r"trivia for a quiz",
    r"\bphoto-op\b",
    r"postcard (strip|nightlife|temple|view)",
    r"the public postcard",
    r"cult following",
    r"headline stop",
    r"playing it safe",
    r"never came back down",
    r"\bunhurried\b",
    r"in the useful sense",
    r"weather is geography",
]

PHRASE_RES = [re.compile(p, re.I) for p in PHRASES]


def files_to_scan():
    out = []
    for path in SCAN_FILES:
        if path.is_file():
            out.append(path)
    for folder in SCAN_DIRS:
        if not folder.is_dir():
            continue
        for path in folder.rglob('*'):
            if not path.is_file():
                continue
            if any(part in SKIP_PARTS for part in path.parts):
                continue
            if path.suffix.lower() not in EXTS:
                continue
            out.append(path)
    return out


def check(path: Path):
    hits = []
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        return hits
    rel = path.relative_to(ROOT)
    for i, line in enumerate(text.splitlines(), 1):
        if '\u2014' in line or '\u2013' in line:
            hits.append(f'{rel}:{i}: em or en dash')
        for rx in PHRASE_RES:
            if rx.search(line):
                hits.append(f'{rel}:{i}: AI-ism {rx.pattern!r} -> {line.strip()[:120]}')
    return hits


def main():
    hits = []
    for path in files_to_scan():
        hits.extend(check(path))
    if hits:
        print('Copy check failed:')
        for hit in hits:
            print(' ', hit)
        print('\nSee .cursor/rules/no-ai-isms.mdc and .cursor/rules/no-em-dash.mdc')
        return 1
    print(f'Copy check passed ({len(files_to_scan())} files).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
