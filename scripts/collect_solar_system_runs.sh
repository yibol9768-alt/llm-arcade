#!/usr/bin/env bash
# Collect all 15 completed outputs into tracks/solar-system without modifying sources.
# The script stages every run first and publishes nothing unless all index.html files exist.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAN="$ROOT/tracks/solar-system/_run_plan.json"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/llm-arcade-solar.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT

while IFS=$'\t' read -r slug machine target; do
  mkdir -p "$STAGE/$slug"
  if [[ "$machine" == "vircs" ]]; then
    rsync -a "vircs:${target%/}/" "$STAGE/$slug/"
  else
    rsync -a "${target%/}/" "$STAGE/$slug/"
  fi
  [[ -f "$STAGE/$slug/index.html" ]] || { echo "missing index.html: $slug" >&2; exit 1; }
  echo "staged $slug"
done < <(node -e '
  const p=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  for(const r of p.runs) console.log([r.slug,r.machine,r.target_dir].join("\t"));
' "$PLAN")

while IFS=$'\t' read -r slug _machine _target; do
  dest="$ROOT/tracks/solar-system/$slug"
  if [[ -d "$dest" ]] && ! diff -qr "$STAGE/$slug" "$dest" >/dev/null; then
    echo "refusing to overwrite different archived artifact: $slug" >&2
    exit 1
  fi
done < <(node -e '
  const p=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  for(const r of p.runs) console.log([r.slug,r.machine,r.target_dir].join("\t"));
' "$PLAN")

while IFS=$'\t' read -r slug _machine _target; do
  dest="$ROOT/tracks/solar-system/$slug"
  mkdir -p "$dest"
  rsync -a --delete "$STAGE/$slug/" "$dest/"
  diff -qr "$STAGE/$slug" "$dest" >/dev/null
  echo "archived $slug"
done < <(node -e '
  const p=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
  for(const r of p.runs) console.log([r.slug,r.machine,r.target_dir].join("\t"));
' "$PLAN")

echo "all 15 solar-system outputs archived byte-for-byte"
