#!/usr/bin/env node
/**
 * take_shots.mjs — 用本机 headless chromium(若存在)给全部游戏截首帧图,
 * 存到 frontend/assets/shots/<dir>.png,作参赛卡片预览区的底图
 * (预览区首选活 iframe,截图用于加载前占位与 iframe 失败退化)。
 *
 * 零 npm 依赖:直接调 chrome-headless-shell 二进制;找不到浏览器则跳过并提示,
 * 前端会自动退化为几何图案占位。
 *
 * 依赖 frontend/games/mario/ 已由 sync_games.sh 就位;脚本自起本地 http server
 * (端口 8917)以避免 file:// 下部分游戏行为差异,截完自动关闭。
 */
import { execFileSync, spawn } from "node:child_process";
import { readdirSync, statSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES = join(ROOT, "frontend", "games", "mario");
const SHOTS = join(ROOT, "frontend", "assets", "shots");
const PORT = 8917;

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  const pwRoot = join(process.env.HOME || "/root", ".cache", "ms-playwright");
  if (existsSync(pwRoot)) {
    for (const d of readdirSync(pwRoot)) {
      for (const rel of [
        "chrome-headless-shell-linux64/chrome-headless-shell",
        "chrome-linux/chrome",
      ]) {
        candidates.push(join(pwRoot, d, rel));
      }
    }
  }
  return candidates.find((c) => c && existsSync(c));
}

const chrome = findChrome();
if (!chrome) {
  console.log("no headless chromium found; skip screenshots (frontend will fall back to placeholder)");
  process.exit(0);
}
if (!existsSync(GAMES)) {
  console.error("frontend/games/mario missing; run scripts/sync_games.sh first");
  process.exit(1);
}

// 起临时静态 server
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
  cwd: join(ROOT, "frontend"),
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 800));

mkdirSync(SHOTS, { recursive: true });
const dirs = readdirSync(GAMES).filter((d) => statSync(join(GAMES, d)).isDirectory()).sort();
let ok = 0;
try {
  for (const dir of dirs) {
    const out = join(SHOTS, dir.replace(/[^A-Za-z0-9._-]/g, "_") + ".png");
    const url = `http://127.0.0.1:${PORT}/games/mario/${encodeURIComponent(dir)}/index.html`;
    try {
      execFileSync(
        chrome,
        [
          "--headless",
          "--no-sandbox",
          "--disable-gpu",
          "--hide-scrollbars",
          "--force-device-scale-factor=1",
          "--window-size=960,600",
          "--virtual-time-budget=6000",
          `--screenshot=${out}`,
          url,
        ],
        { stdio: "pipe", timeout: 60000 }
      );
      console.log(`shot ${dir} -> ${out}`);
      ok++;
    } catch (e) {
      console.error(`shot FAILED for ${dir}: ${e.message.split("\n")[0]}`);
    }
  }
} finally {
  server.kill();
}
console.log(`done: ${ok}/${dirs.length} screenshots`);
