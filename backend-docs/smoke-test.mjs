// Pure-logic smoke test for the voting backend. Runs under plain Node >= 18,
// no dependencies, no network, no D1. Exercises hmac, sampling, elo and
// Bradley-Terry modules shared with the Cloudflare Pages Functions.
//
//   node backend-docs/smoke-test.mjs
//
// Exits 0 on success, 1 on the first failed assertion.

import assert from "node:assert/strict";

// Node 18 does not expose WebCrypto as a global (Node >= 19 does). The
// Workers runtime always has globalThis.crypto, so only the test needs this.
if (!globalThis.crypto) {
  globalThis.crypto = (await import("node:crypto")).webcrypto;
}

const { CONFIG } = await import("../functions/_lib/config.js");
const { signPairToken, verifyPairToken, sha256Hex } = await import("../functions/_lib/hmac.js");
const { pickPair, pairKey } = await import("../functions/_lib/sampling.js");
const { computeElo, computeBradleyTerry, tallyRecords } = await import("../functions/_lib/rating.js");
let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err);
    process.exit(1);
  }
}

const SECRET = "test-secret";

await test("hmac: sign then verify roundtrip", async () => {
  const token = await signPairToken(SECRET, {
    track: "mario",
    aDir: "fable5",
    bDir: "gpt5.5",
    issuedAt: 1751900000,
  });
  const payload = await verifyPairToken(SECRET, token);
  assert.ok(payload, "verify should succeed");
  assert.equal(payload.track, "mario");
  assert.equal(payload.aDir, "fable5");
  assert.equal(payload.bDir, "gpt5.5");
  assert.equal(payload.issuedAt, 1751900000);
  assert.equal(typeof payload.nonce, "string");
});

await test("hmac: two tokens for the same pair differ (nonce)", async () => {
  const args = { track: "mario", aDir: "x", bDir: "y", issuedAt: 1 };
  const t1 = await signPairToken(SECRET, args);
  const t2 = await signPairToken(SECRET, args);
  assert.notEqual(t1, t2);
});

await test("hmac: tampered payload and wrong secret are rejected", async () => {
  const token = await signPairToken(SECRET, {
    track: "mario", aDir: "a", bDir: "b", issuedAt: 100,
  });
  assert.equal(await verifyPairToken("other-secret", token), null);
  const [body, sig] = token.split(".");
  const tamperedBody = body.slice(0, -2) + (body.endsWith("AA") ? "BB" : "AA");
  assert.equal(await verifyPairToken(SECRET, `${tamperedBody}.${sig}`), null);
  assert.equal(await verifyPairToken(SECRET, "garbage"), null);
  assert.equal(await verifyPairToken(SECRET, ""), null);
  assert.equal(await verifyPairToken(SECRET, "a.b.c"), null);
});

