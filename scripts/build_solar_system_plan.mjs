#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const planPath = join(ROOT, "tracks", "solar-system", "_run_plan.json");
const outPath = join(ROOT, "frontend", "assets", "solar-system-plan.js");
const plan = JSON.parse(readFileSync(planPath, "utf8"));

if (plan.track !== "solar-system" || !Array.isArray(plan.runs) || plan.runs.length !== 15) {
  throw new Error("solar-system run plan must contain exactly 15 planned runs");
}
const slugs = new Set();
const targets = new Set();
for (const run of plan.runs) {
  if (!run.slug || !run.model || !run.vendor || !run.harness || !run.machine || !run.target_dir) {
    throw new Error(`incomplete run-plan entry: ${JSON.stringify(run)}`);
  }
  if (slugs.has(run.slug)) throw new Error(`duplicate slug: ${run.slug}`);
  if (targets.has(run.target_dir)) throw new Error(`duplicate target_dir: ${run.target_dir}`);
  slugs.add(run.slug);
  targets.add(run.target_dir);
  const expectedRoot = run.machine === "vircs" ? "/root/Desktop/lyb/" : "/Users/liuyibo/Desktop/lyb/";
  if (!run.target_dir.startsWith(expectedRoot)) throw new Error(`target_dir/machine mismatch: ${run.slug}`);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  "/* Generated from tracks/solar-system/_run_plan.json. Do not edit directly. */\n" +
    "window.SOLAR_SYSTEM_RUN_PLAN = " + JSON.stringify(plan, null, 2) + ";\n",
);
console.log(`wrote ${outPath} (${plan.runs.length} planned runs, 0 published artifacts)`);
