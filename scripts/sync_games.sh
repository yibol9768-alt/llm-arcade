#!/usr/bin/env bash
# sync_games.sh — 把 tracks/mario/<dir>/ 整目录拷贝到 frontend/games/mario/<dir>/
# tracks/ 只读,先清目标再整拷,保证与评测成品逐字节一致。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/tracks/mario"
DST="$ROOT/frontend/games/mario"

rm -rf "$DST"
mkdir -p "$DST"

for d in "$SRC"/*/; do
  name="$(basename "$d")"
  cp -r "$d" "$DST/$name"
  echo "synced $name"
done

echo "done -> $DST"
