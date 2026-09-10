#!/usr/bin/env bash
# Serve the GitHub Pages source folder (docs/) locally.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-5600}"
HOST="${HOST:-127.0.0.1}"

echo "Preview: http://${HOST}:${PORT}/"
echo "Source:  ${ROOT}/docs"
exec python3 -m http.server "$PORT" --bind "$HOST" --directory "$ROOT/docs"
