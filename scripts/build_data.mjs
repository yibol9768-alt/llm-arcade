#!/usr/bin/env node
/**
 * build_data.mjs — 把 tracks/mario/_track.json + data/mario_checklist.json
 * 合成 frontend/assets/data.js(window.ARCADE_DATA = {...}),
 * 页面用 <script> 引入,避免 fetch 在 file:// 下的跨源限制。
 *
 * 重跑顺序:inspect_games.mjs -> sync_games.sh -> (可选) take_shots.mjs -> build_data.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const trackFile = join(ROOT, "tracks", "mario", "_track.json");
const checklistFile = join(ROOT, "data", "mario_checklist.json");
const outFile = join(ROOT, "frontend", "assets", "data.js");

const track = JSON.parse(readFileSync(trackFile, "utf8"));
const checklist = JSON.parse(readFileSync(checklistFile, "utf8"));

// 参赛者:_track.json 的 entrants 顺序为准,合并静态检查结果与截图有无
const byDir = new Map(checklist.entrants.map((e) => [e.dir, e]));
const entrants = track.entrants.map((t) => {
  const c = byDir.get(t.dir);
  if (!c) throw new Error(`checklist missing entrant: ${t.dir}`);
  const shotName = t.dir.replace(/[^A-Za-z0-9._-]/g, "_") + ".png";
  return {
    ...t,
    ...c,
    shot: existsSync(join(ROOT, "frontend", "assets", "shots", shotName))
      ? `assets/shots/${shotName}`
      : null,
  };
});
// checklist 里有而 _track.json 没登记的目录要报警(数据一致性闸门)
for (const e of checklist.entrants) {
  if (!track.entrants.some((t) => t.dir === e.dir)) {
    throw new Error(`_track.json missing entrant present on disk: ${e.dir}`);
  }
}

const data = {
  built_at: new Date().toISOString(),
  track: {
    id: track.track,
    title_zh: track.title_zh,
    title_en: track.title_en,
    prompt: track.prompt,
    prompt_note: track.prompt_note,
    date_run: track.date_run,
    protocol: track.protocol,
    entrants_note: track.entrants_note,
  },
  score_weights: checklist.score_weights,
  score_formula_zh: checklist.score_formula_zh,
  checklist_generated_at: checklist.generated_at,
  entrants,
};

const banner =
  "/* 由 scripts/build_data.mjs 生成,勿手改;重跑顺序见文件头注释与 frontend/README.md */\n";
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, banner + "window.ARCADE_DATA = " + JSON.stringify(data, null, 2) + ";\n");
console.log(`wrote ${outFile} (${entrants.length} entrants)`);
