#!/usr/bin/env node
/**
 * inspect_games.mjs — 静态检查 tracks/mario/ 下全部参赛游戏,输出 data/mario_checklist.json
 *
 * 只读 tracks/,只写 data/。零依赖,node 18+。
 *
 * 每个参赛者记录:
 *   files            文件数
 *   bytes            总字节
 *   code_lines       代码总行数(.html/.js/.css)
 *   single_file      是否单文件成品(目录下除 README/图片外仅 index.html)
 *   has_audio        源码含 AudioContext / createOscillator
 *   has_readme       目录含 README*
 *   has_touch        源码含 touchstart / ontouch / pointerdown(手机可玩线索;
 *                    Pointer Events 的 pointerdown 监听同样覆盖触屏,故一并计入)
 *   uses_localstorage 源码含 localStorage
 *   loads_ok         index.html 存在且其引用的本地 js/css 相对路径全部存在(可加载静态判据)
 *   broken_refs      缺失的本地引用列表(理想为空)
 *
 * 「静态检查分」公式(满分 100,透明公示,页面脚注同文):
 *   可加载基础分 40(loads_ok)
 *   + 音效 20(has_audio)
 *   + 触屏支持 15(has_touch)
 *   + 本地存档 15(uses_localstorage)
 *   + README 10(has_readme)
 * 此分数只反映代码静态特征,不代表好玩程度;社区评价由完整排序与匿名盲投分别统计。
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TRACK_DIR = join(ROOT, "tracks", "mario");
const OUT_FILE = join(ROOT, "data", "mario_checklist.json");

const CODE_EXT = /\.(html?|js|mjs|css)$/i;

/** 递归列出目录下全部文件(相对路径) */
function walk(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, base));
    else out.push({ rel: p.slice(base.length + 1), abs: p, bytes: st.size });
  }
  return out;
}

/** 从 index.html 抽取本地相对引用(src/href),忽略 data:/http(s)/# */
function localRefs(html) {
  const refs = [];
  const re = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const u = m[1].trim();
    if (!u || /^(data:|https?:|\/\/|#|mailto:)/i.test(u)) continue;
    refs.push(u.split(/[?#]/)[0]);
  }
  return [...new Set(refs)];
}

const WEIGHTS = {
  loads_ok: 40,
  has_audio: 20,
  has_touch: 15,
  uses_localstorage: 15,
  has_readme: 10,
};
const FORMULA_ZH =
  "静态检查分 = 可加载 40 + 音效 20 + 触屏支持 15 + 本地存档 15 + README 10(满分 100);" +
  "仅反映代码静态特征,不代表好玩程度;社区评价由完整排序与匿名盲投分别统计。";

const dirs = readdirSync(TRACK_DIR).filter((d) => {
  const p = join(TRACK_DIR, d);
  return statSync(p).isDirectory();
}).sort();

const entrants = [];
for (const dir of dirs) {
  const base = join(TRACK_DIR, dir);
  const files = walk(base);
  const bytes = files.reduce((s, f) => s + f.bytes, 0);

  let codeLines = 0;
  let corpus = "";
  for (const f of files) {
    if (CODE_EXT.test(f.rel)) {
      const text = readFileSync(f.abs, "utf8");
      codeLines += text.split("\n").length;
      corpus += "\n" + text;
    }
  }

  const hasIndex = files.some((f) => f.rel === "index.html");
  let brokenRefs = [];
  if (hasIndex) {
    const html = readFileSync(join(base, "index.html"), "utf8");
    brokenRefs = localRefs(html).filter((r) => !existsSync(join(base, r)));
  }

  const rec = {
    dir,
    files: files.length,
    bytes,
    code_lines: codeLines,
    single_file: files.filter((f) => CODE_EXT.test(f.rel)).length === 1 && hasIndex,
    has_audio: /AudioContext|createOscillator/.test(corpus),
    has_readme: files.some((f) => /^README/i.test(f.rel)),
    has_touch: /touchstart|ontouch|pointerdown/.test(corpus),
    uses_localstorage: /localStorage/.test(corpus),
    loads_ok: hasIndex && brokenRefs.length === 0,
    broken_refs: brokenRefs,
  };
  rec.score =
    (rec.loads_ok ? WEIGHTS.loads_ok : 0) +
    (rec.has_audio ? WEIGHTS.has_audio : 0) +
    (rec.has_touch ? WEIGHTS.has_touch : 0) +
    (rec.uses_localstorage ? WEIGHTS.uses_localstorage : 0) +
    (rec.has_readme ? WEIGHTS.has_readme : 0);
  entrants.push(rec);
}

const out = {
  track: "mario",
  generated_at: new Date().toISOString(),
  score_weights: WEIGHTS,
  score_formula_zh: FORMULA_ZH,
  entrants,
};

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n");

console.log(`wrote ${OUT_FILE}`);
for (const e of entrants) {
  console.log(
    `${e.dir.padEnd(12)} files=${String(e.files).padStart(2)} bytes=${String(e.bytes).padStart(7)} ` +
    `lines=${String(e.code_lines).padStart(5)} audio=${e.has_audio ? "Y" : "-"} touch=${e.has_touch ? "Y" : "-"} ` +
    `ls=${e.uses_localstorage ? "Y" : "-"} readme=${e.has_readme ? "Y" : "-"} loads=${e.loads_ok ? "Y" : "-"} score=${e.score}`
  );
}
