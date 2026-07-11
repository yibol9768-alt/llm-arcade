/**
 * Super Mario Bros. style 1-1 clone
 * Canvas pixel art + SMB-inspired physics
 */
(function () {
  "use strict";

  const TILE = 16;
  const SCALE = 3; // internal: 256x144 logical -> canvas 768x432
  const VIEW_W = 256;
  const VIEW_H = 144;
  const GRAVITY = 0.35;
  const MAX_FALL = 7;
  const WALK_ACC = 0.12;
  const RUN_ACC = 0.18;
  const MAX_WALK = 1.6;
  const MAX_RUN = 2.5;
  const FRICTION = 0.85;
  const JUMP_FORCE = -6.2;
  const JUMP_HOLD = -0.28;
  const START_TIME = 400;

  // Palette (NES-ish)
  const C = {
    sky: "#5c94fc",
    ground: "#c84c0c",
    groundTop: "#00a800",
    brick: "#c84c0c",
    brickDark: "#8c2c0c",
    qBlock: "#f0bc3c",
    qDark: "#c87818",
    pipe: "#00a800",
    pipeDark: "#007800",
    pipeLip: "#80d010",
    cloud: "#fcfcfc",
    bush: "#00a800",
    hill: "#80d010",
    hillDark: "#00a800",
    marioRed: "#e52521",
    marioBlue: "#3c3cff",
    marioSkin: "#fca044",
    marioBrown: "#ac7c00",
    goomba: "#c84c0c",
    goombaDark: "#5c2800",
    coin: "#fbd000",
    flag: "#00b800",
    white: "#fcfcfc",
    black: "#000000",
  };

  // Tile types
  const T = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    Q: 3,
    Q_EMPTY: 4,
    PIPE_TL: 5,
    PIPE_TR: 6,
    PIPE_BL: 7,
    PIPE_BR: 8,
    HARD: 9,
    FLAGPOLE: 10,
    FLAGTOP: 11,
  };

  const solid = new Set([
    T.GROUND, T.BRICK, T.Q, T.Q_EMPTY, T.PIPE_TL, T.PIPE_TR,
    T.PIPE_BL, T.PIPE_BR, T.HARD,
  ]);

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const audio = new MarioAudio();
  const muteBtn = document.getElementById("muteBtn");
  const overlay = document.getElementById("overlay");

  const hud = {
    score: document.getElementById("score"),
    coins: document.getElementById("coins"),
    time: document.getElementById("time"),
    lives: document.getElementById("lives"),
  };

  const keys = Object.create(null);
  let state = "title"; // title | play | dead | win | pause
  let cameraX = 0;
  let animTick = 0;
  let timeLeft = START_TIME;
  let timeAcc = 0;
  let score = 0;
  let coins = 0;
  let lives = 3;
  let invuln = 0;
  let particles = [];
  let floatTexts = [];
  let bumpBlocks = []; // {tx,ty,offset,vy}

  // ---------- Level generation (1-1 inspired) ----------
  function makeLevel() {
    const W = 220;
    const H = 9; // rows of tiles (ground at bottom)
    const map = Array.from({ length: H }, () => Array(W).fill(T.EMPTY));

    function fillGround(x0, x1, y = H - 1) {
      for (let x = x0; x < x1; x++) {
        if (x >= 0 && x < W) map[y][x] = T.GROUND;
      }
    }

    function put(x, y, t) {
      if (x >= 0 && x < W && y >= 0 && y < H) map[y][x] = t;
    }

    function pipe(x, height) {
      // height in tiles above ground
      const baseY = H - 2;
      for (let i = 0; i < height; i++) {
        const y = baseY - i;
        if (i === height - 1) {
          put(x, y, T.PIPE_TL);
          put(x + 1, y, T.PIPE_TR);
        } else {
          put(x, y, T.PIPE_BL);
          put(x + 1, y, T.PIPE_BR);
        }
      }
    }

    // Continuous ground with classic gaps
    fillGround(0, 69);
    fillGround(71, 86);
    fillGround(89, 153);
    fillGround(155, 220);

    // Stairs / pyramids near end
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j <= i; j++) put(140 + i, H - 2 - j, T.HARD);
    }
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j <= 3 - i; j++) put(148 + i, H - 2 - j, T.HARD);
    }
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j <= i; j++) put(181 + i, H - 2 - j, T.HARD);
    }

    // Question / brick formations
    put(16, 5, T.Q);
    put(20, 5, T.BRICK);
    put(21, 5, T.Q);
    put(22, 5, T.BRICK);
    put(23, 5, T.Q);
    put(24, 5, T.BRICK);
    put(22, 2, T.Q); // high coin / mushroom

    put(77, 5, T.BRICK);
    put(78, 5, T.Q);
    put(79, 5, T.BRICK);

    put(94, 5, T.BRICK);
    put(95, 5, T.BRICK);
    put(96, 5, T.Q);
    put(97, 5, T.BRICK);
    put(100, 2, T.BRICK);
    put(101, 2, T.BRICK);
    put(102, 2, T.BRICK);
    put(118, 5, T.Q);
    put(121, 5, T.BRICK);
    put(122, 5, T.Q);
    put(123, 5, T.BRICK);

    // Pipes
    pipe(28, 2);
    pipe(38, 3);
    pipe(46, 4);
    pipe(57, 4);
    pipe(163, 2);
    pipe(179, 2);

    // Flag
    put(198, H - 2, T.HARD);
    for (let y = 1; y <= 6; y++) put(198, H - 1 - y, T.FLAGPOLE);
    put(198, 1, T.FLAGTOP);

    // Decor clouds / hills / bushes stored separately
    const decor = {
      clouds: [
        [8, 2], [19, 1], [36, 2], [55, 1], [72, 2], [90, 1],
        [110, 2], [130, 1], [150, 2], [170, 1], [190, 2],
      ],
      hills: [[0, 0], [48, 0], [96, 0], [144, 0], [192, 0]],
      bushes: [[11, 0], [23, 0], [41, 0], [60, 0], [85, 0], [112, 0], [135, 0]],
    };

    const enemies = [
      { type: "goomba", x: 22 * TILE, y: 6 * TILE },
      { type: "goomba", x: 40 * TILE, y: 6 * TILE },
      { type: "goomba", x: 51 * TILE, y: 6 * TILE },
      { type: "goomba", x: 52.5 * TILE, y: 6 * TILE },
      { type: "goomba", x: 80 * TILE, y: 6 * TILE },
      { type: "goomba", x: 97 * TILE, y: 6 * TILE },
      { type: "goomba", x: 98.5 * TILE, y: 6 * TILE },
      { type: "goomba", x: 114 * TILE, y: 6 * TILE },
      { type: "goomba", x: 115.5 * TILE, y: 6 * TILE },
      { type: "goomba", x: 174 * TILE, y: 6 * TILE },
    ];

    const qContents = {
      "16,5": "coin",
      "21,5": "coin",
      "23,5": "coin",
      "22,2": "mushroom",
      "78,5": "coin",
      "96,5": "coin",
      "118,5": "coin",
      "122,5": "mushroom",
    };

    return { map, W, H, decor, enemies, qContents };
  }

  let level = makeLevel();

  function playerSpawn() {
    return {
      x: 2 * TILE,
      y: 5 * TILE,
      w: 12,
      h: 15,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      jumping: false,
      dead: false,
      big: false,
      walkFrame: 0,
      star: 0,
      sliding: false,
      flagDone: false,
    };
  }

  let player = playerSpawn();
  let enemies = [];
  let items = []; // mushrooms, coins floating

  function resetEnemies() {
    enemies = level.enemies.map((e) => ({
      type: e.type,
      x: e.x,
      y: e.y,
      w: 14,
      h: 14,
      vx: -0.55,
      vy: 0,
      dead: false,
      squashed: 0,
      frame: 0,
    }));
  }

  function softReset() {
    player = playerSpawn();
    items = [];
    particles = [];
    floatTexts = [];
    bumpBlocks = [];
    cameraX = 0;
    invuln = 90;
    timeLeft = START_TIME;
    timeAcc = 0;
    // restore map Q blocks that were emptied? keep progress on blocks for same life
    resetEnemies();
  }

  function fullReset() {
    level = makeLevel();
    score = 0;
    coins = 0;
    lives = 3;
    softReset();
  }

  // ---------- Input ----------
  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === "KeyM") toggleMuteUI();
    if (e.code === "KeyR") {
      fullReset();
      startPlay();
    }
    if (e.code === "Enter" || e.code === "Space") {
      if (state === "title" || state === "dead" || state === "win") {
        if (state === "win" || (state === "dead" && lives <= 0)) fullReset();
        else if (state === "dead") softReset();
        startPlay();
      }
    }
    if (e.code === "KeyP" && state === "play") {
      state = "pause";
      audio.pauseBeep();
      audio.stopBgm();
      showOverlay("PAUSED", "按 P 继续");
    } else if (e.code === "KeyP" && state === "pause") {
      state = "play";
      hideOverlay();
      audio.startBgm();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener("pointerdown", async () => {
    await audio.unlock();
    if (state === "title" || state === "dead" || state === "win") {
      if (state === "win" || (state === "dead" && lives <= 0)) fullReset();
      else if (state === "dead") softReset();
      startPlay();
    }
  });

  function updateMuteButton() {
    const muted = audio.muted;
    muteBtn.classList.toggle("muted", muted);
    muteBtn.querySelector(".mute-icon").textContent = muted ? "🔇" : "🔊";
    muteBtn.querySelector(".mute-text").textContent = muted ? "MUTED" : "SOUND ON";
  }

  async function toggleMuteUI() {
    await audio.unlock();
    audio.toggleMute();
    updateMuteButton();
  }

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMuteUI();
  });

  updateMuteButton();

  function showOverlay(title, hint) {
    overlay.classList.remove("hidden");
    overlay.querySelector(".title").innerHTML = title;
    overlay.querySelector(".subtitle").textContent = "";
    overlay.querySelector(".hint").textContent = hint || "按 Enter 继续";
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  async function startPlay() {
    await audio.unlock();
    state = "play";
    hideOverlay();
    audio.startBgm();
  }

  // ---------- Collision helpers ----------
  function tileAt(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= level.W || ty >= level.H) return T.EMPTY;
    return level.map[ty][tx];
  }

  function isSolidAt(px, py) {
    return solid.has(tileAt(px, py));
  }

  function rectTiles(x, y, w, h) {
    const tiles = [];
    const x0 = Math.floor(x / TILE);
    const y0 = Math.floor(y / TILE);
    const x1 = Math.floor((x + w - 0.01) / TILE);
    const y1 = Math.floor((y + h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (tx < 0 || ty < 0 || tx >= level.W || ty >= level.H) continue;
        const t = level.map[ty][tx];
        if (solid.has(t)) tiles.push({ tx, ty, t });
      }
    }
    return tiles;
  }

  function addScore(n, x, y) {
    score += n;
    if (x != null) {
      floatTexts.push({ x, y, text: String(n), life: 40 });
    }
  }

  function spawnCoinParticle(tx, ty) {
    items.push({
      type: "coinPop",
      x: tx * TILE + 2,
      y: ty * TILE,
      vy: -3.5,
      life: 28,
    });
    coins++;
    addScore(200, tx * TILE, ty * TILE);
    audio.coin();
    if (coins >= 100) {
      coins = 0;
      lives++;
      audio.powerup();
    }
  }

  function spawnMushroom(tx, ty) {
    items.push({
      type: "mushroom",
      x: tx * TILE,
      y: ty * TILE - 2,
      w: 14,
      h: 14,
      vx: 0.7,
      vy: -1.5,
      emerging: 16,
    });
    audio.powerup();
  }

  function hitBlock(tx, ty, fromBelow) {
    if (!fromBelow) return;
    const t = level.map[ty][tx];
    if (t === T.Q) {
      level.map[ty][tx] = T.Q_EMPTY;
      bumpBlocks.push({ tx, ty, offset: 0, vy: -2.2 });
      audio.bump();
      const key = `${tx},${ty}`;
      const content = level.qContents[key] || "coin";
      if (content === "mushroom" && !player.big) spawnMushroom(tx, ty);
      else spawnCoinParticle(tx, ty);
    } else if (t === T.BRICK) {
      bumpBlocks.push({ tx, ty, offset: 0, vy: -1.8 });
      if (player.big) {
        level.map[ty][tx] = T.EMPTY;
        audio.breakBrick();
        addScore(50, tx * TILE, ty * TILE);
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: tx * TILE + 8,
            y: ty * TILE + 8,
            vx: (i % 2 ? 1 : -1) * (1 + Math.random()),
            vy: -2 - Math.random() * 2,
            life: 30,
            color: C.brick,
          });
        }
      } else {
        audio.bump();
      }
    } else if (t === T.Q_EMPTY || t === T.HARD) {
      audio.bump();
      bumpBlocks.push({ tx, ty, offset: 0, vy: -1.2 });
    }
  }

  function killPlayer() {
    if (player.dead || invuln > 0 || player.star > 0) return;
    if (player.big) {
      player.big = false;
      player.h = 15;
      invuln = 120;
      audio.bump();
      return;
    }
    player.dead = true;
    player.vy = -7;
    player.vx = 0;
    lives--;
    audio.death();
    state = "dead";
    setTimeout(() => {
      if (lives <= 0) {
        showOverlay("GAME OVER", "按 Enter 重新开始");
      } else {
        showOverlay("MARIO ×" + lives, "按 Enter 继续");
      }
    }, 1800);
  }

  function stompEnemy(e) {
    e.dead = true;
    e.squashed = 24;
    e.vx = 0;
    player.vy = -4.2;
    player.jumping = false;
    addScore(100, e.x, e.y);
    audio.stomp();
  }

  // ---------- Update ----------
  function updatePlayer() {
    if (player.dead) {
      player.vy += GRAVITY * 0.7;
      player.y += player.vy;
      return;
    }

    if (player.flagDone) {
      // slide down pole then walk to castle
      if (player.y + player.h < (level.H - 1) * TILE) {
        player.y += 1.5;
        player.sliding = true;
      } else {
        player.sliding = false;
        player.x += 1.2;
        player.facing = 1;
        if (player.x > 205 * TILE) {
          state = "win";
          audio.win();
          showOverlay("COURSE CLEAR!", "按 Enter 再玩一次");
        }
      }
      return;
    }

    const left = keys.ArrowLeft || keys.KeyA;
    const right = keys.ArrowRight || keys.KeyD;
    const jump = keys.Space || keys.KeyZ || keys.ArrowUp || keys.KeyW;
    const run = keys.KeyX || keys.ShiftLeft || keys.ShiftRight;

    const acc = run ? RUN_ACC : WALK_ACC;
    const maxV = run ? MAX_RUN : MAX_WALK;

    if (left) {
      player.vx -= acc;
      player.facing = -1;
    }
    if (right) {
      player.vx += acc;
      player.facing = 1;
    }
    if (!left && !right) player.vx *= FRICTION;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
    player.vx = Math.max(-maxV, Math.min(maxV, player.vx));

    if (jump && player.onGround && !player.jumping) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      player.jumping = true;
      audio.jump();
    }
    if (jump && player.jumping && player.vy < 0) {
      player.vy += JUMP_HOLD;
    }
    if (!jump) player.jumping = false;

    player.vy += GRAVITY;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;

    // Horizontal move + collide
    player.x += player.vx;
    let hits = rectTiles(player.x, player.y, player.w, player.h);
    for (const h of hits) {
      const tileLeft = h.tx * TILE;
      const tileRight = tileLeft + TILE;
      if (player.vx > 0) player.x = tileLeft - player.w;
      else if (player.vx < 0) player.x = tileRight;
      player.vx = 0;
    }

    // Vertical
    player.y += player.vy;
    player.onGround = false;
    hits = rectTiles(player.x, player.y, player.w, player.h);
    for (const h of hits) {
      const tileTop = h.ty * TILE;
      const tileBot = tileTop + TILE;
      if (player.vy > 0) {
        player.y = tileTop - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = tileBot;
        player.vy = 0;
        hitBlock(h.tx, h.ty, true);
      }
    }

    if (Math.abs(player.vx) > 0.3 && player.onGround) {
      player.walkFrame += Math.abs(player.vx) * 0.25;
    }

    // Fall death
    if (player.y > level.H * TILE + 20) killPlayer();

    // Flag reach
    const tipX = 198 * TILE;
    if (player.x + player.w > tipX && player.x < tipX + 8 && !player.flagDone) {
      player.flagDone = true;
      player.x = tipX - 4;
      player.vx = 0;
      audio.stopBgm();
      audio.flag();
      addScore(Math.floor(timeLeft / 10) * 50);
    }

    if (invuln > 0) invuln--;
    if (player.star > 0) player.star--;
  }

  function updateEnemy(e) {
    if (e.squashed > 0) {
      e.squashed--;
      return;
    }
    if (e.dead) return;

    e.vy += GRAVITY;
    if (e.vy > MAX_FALL) e.vy = MAX_FALL;

    e.x += e.vx;
    let hits = rectTiles(e.x, e.y, e.w, e.h);
    for (const h of hits) {
      const tileLeft = h.tx * TILE;
      const tileRight = tileLeft + TILE;
      if (e.vx > 0) e.x = tileLeft - e.w;
      else e.x = tileRight;
      e.vx *= -1;
    }

    e.y += e.vy;
    hits = rectTiles(e.x, e.y, e.w, e.h);
    for (const h of hits) {
      const tileTop = h.ty * TILE;
      if (e.vy > 0) {
        e.y = tileTop - e.h;
        e.vy = 0;
      }
    }

    if (e.y > level.H * TILE) e.dead = true;
    e.frame += 0.1;

    // Player collision
    if (player.dead || player.flagDone) return;
    if (aabb(player, e)) {
      if (player.star > 0) {
        e.dead = true;
        e.squashed = 1;
        e.vy = -3;
        addScore(100, e.x, e.y);
        audio.stomp();
      } else if (player.vy > 0 && player.y + player.h - e.y < 10) {
        stompEnemy(e);
      } else {
        killPlayer();
      }
    }
  }

  function aabb(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function updateItems() {
    for (const it of items) {
      if (it.type === "coinPop") {
        it.y += it.vy;
        it.vy += 0.2;
        it.life--;
      } else if (it.type === "mushroom") {
        if (it.emerging > 0) {
          it.y -= 0.6;
          it.emerging--;
          continue;
        }
        it.vy += GRAVITY;
        it.x += it.vx;
        let hits = rectTiles(it.x, it.y, it.w, it.h);
        for (const h of hits) {
          if (it.vx > 0) it.x = h.tx * TILE - it.w;
          else it.x = h.tx * TILE + TILE;
          it.vx *= -1;
        }
        it.y += it.vy;
        hits = rectTiles(it.x, it.y, it.w, it.h);
        for (const h of hits) {
          if (it.vy > 0) {
            it.y = h.ty * TILE - it.h;
            it.vy = 0;
          }
        }
        if (aabb(player, it) && !player.dead) {
          it.life = 0;
          if (!player.big) {
            player.big = true;
            player.h = 24;
            player.y -= 9;
            addScore(1000, player.x, player.y);
            audio.powerup();
          } else {
            addScore(1000, player.x, player.y);
            audio.coin();
          }
        }
      }
    }
    items = items.filter((it) => (it.life == null ? true : it.life > 0) && it.y < 400);
    // mushrooms without life: remove if fallen
    items = items.filter((it) => !(it.type === "mushroom" && it.y > level.H * TILE + 40));
  }

  function updateParticles() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.life--;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const f of floatTexts) {
      f.y -= 0.6;
      f.life--;
    }
    floatTexts = floatTexts.filter((f) => f.life > 0);

    for (const b of bumpBlocks) {
      b.offset += b.vy;
      b.vy += 0.35;
      if (b.offset >= 0) {
        b.offset = 0;
        b.done = true;
      }
    }
    bumpBlocks = bumpBlocks.filter((b) => !b.done);
  }

  function updateHud() {
    hud.score.textContent = String(score).padStart(6, "0");
    hud.coins.textContent = "×" + String(coins).padStart(2, "0");
    hud.time.textContent = String(Math.max(0, Math.ceil(timeLeft)));
    hud.lives.textContent = "×" + lives;
  }

  function update(dt) {
    animTick++;

    if (state === "dead") {
      updatePlayer();
      updateParticles();
      const target = player.x - VIEW_W * 0.35;
      cameraX += (target - cameraX) * 0.15;
      cameraX = Math.max(0, Math.min(cameraX, level.W * TILE - VIEW_W));
      updateHud();
      return;
    }

    if (state !== "play") return;

    timeAcc += dt;
    if (timeAcc >= 500) {
      timeAcc = 0;
      timeLeft--;
      if (timeLeft <= 0) {
        timeLeft = 0;
        killPlayer();
      }
    }

    updatePlayer();
    for (const e of enemies) updateEnemy(e);
    updateItems();
    updateParticles();

    // Camera
    const target = player.x - VIEW_W * 0.35;
    cameraX += (target - cameraX) * 0.15;
    cameraX = Math.max(0, Math.min(cameraX, level.W * TILE - VIEW_W));

    updateHud();
  }

  // ---------- Drawing ----------
  function bumpOffset(tx, ty) {
    const b = bumpBlocks.find((x) => x.tx === tx && x.ty === ty);
    return b ? b.offset : 0;
  }

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  function drawCloud(cx, cy) {
    ctx.fillStyle = C.cloud;
    drawRect(cx, cy + 4, 32, 8);
    drawRect(cx + 8, cy, 16, 8);
    drawRect(cx + 4, cy + 2, 8, 6);
    drawRect(cx + 20, cy + 2, 8, 6);
  }

  function drawHill(hx) {
    const baseY = (level.H - 1) * TILE;
    ctx.fillStyle = C.hill;
    // simple stepped hill
    for (let i = 0; i < 5; i++) {
      drawRect(hx + i * 8, baseY - (i < 3 ? (i + 1) * 8 : (5 - i) * 8), 16, (i < 3 ? (i + 1) * 8 : (5 - i) * 8));
    }
    ctx.fillStyle = C.hillDark;
    drawRect(hx + 16, baseY - 16, 4, 4);
  }

  function drawBush(bx) {
    const baseY = (level.H - 1) * TILE;
    ctx.fillStyle = C.bush;
    drawRect(bx, baseY - 8, 32, 8);
    drawRect(bx + 8, baseY - 14, 16, 8);
  }

  function drawTile(t, sx, sy) {
    if (t === T.EMPTY || t === T.FLAGPOLE || t === T.FLAGTOP) return;
    if (t === T.GROUND) {
      drawRect(sx, sy, TILE, TILE, C.ground);
      drawRect(sx, sy, TILE, 4, C.groundTop);
      // speckles
      ctx.fillStyle = C.brickDark;
      drawRect(sx + 3, sy + 8, 2, 2);
      drawRect(sx + 10, sy + 11, 2, 2);
    } else if (t === T.BRICK) {
      drawRect(sx, sy, TILE, TILE, C.brick);
      ctx.fillStyle = C.brickDark;
      drawRect(sx, sy + 7, TILE, 1);
      drawRect(sx + 7, sy, 1, 7);
      drawRect(sx + 7, sy + 8, 1, 8);
      ctx.fillStyle = "#f8a060";
      drawRect(sx, sy, TILE, 1);
    } else if (t === T.Q || t === T.Q_EMPTY) {
      const col = t === T.Q ? C.qBlock : "#a0a0a0";
      drawRect(sx, sy, TILE, TILE, col);
      drawRect(sx + 1, sy + 1, TILE - 2, TILE - 2, t === T.Q ? C.qDark : "#707070");
      drawRect(sx + 2, sy + 2, TILE - 4, TILE - 4, col);
      if (t === T.Q) {
        // ?
        const blink = Math.floor(animTick / 20) % 2 === 0;
        ctx.fillStyle = blink ? C.white : "#d0a020";
        drawRect(sx + 5, sy + 3, 6, 2);
        drawRect(sx + 9, sy + 5, 2, 3);
        drawRect(sx + 7, sy + 8, 2, 2);
        drawRect(sx + 7, sy + 11, 2, 2);
      } else {
        ctx.fillStyle = "#505050";
        drawRect(sx + 6, sy + 6, 4, 4);
      }
      // rivets
      ctx.fillStyle = C.white;
      drawRect(sx + 1, sy + 1, 2, 2);
      drawRect(sx + 13, sy + 1, 2, 2);
      drawRect(sx + 1, sy + 13, 2, 2);
      drawRect(sx + 13, sy + 13, 2, 2);
    } else if (t === T.HARD) {
      drawRect(sx, sy, TILE, TILE, "#c0c0c0");
      drawRect(sx + 1, sy + 1, TILE - 2, TILE - 2, "#e0e0e0");
      drawRect(sx + 2, sy + 2, TILE - 4, TILE - 4, "#a8a8a8");
    } else if (t === T.PIPE_TL || t === T.PIPE_TR || t === T.PIPE_BL || t === T.PIPE_BR) {
      const left = t === T.PIPE_TL || t === T.PIPE_BL;
      const top = t === T.PIPE_TL || t === T.PIPE_TR;
      if (top) {
        drawRect(sx - (left ? 1 : 0), sy, TILE + 1, TILE, C.pipe);
        drawRect(sx - (left ? 1 : 0), sy, TILE + 1, 3, C.pipeLip);
        drawRect(sx + (left ? 2 : 0), sy + 3, TILE - 2, TILE - 3, C.pipeDark);
      } else {
        drawRect(sx, sy, TILE, TILE, C.pipe);
        drawRect(sx + (left ? 2 : 0), sy, TILE - 2, TILE, C.pipeDark);
      }
      if (left) drawRect(sx, sy, 2, TILE, C.pipeLip);
      else drawRect(sx + TILE - 2, sy, 2, TILE, "#004c00");
    }
  }

  function drawFlag() {
    const tx = 198;
    const baseY = (level.H - 1) * TILE;
    const sx = tx * TILE - cameraX;
    // pole
    for (let y = 1; y <= 6; y++) {
      const sy = (level.H - 1 - y) * TILE;
      drawRect(sx + 6, sy - cameraY(), 2, TILE, "#fcfcfc");
    }
    // ball
    drawRect(sx + 4, 1 * TILE - cameraY(), 6, 6, C.coin);
    // flag
    const flagY = player.flagDone
      ? Math.min(player.y, baseY - TILE - 8)
      : 2 * TILE;
    ctx.fillStyle = C.flag;
    drawRect(sx + 8, flagY - cameraY(), 14, 10);
    ctx.fillStyle = C.white;
    drawRect(sx + 10, flagY - cameraY() + 2, 3, 3);
  }

  function cameraY() {
    return 0;
  }

  function drawMario(p) {
    if (invuln > 0 && Math.floor(invuln / 2) % 2 === 0 && !p.dead) return;
    const x = Math.floor(p.x - cameraX);
    const y = Math.floor(p.y);
    const flip = p.facing < 0;
    ctx.save();
    if (flip) {
      ctx.translate(x + p.w, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    const big = p.big;
    const h = big ? 24 : 15;
    const running = Math.abs(p.vx) > 0.3 && p.onGround;
    const frame = Math.floor(p.walkFrame) % 3;
    const jump = !p.onGround;

    // Cap
    ctx.fillStyle = C.marioRed;
    drawRect(2, 0, 10, 3);
    drawRect(1, 2, 12, 2);
    // Face
    ctx.fillStyle = C.marioSkin;
    drawRect(3, 4, 9, 5);
    // Hair / sideburns
    ctx.fillStyle = C.marioBrown;
    drawRect(2, 4, 2, 4);
    drawRect(3, 3, 3, 1);
    // Eye
    ctx.fillStyle = C.black;
    drawRect(9, 5, 2, 2);
    // Mustache
    ctx.fillStyle = C.marioBrown;
    drawRect(8, 7, 5, 1);
    // Body overalls
    ctx.fillStyle = C.marioBlue;
    if (big) {
      drawRect(3, 10, 8, 8);
      ctx.fillStyle = C.marioRed;
      drawRect(2, 9, 4, 5);
      drawRect(8, 9, 4, 5);
      ctx.fillStyle = C.marioBlue;
      // legs
      if (jump) {
        drawRect(3, 18, 4, 6);
        drawRect(8, 18, 4, 6);
      } else if (running) {
        if (frame === 0) {
          drawRect(2, 18, 4, 6);
          drawRect(9, 18, 4, 6);
        } else if (frame === 1) {
          drawRect(4, 18, 4, 6);
          drawRect(7, 18, 4, 6);
        } else {
          drawRect(3, 18, 5, 6);
          drawRect(8, 18, 4, 5);
        }
      } else {
        drawRect(3, 18, 4, 6);
        drawRect(8, 18, 4, 6);
      }
    } else {
      drawRect(3, 9, 8, 3);
      ctx.fillStyle = C.marioRed;
      drawRect(2, 9, 3, 3);
      drawRect(9, 9, 3, 3);
      ctx.fillStyle = C.marioBlue;
      if (jump) {
        drawRect(3, 12, 4, 3);
        drawRect(8, 12, 4, 3);
      } else if (running) {
        if (frame % 2 === 0) {
          drawRect(2, 12, 4, 3);
          drawRect(9, 12, 4, 3);
        } else {
          drawRect(4, 12, 5, 3);
          drawRect(7, 12, 4, 3);
        }
      } else {
        drawRect(3, 12, 4, 3);
        drawRect(8, 12, 4, 3);
      }
    }
    // Shoes
    ctx.fillStyle = C.marioBrown;
    if (big) {
      drawRect(2, h - 2, 5, 2);
      drawRect(8, h - 2, 5, 2);
    } else {
      drawRect(2, 14, 5, 2);
      drawRect(8, 14, 5, 2);
    }

    // Dead flip
    if (p.dead) {
      ctx.restore();
      return;
    }
    ctx.restore();
  }

  function drawGoomba(e) {
    if (e.dead && e.squashed <= 0) return;
    const x = Math.floor(e.x - cameraX);
    const y = Math.floor(e.y);
    if (e.squashed > 0) {
      drawRect(x, y + 10, 14, 4, C.goomba);
      drawRect(x + 1, y + 10, 12, 2, C.goombaDark);
      return;
    }
    // body
    drawRect(x + 1, y + 2, 12, 10, C.goomba);
    drawRect(x + 2, y, 10, 4, C.goomba);
    // feet
    const walk = Math.floor(e.frame) % 2;
    ctx.fillStyle = C.goombaDark;
    if (walk) {
      drawRect(x, y + 12, 6, 2);
      drawRect(x + 8, y + 12, 6, 2);
    } else {
      drawRect(x + 1, y + 12, 6, 2);
      drawRect(x + 7, y + 12, 6, 2);
    }
    // eyes
    ctx.fillStyle = C.white;
    drawRect(x + 3, y + 4, 3, 4);
    drawRect(x + 8, y + 4, 3, 4);
    ctx.fillStyle = C.black;
    drawRect(x + 4, y + 5, 2, 3);
    drawRect(x + 9, y + 5, 2, 3);
    // brows
    ctx.fillStyle = C.goombaDark;
    drawRect(x + 2, y + 3, 4, 1);
    drawRect(x + 8, y + 3, 4, 1);
  }

  function drawMushroom(it) {
    const x = Math.floor(it.x - cameraX);
    const y = Math.floor(it.y);
    ctx.fillStyle = C.marioRed;
    drawRect(x + 1, y, 12, 8);
    ctx.fillStyle = C.white;
    drawRect(x + 3, y + 2, 3, 3);
    drawRect(x + 9, y + 2, 2, 2);
    ctx.fillStyle = C.marioSkin;
    drawRect(x + 3, y + 8, 8, 6);
    ctx.fillStyle = C.black;
    drawRect(x + 5, y + 10, 2, 2);
    drawRect(x + 8, y + 10, 2, 2);
  }

  function drawCoinPop(it) {
    const x = Math.floor(it.x - cameraX);
    const y = Math.floor(it.y);
    const spin = Math.floor(animTick / 4) % 4;
    const w = spin === 1 || spin === 3 ? 4 : 8;
    drawRect(x + (8 - w) / 2, y, w, 12, C.coin);
    if (w > 4) {
      ctx.fillStyle = "#fff8a0";
      drawRect(x + 3, y + 2, 2, 8);
    }
  }

  function drawCastle() {
    const x = 205 * TILE - cameraX;
    const base = (level.H - 1) * TILE;
    ctx.fillStyle = "#686868";
    drawRect(x, base - 40, 40, 40);
    drawRect(x + 8, base - 56, 8, 16);
    drawRect(x + 24, base - 56, 8, 16);
    ctx.fillStyle = "#404040";
    drawRect(x + 14, base - 20, 12, 20);
    ctx.fillStyle = C.black;
    drawRect(x + 16, base - 16, 8, 16);
    // bricks
    ctx.fillStyle = "#808080";
    for (let i = 0; i < 5; i++) drawRect(x, base - 8 * (i + 1), 40, 1);
  }

  function render() {
    // logical scale
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Sky
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Decor
    for (const [cx, cy] of level.decor.clouds) {
      drawCloud(cx * TILE - cameraX * 0.6, cy * TILE + 8);
    }
    for (const [hx] of level.decor.hills) {
      drawHill(hx * TILE - cameraX);
    }
    for (const [bx] of level.decor.bushes) {
      drawBush(bx * TILE - cameraX);
    }

    // Tiles in view
    const tx0 = Math.floor(cameraX / TILE);
    const tx1 = Math.min(level.W - 1, tx0 + Math.ceil(VIEW_W / TILE) + 1);
    for (let ty = 0; ty < level.H; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = level.map[ty][tx];
        if (t === T.EMPTY) continue;
        const off = bumpOffset(tx, ty);
        drawTile(t, tx * TILE - cameraX, ty * TILE + off);
      }
    }

    drawFlag();
    drawCastle();

    for (const it of items) {
      if (it.type === "mushroom") drawMushroom(it);
      else if (it.type === "coinPop") drawCoinPop(it);
    }
    for (const e of enemies) drawGoomba(e);
    drawMario(player);

    for (const p of particles) {
      drawRect(p.x - cameraX, p.y, 3, 3, p.color);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "5px monospace";
    for (const f of floatTexts) {
      ctx.globalAlpha = Math.min(1, f.life / 20);
      ctx.fillText(f.text, f.x - cameraX, f.y);
      ctx.globalAlpha = 1;
    }

    // Dead overlay flash
    if (player.dead && state === "dead") {
      // nothing extra; overlay handles message
    }
  }

  // ---------- Loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(40, now - last);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  resetEnemies();
  updateHud();
  requestAnimationFrame(frame);

  // Expose for debug
  window.__mario = { player, level, audio, state: () => state };
})();