await test("hmac: sha256Hex matches known vector", async () => {
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

await test("sampling: least-voted pairs are preferred", () => {
  const dirs = ["a", "b", "c"];
  // a|b has 5 votes, a|c has 5, b|c has 0 -> b|c is the only candidate
  // (slack 1 keeps counts 0 and 1 in range but 5 is far out).
  const counts = new Map([
    [pairKey("a", "b"), 5],
    [pairKey("a", "c"), 5],
  ]);
  for (let i = 0; i < 20; i++) {
    const { aDir, bDir } = pickPair(dirs, counts, Math.random);
    assert.equal(pairKey(aDir, bDir), pairKey("b", "c"));
  }
});

await test("sampling: slot assignment is randomized", () => {
  const dirs = ["a", "b"];
  const counts = new Map();
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const { aDir } = pickPair(dirs, counts, Math.random);
    seen.add(aDir);
  }
  assert.equal(seen.size, 2, "both orders should appear over 200 draws");
});

await test("sampling: all 36 pairs reachable for 9 entrants", () => {
  const dirs = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"];
  const counts = new Map();
  const seen = new Set();
  for (let i = 0; i < 5000; i++) {
    const { aDir, bDir } = pickPair(dirs, counts, Math.random);
    seen.add(pairKey(aDir, bDir));
  }
  assert.equal(seen.size, 36);
});

await test("elo: winner gains, loser drops, tie between equals is neutral", () => {
  const dirs = ["x", "y"];
  let r = computeElo([{ a_dir: "x", b_dir: "y", winner: "A" }], dirs);
  assert.equal(r.get("x"), CONFIG.ELO_INITIAL + CONFIG.ELO_K / 2);
  assert.equal(r.get("y"), CONFIG.ELO_INITIAL - CONFIG.ELO_K / 2);

  r = computeElo([{ a_dir: "x", b_dir: "y", winner: "tie" }], dirs);
  assert.equal(r.get("x"), CONFIG.ELO_INITIAL);
  assert.equal(r.get("y"), CONFIG.ELO_INITIAL);
});

await test("elo: replay is order-sensitive and zero-sum", () => {
  const dirs = ["x", "y", "z"];
  const votes = [
    { a_dir: "x", b_dir: "y", winner: "A" },
    { a_dir: "y", b_dir: "z", winner: "B" },
    { a_dir: "z", b_dir: "x", winner: "tie" },
  ];
  const r = computeElo(votes, dirs);
  const sum = r.get("x") + r.get("y") + r.get("z");
  assert.ok(Math.abs(sum - 3 * CONFIG.ELO_INITIAL) < 1e-9, "elo is zero-sum");
  assert.ok(r.get("x") > r.get("y"), "x beat y and tied z, must rank above y");
});

await test("bradley-terry: recovers a clear strength ordering", () => {
  const dirs = ["strong", "mid", "weak"];
  const votes = [];
  // strong beats mid 8/10, mid beats weak 8/10, strong beats weak 9/10.
  for (let i = 0; i < 10; i++) {
    votes.push({ a_dir: "strong", b_dir: "mid", winner: i < 8 ? "A" : "B" });
    votes.push({ a_dir: "mid", b_dir: "weak", winner: i < 8 ? "A" : "B" });
    votes.push({ a_dir: "strong", b_dir: "weak", winner: i < 9 ? "A" : "B" });
  }
  const { scores, converged } = computeBradleyTerry(votes, dirs);
  assert.ok(converged, "should converge well within 100 iterations");
  const s = scores.get("strong");
  const m = scores.get("mid");
  const w = scores.get("weak");
  assert.ok(s > m && m > w, `ordering wrong: ${s} ${m} ${w}`);
  assert.ok(Math.abs(s + m + w - 1) < 1e-6, "scores normalized to sum 1");
});

await test("bradley-terry: entrant with zero games gets null", () => {
  const dirs = ["a", "b", "ghost"];
  const votes = [
    { a_dir: "a", b_dir: "b", winner: "A" },
    { a_dir: "a", b_dir: "b", winner: "tie" },
  ];
  const { scores } = computeBradleyTerry(votes, dirs);
  assert.equal(scores.get("ghost"), null);
  assert.ok(scores.get("a") > 0 && scores.get("b") > 0);
});

await test("bradley-terry: all-wins degenerate case does not crash", () => {
  const dirs = ["a", "b"];
  const votes = Array.from({ length: 30 }, () => ({
    a_dir: "a", b_dir: "b", winner: "A",
  }));
  const { scores } = computeBradleyTerry(votes, dirs);
  assert.ok(Number.isFinite(scores.get("a")));
  assert.ok(Number.isFinite(scores.get("b")));
  assert.ok(scores.get("a") > scores.get("b"));
});

await test("tally: wins/losses/ties/games are counted per entrant", () => {
  const dirs = ["a", "b", "c"];
  const votes = [
    { a_dir: "a", b_dir: "b", winner: "A" },
    { a_dir: "b", b_dir: "c", winner: "tie" },
    { a_dir: "c", b_dir: "a", winner: "B" },
  ];
  const rec = tallyRecords(votes, dirs);
  assert.deepEqual(rec.get("a"), { wins: 2, losses: 0, ties: 0, games: 2 });
  assert.deepEqual(rec.get("b"), { wins: 0, losses: 1, ties: 1, games: 2 });
  assert.deepEqual(rec.get("c"), { wins: 0, losses: 1, ties: 1, games: 2 });
});

await test("config: thresholds match the agreed contract", () => {
  assert.equal(CONFIG.MIN_PLAY_SECONDS, 45);
  assert.equal(CONFIG.MAX_PAIR_AGE_SECONDS, 7200);
  assert.equal(CONFIG.DAILY_VOTE_LIMIT, 60);
  assert.equal(CONFIG.LEADERBOARD_CACHE_SECONDS, 60);
  assert.equal(CONFIG.ELO_K, 32);
  assert.equal(CONFIG.ELO_INITIAL, 1000);
});

console.log(`\nall ${passed} smoke tests passed`);
