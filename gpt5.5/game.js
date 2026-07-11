(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreNode = document.getElementById("score");
  const coinsNode = document.getElementById("coins");
  const livesNode = document.getElementById("lives");
  const timeNode = document.getElementById("time");
  const curtain = document.getElementById("curtain");
  const startBtn = document.getElementById("start");
  const soundBtn = document.getElementById("sound");
  const restartBtn = document.getElementById("restart");

  const W = canvas.width;
  const H = canvas.height;
  const TILE = 32;
  const WORLD_TILES = 222;
  const WORLD_W = WORLD_TILES * TILE;
  const WORLD_H = 17 * TILE;
  const FLOOR_ROW = 14;
  const MAX_TIME = 300;

  const keys = Object.create(null);
  const touch = Object.create(null);
  const solids = new Map();
  const coins = [];
  const enemies = [];
  const powerups = [];
  const floaters = [];
  const particles = [];
  const clouds = [];
  const hills = [];
  const bushes = [];
  const pipes = [];
  const bumps = new Map();

  let cameraX = 0;
  let lastTime = 0;
  let accumulator = 0;
  let state = "title";
  let worldBuilt = false;
  let gameClock = MAX_TIME;
  let highScore = Number(localStorage.getItem("pipebound-high") || 0);

  const player = {
    x: 96,
    y: 320,
    w: 24,
    h: 42,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    coyote: 0,
    jumpBuffer: 0,
    score: 0,
    coins: 0,
    lives: 3,
    big: false,
    inv: 0,
    deadTimer: 0,
    winTimer: 0,
    runAnim: 0
  };

  const audio = {
    ctx: null,
    enabled: true,
    musicTimer: null,
    note: 0,
    master: null
  };

  function tileKey(tx, ty) {
    return `${tx},${ty}`;
  }

  function setTile(tx, ty, type, meta = null) {
    solids.set(tileKey(tx, ty), { tx, ty, type, meta });
  }

  function getTile(tx, ty) {
    return solids.get(tileKey(tx, ty));
  }

  function removeTile(tx, ty) {
    solids.delete(tileKey(tx, ty));
  }

  function solidAt(tx, ty) {
    const t = getTile(tx, ty);
    return Boolean(t && t.type !== "coin");
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function rectHitsTile(rect, tile) {
    return rect.x < tile.tx * TILE + TILE &&
      rect.x + rect.w > tile.tx * TILE &&
      rect.y < tile.ty * TILE + TILE &&
      rect.y + rect.h > tile.ty * TILE;
  }

  function tilesForRect(x, y, w, h) {
    const tiles = [];
    const left = Math.floor(x / TILE) - 1;
    const right = Math.floor((x + w) / TILE) + 1;
    const top = Math.floor(y / TILE) - 1;
    const bottom = Math.floor((y + h) / TILE) + 1;

    for (let ty = top; ty <= bottom; ty += 1) {
      for (let tx = left; tx <= right; tx += 1) {
        const tile = getTile(tx, ty);
        if (tile) tiles.push(tile);
      }
    }

    return tiles;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function pad(n, width) {
    return String(Math.max(0, Math.floor(n))).padStart(width, "0");
  }

  function buildWorld() {
    solids.clear();
    coins.length = 0;
    enemies.length = 0;
    powerups.length = 0;
    floaters.length = 0;
    particles.length = 0;
    clouds.length = 0;
    hills.length = 0;
    bushes.length = 0;
    pipes.length = 0;
    bumps.clear();

    const gaps = [
      [32, 35],
      [71, 74],
      [116, 119],
      [162, 165],
      [195, 197]
    ];

    for (let x = 0; x < WORLD_TILES; x += 1) {
      const gap = gaps.some(([a, b]) => x >= a && x <= b);
      if (!gap) {
        setTile(x, FLOOR_ROW, "ground");
        setTile(x, FLOOR_ROW + 1, "earth");
        setTile(x, FLOOR_ROW + 2, "earth");
      }
    }

    const questionBlocks = [
      [16, 9, "coin"], [21, 9, "mushroom"], [22, 5, "coin"], [23, 9, "coin"],
      [43, 8, "coin"], [44, 8, "coin"], [45, 8, "coin"],
      [64, 9, "mushroom"], [78, 8, "coin"], [82, 8, "coin"],
      [105, 8, "coin"], [106, 8, "mushroom"],
      [136, 9, "coin"], [139, 5, "coin"], [142, 9, "coin"],
      [176, 8, "mushroom"], [177, 8, "coin"], [178, 8, "coin"]
    ];

    for (const [x, y, prize] of questionBlocks) setTile(x, y, "question", { prize, used: false });

    addBrickRun(18, 9, 3);
    addBrickRun(24, 9, 3);
    addBrickRun(49, 9, 7);
    addBrickRun(58, 6, 4);
    addBrickRun(84, 9, 5);
    addBrickRun(93, 7, 8);
    addBrickRun(128, 9, 5);
    addBrickRun(145, 8, 8);
    addBrickRun(184, 9, 4);

    addCloudPlatform(38, 11, 5);
    addCloudPlatform(69, 10, 5);
    addCloudPlatform(90, 11, 6);
    addCloudPlatform(122, 10, 5);
    addCloudPlatform(152, 9, 7);
    addCloudPlatform(188, 10, 4);

    addPipe(28, 2);
    addPipe(54, 3);
    addPipe(87, 2);
    addPipe(109, 4);
    addPipe(150, 3);
    addPipe(172, 2);

    addStairs(200, 13, 8, 1);
    addStairs(211, 13, 8, -1);

    for (let i = 0; i < 42; i += 1) {
      coins.push({ x: 420 + i * 118, y: 248 + Math.sin(i * 1.35) * 42, r: 8, spin: i * 0.7, got: false });
    }
    addCoinArc(13, 7, 6);
    addCoinArc(46, 6, 7);
    addCoinArc(76, 6, 7);
    addCoinArc(132, 6, 8);
    addCoinArc(169, 6, 8);

    addEnemy(620, 384, 500, 1010, 1);
    addEnemy(1320, 384, 1200, 1700, -1);
    addEnemy(1810, 384, 1710, 2100, 1);
    addEnemy(2580, 288, 2480, 2920, -1);
    addEnemy(3130, 384, 3000, 3410, 1);
    addEnemy(3900, 384, 3780, 4210, -1);
    addEnemy(4680, 384, 4520, 5000, 1);
    addEnemy(5610, 384, 5480, 5900, -1);

    for (let i = 0; i < 22; i += 1) {
      clouds.push({
        x: i * 360 + (i % 3) * 94,
        y: 54 + (i % 5) * 25,
        s: 0.75 + (i % 4) * 0.12
      });
      hills.push({
        x: i * 470 + (i % 2) * 160,
        y: 398 + (i % 3) * 10,
        w: 230 + (i % 4) * 40,
        h: 100 + (i % 3) * 18
      });
      bushes.push({
        x: i * 330 + (i % 4) * 70,
        y: 430,
        s: 0.8 + (i % 3) * 0.18
      });
    }

    setTile(214, 4, "flagTop");
    setTile(214, 5, "flagPole");
    setTile(214, 6, "flagPole");
    setTile(214, 7, "flagPole");
    setTile(214, 8, "flagPole");
    setTile(214, 9, "flagPole");
    setTile(214, 10, "flagPole");
    setTile(214, 11, "flagPole");
    setTile(214, 12, "flagPole");
    setTile(214, 13, "flagPole");
    setTile(216, 13, "castleBase");
    setTile(217, 13, "castleBase");
    setTile(218, 13, "castleBase");
    setTile(216, 12, "castleWall");
    setTile(217, 12, "castleWall");
    setTile(218, 12, "castleWall");
    setTile(217, 11, "castleWall");
    setTile(216, 10, "castleTop");
    setTile(218, 10, "castleTop");

    worldBuilt = true;
  }

  function addBrickRun(x, y, len) {
    for (let i = 0; i < len; i += 1) setTile(x + i, y, "brick");
  }

  function addCloudPlatform(x, y, len) {
    for (let i = 0; i < len; i += 1) setTile(x + i, y, "platform");
  }

  function addStairs(x, y, levels, dir) {
    for (let i = 0; i < levels; i += 1) {
      for (let j = 0; j <= i; j += 1) {
        setTile(x + i * dir, y - j, "stone");
      }
    }
  }

  function addPipe(x, height) {
    pipes.push({ x: x * TILE, y: (FLOOR_ROW - height) * TILE, h: height * TILE });
    for (let y = FLOOR_ROW - height; y < FLOOR_ROW; y += 1) {
      setTile(x, y, y === FLOOR_ROW - height ? "pipeTopL" : "pipeBodyL");
      setTile(x + 1, y, y === FLOOR_ROW - height ? "pipeTopR" : "pipeBodyR");
    }
  }

  function addCoinArc(tileX, tileY, count) {
    for (let i = 0; i < count; i += 1) {
      const mid = (count - 1) / 2;
      coins.push({
        x: (tileX + i) * TILE + 16,
        y: tileY * TILE - Math.abs(i - mid) * 10,
        r: 8,
        spin: i * 0.35,
        got: false
      });
    }
  }

  function addEnemy(x, y, left, right, dir) {
    enemies.push({
      x,
      y,
      w: 28,
      h: 28,
      vx: dir * 1.15,
      vy: 0,
      left,
      right,
      dead: 0,
      squash: 0,
      phase: Math.random() * 10
    });
  }

  function resetPlayer(keepScore = false) {
    const score = keepScore ? player.score : 0;
    const gotCoins = keepScore ? player.coins : 0;
    const lives = keepScore ? player.lives : 3;
    player.x = 96;
    player.y = 320;
    player.w = 24;
    player.h = 42;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.score = score;
    player.coins = gotCoins;
    player.lives = lives;
    player.big = false;
    player.inv = 0;
    player.deadTimer = 0;
    player.winTimer = 0;
    player.runAnim = 0;
    cameraX = 0;
    gameClock = MAX_TIME;
  }

  function restartGame() {
    buildWorld();
    resetPlayer(false);
    state = "running";
    curtain.classList.add("hidden");
    playSfx("start");
  }

  function startGame() {
    ensureAudio();
    if (!worldBuilt || state === "title" || state === "gameover" || state === "win") buildWorld();
    if (state === "title" || state === "gameover" || state === "win") resetPlayer(false);
    state = "running";
    curtain.classList.add("hidden");
    playSfx("start");
    startMusic();
  }

  function ensureAudio() {
    if (audio.ctx) {
      if (audio.ctx.state === "suspended") audio.ctx.resume();
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio.ctx = new AudioContext();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.22;
    audio.master.connect(audio.ctx.destination);
  }

  function setSound(enabled) {
    audio.enabled = enabled;
    soundBtn.textContent = enabled ? "Sound On" : "Muted";
    soundBtn.setAttribute("aria-pressed", enabled ? "true" : "false");
    if (enabled) {
      ensureAudio();
      if (state === "running") startMusic();
      playSfx("coin");
    } else {
      stopMusic();
    }
  }

  function startMusic() {
    if (!audio.enabled) return;
    ensureAudio();
    if (!audio.ctx || audio.musicTimer) return;

    const melody = [
      392, 523, 659, 784, 659, 523, 440, 587,
      698, 587, 494, 392, 440, 523, 587, 523,
      349, 440, 523, 659, 587, 523, 392, 330,
      392, 494, 587, 698, 784, 698, 587, 523
    ];
    const bass = [196, 196, 262, 262, 220, 220, 247, 247];

    audio.note = 0;
    audio.musicTimer = window.setInterval(() => {
      if (!audio.enabled || state !== "running") return;
      const t = audio.ctx.currentTime;
      const m = melody[audio.note % melody.length];
      const b = bass[Math.floor(audio.note / 2) % bass.length];
      tone(m, 0.075, 0.035, "square", t);
      if (audio.note % 2 === 0) tone(b, 0.12, 0.028, "triangle", t);
      audio.note += 1;
    }, 155);
  }

  function stopMusic() {
    if (audio.musicTimer) {
      window.clearInterval(audio.musicTimer);
      audio.musicTimer = null;
    }
  }

  function tone(freq, dur, gain, type = "square", when = null, bend = 0) {
    if (!audio.enabled || !audio.ctx || !audio.master) return;
    const t = when ?? audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const amp = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (bend) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + bend), t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(audio.master);
    osc.start(t);
    osc.stop(t + dur + 0.025);
  }

  function noise(dur, gain) {
    if (!audio.enabled || !audio.ctx || !audio.master) return;
    const size = Math.max(1, Math.floor(audio.ctx.sampleRate * dur));
    const buffer = audio.ctx.createBuffer(1, size, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i += 1) data[i] = Math.random() * 2 - 1;
    const src = audio.ctx.createBufferSource();
    const amp = audio.ctx.createGain();
    amp.gain.setValueAtTime(gain, audio.ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + dur);
    src.buffer = buffer;
    src.connect(amp);
    amp.connect(audio.master);
    src.start();
    src.stop(audio.ctx.currentTime + dur);
  }

  function playSfx(name) {
    if (!audio.enabled) return;
    ensureAudio();
    if (!audio.ctx) return;
    const t = audio.ctx.currentTime;
    if (name === "jump") {
      tone(330, 0.11, 0.06, "square", t, 180);
    } else if (name === "coin") {
      tone(988, 0.06, 0.045, "square", t);
      tone(1318, 0.09, 0.035, "square", t + 0.055);
    } else if (name === "bump") {
      tone(160, 0.08, 0.05, "triangle", t, -55);
    } else if (name === "break") {
      noise(0.18, 0.055);
      tone(90, 0.12, 0.05, "sawtooth", t, -35);
    } else if (name === "stomp") {
      tone(190, 0.06, 0.065, "square", t, -80);
    } else if (name === "power") {
      tone(440, 0.07, 0.05, "square", t);
      tone(660, 0.08, 0.05, "square", t + 0.07);
      tone(880, 0.1, 0.045, "square", t + 0.15);
    } else if (name === "hurt") {
      tone(330, 0.18, 0.055, "sawtooth", t, -190);
    } else if (name === "start") {
      tone(262, 0.08, 0.045, "square", t);
      tone(392, 0.08, 0.045, "square", t + 0.08);
      tone(523, 0.12, 0.045, "square", t + 0.16);
    } else if (name === "win") {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 0.05, "square", t + i * 0.13));
    }
  }

  function update(dt) {
    if (state !== "running") return;

    gameClock -= dt / 60;
    if (gameClock <= 0) hurtPlayer(true);

    if (player.deadTimer > 0) {
      player.deadTimer -= dt;
      player.vy += 0.6 * dt;
      player.y += player.vy * dt;
      if (player.deadTimer <= 0) respawn();
      updateCamera();
      return;
    }

    if (player.winTimer > 0) {
      player.winTimer -= dt;
      player.vx *= 0.92;
      player.x += 1.4 * dt;
      if (player.winTimer <= 0) {
        state = "win";
        stopMusic();
        showCurtain("WORLD CLEAR", "Again");
      }
      updateCamera();
      return;
    }

    handleInput(dt);
    applyPhysics(player, dt, true);
    updateCoins(dt);
    updatePowerups(dt);
    updateEnemies(dt);
    updateParticles(dt);
    updateBumps(dt);
    checkFlag();
    updateCamera();
    updateHud();
  }

  function handleInput(dt) {
    const left = keys.ArrowLeft || keys.KeyA || touch.left;
    const right = keys.ArrowRight || keys.KeyD || touch.right;
    const run = keys.ShiftLeft || keys.ShiftRight || keys.KeyK || touch.run;
    const jump = keys.Space || keys.ArrowUp || keys.KeyW || keys.KeyJ || touch.jump;

    if (player.inv > 0) player.inv -= dt;
    if (player.coyote > 0) player.coyote -= dt;
    if (player.jumpBuffer > 0) player.jumpBuffer -= dt;

    if (left) player.facing = -1;
    if (right) player.facing = 1;

    const accel = run ? 0.55 : 0.42;
    const max = run ? 5.05 : 3.45;
    if (left) player.vx -= accel * dt;
    if (right) player.vx += accel * dt;
    if (!left && !right) player.vx *= Math.pow(player.onGround ? 0.76 : 0.92, dt);
    player.vx = clamp(player.vx, -max, max);

    if (jump) {
      if (!keys._jumpHeld) player.jumpBuffer = 8;
      keys._jumpHeld = true;
    } else {
      keys._jumpHeld = false;
      if (player.vy < -4.2) player.vy += 0.82 * dt;
    }

    if (player.jumpBuffer > 0 && (player.onGround || player.coyote > 0)) {
      player.vy = player.big ? -12.35 : -11.85;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      playSfx("jump");
      burst(player.x + player.w / 2, player.y + player.h, "#fff6ad", 5, 1.8);
    }

    player.runAnim += Math.abs(player.vx) * 0.28 * dt;
  }

  function applyPhysics(obj, dt, isPlayer = false) {
    const gravity = isPlayer && obj.vy < 0 && (keys.Space || keys.ArrowUp || keys.KeyW || keys.KeyJ || touch.jump) ? 0.58 : 0.72;
    obj.vy += gravity * dt;
    obj.vy = Math.min(obj.vy, 14);

    obj.x += obj.vx * dt;
    resolve(obj, "x", isPlayer);

    obj.y += obj.vy * dt;
    obj.onGround = false;
    resolve(obj, "y", isPlayer);

    if (isPlayer) {
      if (obj.onGround) obj.coyote = 7;
      if (obj.y > H + 120) hurtPlayer(true);
      obj.x = clamp(obj.x, 0, WORLD_W - obj.w - 10);
    }
  }

  function resolve(obj, axis, isPlayer) {
    const rect = { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
    const tiles = tilesForRect(rect.x, rect.y, rect.w, rect.h);
    for (const tile of tiles) {
      if (!rectHitsTile(rect, tile)) continue;
      const tx = tile.tx * TILE;
      const ty = tile.ty * TILE;
      if (axis === "x") {
        if (obj.vx > 0) obj.x = tx - obj.w;
        if (obj.vx < 0) obj.x = tx + TILE;
        obj.vx = 0;
        rect.x = obj.x;
      } else {
        if (obj.vy > 0) {
          obj.y = ty - obj.h;
          obj.vy = 0;
          obj.onGround = true;
          rect.y = obj.y;
        } else if (obj.vy < 0) {
          obj.y = ty + TILE;
          rect.y = obj.y;
          if (isPlayer) hitBlock(tile);
          obj.vy = 0.7;
        }
      }
    }
  }

  function hitBlock(tile) {
    const key = tileKey(tile.tx, tile.ty);
    bumps.set(key, { t: 11, max: 11 });

    if (tile.type === "question" && !tile.meta.used) {
      tile.meta.used = true;
      tile.type = "used";
      if (tile.meta.prize === "mushroom") {
        powerups.push({
          x: tile.tx * TILE + 4,
          y: tile.ty * TILE - 30,
          w: 24,
          h: 24,
          vx: 1.25,
          vy: -1.5,
          rise: 16,
          type: "mushroom"
        });
        playSfx("power");
      } else {
        collectCoin(tile.tx * TILE + 16, tile.ty * TILE - 10, true);
      }
    } else if (tile.type === "brick") {
      if (player.big) {
        removeTile(tile.tx, tile.ty);
        playSfx("break");
        for (let i = 0; i < 18; i += 1) {
          particles.push({
            x: tile.tx * TILE + 16,
            y: tile.ty * TILE + 16,
            vx: (Math.random() - 0.5) * 5,
            vy: -Math.random() * 5 - 2,
            life: 35 + Math.random() * 16,
            color: i % 2 ? "#b3542d" : "#f0a14a",
            size: 5 + Math.random() * 5
          });
        }
      } else {
        playSfx("bump");
      }
    } else {
      playSfx("bump");
    }
  }

  function collectCoin(x, y, fromBlock = false) {
    player.coins += 1;
    player.score += 100;
    if (player.coins >= 100) {
      player.coins = 0;
      player.lives += 1;
      playSfx("power");
    } else {
      playSfx("coin");
    }
    floaters.push({ x, y, vy: fromBlock ? -2.5 : -1.2, text: "+100", life: 40, coin: fromBlock });
  }

  function updateCoins(dt) {
    for (const coin of coins) {
      if (coin.got) continue;
      coin.spin += 0.19 * dt;
      const hit = player.x < coin.x + 12 && player.x + player.w > coin.x - 12 &&
        player.y < coin.y + 13 && player.y + player.h > coin.y - 13;
      if (hit) {
        coin.got = true;
        collectCoin(coin.x, coin.y);
      }
    }

    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const f = floaters[i];
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }
  }

  function updatePowerups(dt) {
    for (let i = powerups.length - 1; i >= 0; i -= 1) {
      const p = powerups[i];
      if (p.rise > 0) {
        p.y -= 0.45 * dt;
        p.rise -= dt;
      } else {
        applyPhysics(p, dt, false);
        if (p.vx === 0) p.vx = 1.25;
        const ahead = p.vx > 0 ? p.x + p.w + 2 : p.x - 2;
        const foot = p.y + p.h + 5;
        if (!solidAt(Math.floor(ahead / TILE), Math.floor(foot / TILE))) p.vx *= -1;
      }

      if (rectsOverlap(player, p)) {
        powerups.splice(i, 1);
        growPlayer();
      }
    }
  }

  function growPlayer() {
    if (!player.big) {
      player.big = true;
      const oldH = player.h;
      player.h = 54;
      player.y -= player.h - oldH;
    }
    player.score += 1000;
    player.inv = 75;
    playSfx("power");
    burst(player.x + player.w / 2, player.y + 20, "#fff4a2", 18, 3.3);
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      if (e.dead > 0) {
        e.dead -= dt;
        e.y += e.vy * dt;
        e.vy += 0.55 * dt;
        if (e.dead <= 0 || e.y > H + 200) enemies.splice(i, 1);
        continue;
      }

      e.phase += dt * 0.1;
      e.vx = clamp(e.vx, -1.35, 1.35);
      applyPhysics(e, dt, false);

      if (e.x < e.left || e.x + e.w > e.right || e.vx === 0) e.vx = (e.x < e.left ? 1 : -1) * 1.15;
      const ahead = e.vx > 0 ? e.x + e.w + 4 : e.x - 4;
      const foot = e.y + e.h + 8;
      if (!solidAt(Math.floor(ahead / TILE), Math.floor(foot / TILE))) e.vx *= -1;

      if (rectsOverlap(player, e) && player.deadTimer <= 0 && player.winTimer <= 0) {
        const stomp = player.vy > 0.6 && player.y + player.h - e.y < 22;
        if (stomp) {
          e.dead = 22;
          e.vy = -2.2;
          e.squash = 1;
          player.vy = -8.8;
          player.score += 200;
          playSfx("stomp");
          burst(e.x + e.w / 2, e.y + e.h / 2, "#f3d16b", 10, 2.2);
        } else {
          hurtPlayer(false);
        }
      }
    }
  }

  function hurtPlayer(forceDeath) {
    if (player.inv > 0 || player.deadTimer > 0 || player.winTimer > 0) return;

    if (player.big && !forceDeath) {
      player.big = false;
      const oldH = player.h;
      player.h = 42;
      player.y += oldH - player.h;
      player.inv = 120;
      player.vx = -player.facing * 2.2;
      player.vy = -5.5;
      playSfx("hurt");
      return;
    }

    player.lives -= 1;
    player.deadTimer = 105;
    player.vy = -10;
    player.vx = 0;
    stopMusic();
    playSfx("hurt");
  }

  function respawn() {
    if (player.lives <= 0) {
      state = "gameover";
      highScore = Math.max(highScore, player.score);
      localStorage.setItem("pipebound-high", String(highScore));
      showCurtain("GAME OVER", "Retry");
      return;
    }

    buildWorld();
    resetPlayer(true);
    startMusic();
  }

  function checkFlag() {
    if (player.x > 213.2 * TILE && player.winTimer <= 0) {
      player.winTimer = 170;
      player.score += Math.floor(gameClock) * 10 + 3000;
      player.vx = 1.1;
      player.vy = 0;
      stopMusic();
      playSfx("win");
      burst(player.x, player.y, "#fff6a5", 30, 4);
    }
  }

  function showCurtain(title, buttonText) {
    curtain.querySelector("h1").textContent = title;
    curtain.querySelector(".kicker").textContent = highScore ? `BEST ${pad(highScore, 6)}` : "WORLD 1-1";
    startBtn.textContent = buttonText;
    curtain.classList.remove("hidden");
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.32 * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateBumps(dt) {
    for (const [key, b] of bumps) {
      b.t -= dt;
      if (b.t <= 0) bumps.delete(key);
    }
  }

  function burst(x, y, color, count, power) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * power + 0.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 20 + Math.random() * 28,
        color,
        size: 3 + Math.random() * 4
      });
    }
  }

  function updateCamera() {
    const target = player.x - W * 0.42;
    cameraX += (clamp(target, 0, WORLD_W - W) - cameraX) * 0.12;
  }

  function updateHud() {
    scoreNode.textContent = pad(player.score, 6);
    coinsNode.textContent = pad(player.coins, 2);
    livesNode.textContent = pad(player.lives, 2);
    timeNode.textContent = pad(gameClock, 3);
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
    drawSky();
    ctx.save();
    ctx.translate(-Math.floor(cameraX), 0);
    drawDistantScenery();
    drawTiles();
    drawCoins();
    drawPowerups();
    drawEnemies();
    drawParticles();
    drawPlayer();
    drawFloaters();
    ctx.restore();

    if (state === "title") {
      drawAttract();
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#62c7ff");
    g.addColorStop(0.55, "#9de8ff");
    g.addColorStop(0.56, "#ffd37a");
    g.addColorStop(1, "#d97935");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.34)";
    for (let i = 0; i < 8; i += 1) {
      const x = (i * 174 - cameraX * 0.12) % (W + 220) - 80;
      drawCloud(x, 66 + (i % 3) * 32, 0.65 + (i % 4) * 0.08);
    }
  }

  function drawDistantScenery() {
    for (const cloud of clouds) drawCloud(cloud.x + cameraX * 0.38, cloud.y, cloud.s);
    for (const hill of hills) drawHill(hill.x, hill.y, hill.w, hill.h);
    for (const bush of bushes) drawBush(bush.x, bush.y, bush.s);
  }

  function drawCloud(x, y, s) {
    ctx.fillStyle = "#ffffff";
    pixelOval(x, y + 16 * s, 80 * s, 28 * s);
    pixelOval(x + 22 * s, y, 58 * s, 42 * s);
    pixelOval(x + 58 * s, y + 8 * s, 68 * s, 34 * s);
    ctx.fillStyle = "#dff9ff";
    ctx.fillRect(Math.round(x + 10 * s), Math.round(y + 32 * s), Math.round(98 * s), Math.max(3, Math.round(5 * s)));
  }

  function drawHill(x, y, w, h) {
    ctx.fillStyle = "#6fc755";
    pixelOval(x, y, w, h);
    ctx.fillStyle = "#4aad45";
    pixelOval(x + w * 0.13, y + h * 0.18, w * 0.28, h * 0.28);
    pixelOval(x + w * 0.58, y + h * 0.28, w * 0.2, h * 0.22);
  }

  function drawBush(x, y, s) {
    ctx.fillStyle = "#289f48";
    pixelOval(x, y, 60 * s, 30 * s);
    pixelOval(x + 34 * s, y - 12 * s, 70 * s, 44 * s);
    pixelOval(x + 84 * s, y, 54 * s, 30 * s);
    ctx.fillStyle = "#1f7e3d";
    ctx.fillRect(Math.round(x + 4 * s), Math.round(y + 20 * s), Math.round(120 * s), Math.round(9 * s));
  }

  function pixelOval(x, y, w, h) {
    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTiles() {
    const left = Math.max(0, Math.floor(cameraX / TILE) - 2);
    const right = Math.min(WORLD_TILES, Math.ceil((cameraX + W) / TILE) + 2);
    for (let tx = left; tx <= right; tx += 1) {
      for (let ty = 0; ty < 17; ty += 1) {
        const tile = getTile(tx, ty);
        if (!tile) continue;
        const bump = bumps.get(tileKey(tx, ty));
        const offset = bump ? -Math.sin((bump.t / bump.max) * Math.PI) * 9 : 0;
        drawTile(tile, tx * TILE, ty * TILE + offset);
      }
    }
  }

  function drawTile(tile, x, y) {
    if (tile.type === "ground") {
      ctx.fillStyle = "#d87a34";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#ffc85b";
      ctx.fillRect(x, y, TILE, 8);
      ctx.fillStyle = "#8b4b25";
      ctx.fillRect(x, y + 26, TILE, 6);
      ctx.fillStyle = "#a55528";
      ctx.fillRect(x + 6, y + 12, 9, 5);
      ctx.fillRect(x + 21, y + 18, 7, 5);
    } else if (tile.type === "earth") {
      ctx.fillStyle = "#8c4f2b";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#6f3b23";
      ctx.fillRect(x + 4, y + 5, 6, 6);
      ctx.fillRect(x + 20, y + 17, 7, 5);
      ctx.fillStyle = "#b86d35";
      ctx.fillRect(x + 13, y + 8, 6, 4);
    } else if (tile.type === "brick") {
      ctx.fillStyle = "#b85a32";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#f29a4b";
      ctx.fillRect(x + 2, y + 3, 28, 5);
      ctx.fillRect(x + 2, y + 17, 28, 5);
      ctx.fillStyle = "#7d3425";
      ctx.fillRect(x, y + 13, TILE, 3);
      ctx.fillRect(x + 14, y + 1, 3, 14);
      ctx.fillRect(x + 6, y + 16, 3, 15);
      ctx.fillRect(x + 24, y + 16, 3, 15);
    } else if (tile.type === "question") {
      const pulse = Math.sin(performance.now() * 0.006 + x) * 2;
      ctx.fillStyle = "#f7b829";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#ffe989";
      ctx.fillRect(x + 4, y + 4, 24, 5);
      ctx.fillStyle = "#a55c17";
      ctx.fillRect(x, y + 27, TILE, 5);
      ctx.fillStyle = "#fff2af";
      ctx.fillRect(x + 13, y + 7 + pulse, 7, 6);
      ctx.fillRect(x + 19, y + 12 + pulse, 5, 8);
      ctx.fillRect(x + 14, y + 22 + pulse, 5, 5);
    } else if (tile.type === "used") {
      ctx.fillStyle = "#b8894e";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#d2a86e";
      ctx.fillRect(x + 5, y + 5, 22, 5);
      ctx.fillStyle = "#7a5734";
      ctx.fillRect(x + 4, y + 25, 24, 4);
    } else if (tile.type === "platform") {
      ctx.fillStyle = "#fff7cf";
      ctx.fillRect(x, y + 4, TILE, 22);
      ctx.fillStyle = "#7ccf57";
      ctx.fillRect(x, y, TILE, 8);
      ctx.fillStyle = "#45a543";
      ctx.fillRect(x, y + 8, TILE, 5);
    } else if (tile.type === "stone") {
      ctx.fillStyle = "#b6b8c9";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#e7e9f1";
      ctx.fillRect(x + 3, y + 3, 26, 6);
      ctx.fillStyle = "#74788f";
      ctx.fillRect(x, y + 27, TILE, 5);
      ctx.fillRect(x + 14, y, 4, TILE);
    } else if (tile.type.startsWith("pipe")) {
      drawPipeTile(tile.type, x, y);
    } else if (tile.type.startsWith("flag")) {
      drawFlag(tile.type, x, y);
    } else if (tile.type.startsWith("castle")) {
      drawCastle(tile.type, x, y);
    }
  }

  function drawPipeTile(type, x, y) {
    const left = type.endsWith("L");
    ctx.fillStyle = "#0f7f36";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#32d663";
    ctx.fillRect(x + (left ? 4 : 0), y + 3, left ? 16 : 12, TILE - 6);
    ctx.fillStyle = "#075d29";
    ctx.fillRect(x + (left ? 25 : 0), y, 7, TILE);
    if (type.startsWith("pipeTop")) {
      ctx.fillStyle = "#17a846";
      ctx.fillRect(x, y, TILE, 12);
      ctx.fillStyle = "#63ef83";
      ctx.fillRect(x + (left ? 5 : 0), y + 2, left ? 16 : 10, 5);
      ctx.fillStyle = "#06471e";
      ctx.fillRect(x, y + 12, TILE, 4);
    }
  }

  function drawFlag(type, x, y) {
    if (type === "flagTop") {
      ctx.fillStyle = "#ffd956";
      ctx.fillRect(x + 11, y + 3, 10, 10);
      ctx.fillStyle = "#63351a";
      ctx.fillRect(x + 14, y + 12, 4, 22);
      ctx.fillStyle = "#e83a34";
      ctx.fillRect(x + 18, y + 10, 42, 24);
      ctx.fillStyle = "#fff4bd";
      ctx.fillRect(x + 23, y + 16, 18, 8);
    } else {
      ctx.fillStyle = "#63351a";
      ctx.fillRect(x + 14, y, 4, TILE);
    }
  }

  function drawCastle(type, x, y) {
    ctx.fillStyle = type === "castleBase" ? "#6e4534" : "#8d5942";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#b98562";
    ctx.fillRect(x + 4, y + 4, 8, 7);
    ctx.fillRect(x + 20, y + 4, 8, 7);
    ctx.fillStyle = "#3b2219";
    if (type === "castleBase") ctx.fillRect(x + 9, y + 9, 14, 23);
    if (type === "castleTop") {
      ctx.fillRect(x, y, 8, 8);
      ctx.fillRect(x + 24, y, 8, 8);
    }
  }

  function drawCoins() {
    for (const coin of coins) {
      if (coin.got) continue;
      const sx = Math.max(4, Math.abs(Math.cos(coin.spin)) * 12);
      ctx.fillStyle = "#f8c72e";
      pixelOval(coin.x - sx / 2, coin.y - 12, sx, 24);
      ctx.fillStyle = "#fff09b";
      ctx.fillRect(Math.round(coin.x - sx / 6), Math.round(coin.y - 7), Math.max(2, Math.round(sx / 5)), 12);
      ctx.fillStyle = "#ac6719";
      ctx.fillRect(Math.round(coin.x - sx / 2), Math.round(coin.y + 9), Math.round(sx), 3);
    }
  }

  function drawPowerups() {
    for (const p of powerups) {
      ctx.fillStyle = "#e94232";
      pixelOval(p.x, p.y, p.w, p.h - 4);
      ctx.fillStyle = "#fff4d2";
      ctx.fillRect(p.x + 5, p.y + 6, 5, 5);
      ctx.fillRect(p.x + 15, p.y + 5, 5, 6);
      ctx.fillStyle = "#f0d5a3";
      ctx.fillRect(p.x + 3, p.y + 15, p.w - 6, 10);
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(p.x + 8, p.y + 18, 3, 3);
      ctx.fillRect(p.x + 15, p.y + 18, 3, 3);
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      const squashed = e.squash || e.dead > 0;
      ctx.save();
      ctx.translate(e.x, e.y + (squashed ? 14 : 0));
      ctx.scale(1, squashed ? 0.55 : 1);
      ctx.fillStyle = "#8b4d25";
      pixelOval(0, 0, e.w, e.h);
      ctx.fillStyle = "#5f321b";
      ctx.fillRect(4, 18, 8, 8);
      ctx.fillRect(17, 18, 8, 8);
      ctx.fillStyle = "#fff3d0";
      ctx.fillRect(7, 8, 5, 5);
      ctx.fillRect(17, 8, 5, 5);
      ctx.fillStyle = "#1d110c";
      ctx.fillRect(9 + Math.sin(e.phase) * 1, 10, 2, 2);
      ctx.fillRect(19 + Math.sin(e.phase) * 1, 10, 2, 2);
      ctx.fillRect(10, 16, 10, 3);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / 28, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }

  function drawFloaters() {
    ctx.font = "900 16px Arial";
    ctx.textAlign = "center";
    for (const f of floaters) {
      ctx.globalAlpha = clamp(f.life / 28, 0, 1);
      if (f.coin) {
        ctx.fillStyle = "#ffd342";
        pixelOval(f.x - 8, f.y - 16, 16, 22);
      }
      ctx.fillStyle = "#fff3bd";
      ctx.strokeStyle = "#5a2a16";
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawPlayer() {
    const flicker = player.inv > 0 && Math.floor(player.inv / 5) % 2 === 0;
    if (flicker) return;
    const x = Math.round(player.x);
    const y = Math.round(player.y);
    const big = player.big;
    const bob = player.onGround ? Math.sin(player.runAnim) * Math.min(2, Math.abs(player.vx) * 0.35) : 0;
    ctx.save();
    ctx.translate(x + player.w / 2, y + bob);
    ctx.scale(player.facing, 1);
    ctx.translate(-player.w / 2, 0);

    ctx.fillStyle = "#233d9c";
    ctx.fillRect(5, big ? 25 : 20, 15, big ? 24 : 18);
    ctx.fillStyle = "#f03b2f";
    ctx.fillRect(4, big ? 12 : 10, 17, big ? 19 : 16);
    ctx.fillStyle = "#f6c08d";
    ctx.fillRect(7, big ? 5 : 4, 13, 12);
    ctx.fillStyle = "#e52f28";
    ctx.fillRect(2, big ? 2 : 1, 18, 7);
    ctx.fillRect(9, big ? -1 : -2, 14, 5);
    ctx.fillStyle = "#5b2a17";
    ctx.fillRect(16, big ? 8 : 7, 5, 4);
    ctx.fillRect(11, big ? 14 : 13, 8, 3);
    ctx.fillStyle = "#111";
    ctx.fillRect(16, big ? 7 : 6, 2, 2);
    ctx.fillStyle = "#ffe7a3";
    ctx.fillRect(4, big ? 30 : 24, 5, 8);
    ctx.fillRect(17, big ? 30 : 24, 5, 8);
    ctx.fillStyle = "#5c2e1d";
    const step = Math.sin(player.runAnim) > 0 ? 2 : -2;
    ctx.fillRect(2, (big ? 48 : 36) + step, 9, 5);
    ctx.fillRect(15, (big ? 48 : 36) - step, 9, 5);
    ctx.restore();
  }

  function drawAttract() {
    if (worldBuilt) return;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    for (let i = 0; i < 8; i += 1) drawCloud(80 + i * 150, 90 + (i % 3) * 36, 0.8);
  }

  function loop(now) {
    const frame = Math.min(48, now - lastTime || 16.67);
    lastTime = now;
    accumulator += frame;

    while (accumulator >= 16.67) {
      update(1);
      accumulator -= 16.67;
    }

    render();
    requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", () => {
    startGame();
  });

  restartBtn.addEventListener("click", () => {
    ensureAudio();
    restartGame();
    startMusic();
  });

  soundBtn.addEventListener("click", () => {
    setSound(!audio.enabled);
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    keys[event.code] = true;
    if (event.code === "Enter" && state !== "running") startGame();
    if (event.code === "KeyM") setSound(!audio.enabled);
    if (event.code === "KeyR") {
      ensureAudio();
      restartGame();
      startMusic();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  for (const button of document.querySelectorAll("[data-touch]")) {
    const name = button.getAttribute("data-touch");
    const down = (event) => {
      event.preventDefault();
      touch[name] = true;
      if (name === "jump") keys._jumpHeld = false;
    };
    const up = (event) => {
      event.preventDefault();
      touch[name] = false;
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  }

  buildWorld();
  updateHud();
  requestAnimationFrame(loop);
})();
