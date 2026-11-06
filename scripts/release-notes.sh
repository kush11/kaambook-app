#!/usr/bin/env bash
# Prints GitHub Release notes for a version: its CHANGELOG.md section plus a link to the
# release sheet. Usage: scripts/release-notes.sh 1.1.0
set -euo pipefail
v="$1"
section=$(awk -v v="$v" '
  $0 ~ "^## " v " " { on = 1; next }
  on && /^## / { exit }
  on { print }
' CHANGELOG.md)
if [ -z "$section" ]; then
  echo "No CHANGELOG.md section for $v" >&2
  exit 1
fi
printf '%s\n' "$section"
if [ -f "docs/release-$v.md" ]; then
  printf '\n---\nRelease sheet (what was tested, Play notes): [docs/release-%s.md](https://github.com/kush11/kaambook-app/blob/master/docs/release-%s.md)\n' "$v" "$v"
fi
