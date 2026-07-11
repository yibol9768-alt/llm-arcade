"use strict";

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GROUND_Y = 610;
  const WORLD_WIDTH = 11200;
  const GRAVITY = 2300;

  ctx.imageSmoothingEnabled = false;

  const ui = {
    hud: document.getElementById("hud"),
    score: document.getElementById("scoreText"),
    coins: document.getElementById("coinText"),
    time: document.getElementById("timeText"),
    lives: document.getElementById("lifeText"),
    start: document.getElementById("startScreen"),
    pause: document.getElementById("pauseScreen"),
    end: document.getElementById("endScreen"),
    startButton: document.getElementById("startButton"),
    pauseButton: document.getElementById("pauseButton"),
    resumeButton: document.getElementById("resumeButton"),
    restartFromPauseButton: document.getElementById("restartFromPauseButton"),
    restartButton: document.getElementById("restartButton"),
    soundButton: document.getElementById("soundButton"),
    soundIcon: document.getElementById("soundIcon"),
    soundLabel: document.getElementById("soundLabel"),
    toast: document.getElementById("toast"),
    endTitle: document.getElementById("endTitle"),
    endEyebrow: document.getElementById("endEyebrow"),
    endBadge: document.getElementById("endBadge"),
    finalScore: document.getElementById("finalScore"),
    finalCoins: document.getElementById("finalCoins"),
    highScore: document.getElementById("highScore"),
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
  const pad = (value, length) => String(Math.max(0, Math.floor(value))).padStart(length, "0");
  const overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const visible = (x, w = 0, margin = 160) => x + w > camera - margin && x < camera + WIDTH + margin;

  function safeStoreGet(key, fallback) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function safeStoreSet(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // The game remains fully playable when storage is unavailable.
    }
  }

  class AudioEngine {
    constructor() {
      this.context = null;
      this.master = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.musicTimer = null;
      this.musicStep = 0;
      this.wantMusic = false;
      this.muted = safeStoreGet("sol56-muted", "false") === "true";
      this.updateButton();
    }

    unlock() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.musicBus = this.context.createGain();
        this.sfxBus = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.72;
        this.musicBus.gain.value = 0.32;
        this.sfxBus.gain.value = 0.58;
        this.musicBus.connect(this.master);
        this.sfxBus.connect(this.master);
        this.master.connect(this.context.destination);
      }
      if (this.context.state === "suspended") this.context.resume();
      if (this.wantMusic && !this.muted) this.startMusic();
    }

    setMuted(next) {
      this.muted = Boolean(next);
      safeStoreSet("sol56-muted", this.muted);
      if (this.context && this.master) {
        this.master.gain.cancelScheduledValues(this.context.currentTime);
        this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.context.currentTime, 0.025);
      }
      if (!this.muted) {
        this.unlock();
        if (this.wantMusic) this.startMusic();
        this.sfx("unmute");
      }
      this.updateButton();
    }

    toggle() {
      this.setMuted(!this.muted);
    }

    updateButton() {
      ui.soundIcon.textContent = this.muted ? "×" : "♪";
      ui.soundLabel.textContent = this.muted ? "静音" : "声音";
      ui.soundButton.setAttribute("aria-label", this.muted ? "开启声音" : "关闭声音");
      ui.soundButton.dataset.muted = String(this.muted);
    }

    tone(frequency, duration, options = {}) {
      if (!this.context || this.muted || !frequency) return;
      const now = this.context.currentTime + (options.delay || 0);
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = options.type || "square";
      oscillator.frequency.setValueAtTime(frequency, now);
      if (options.slide) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(30, options.slide),
          now + duration,
        );
      }
      const peak = options.volume ?? 0.12;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(options.music ? this.musicBus : this.sfxBus);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.025);
    }

    noise(duration = 0.12, volume = 0.12) {
      if (!this.context || this.muted) return;
      const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(this.sfxBus);
      source.start();
    }

    sfx(name) {
      if (!this.context || this.muted) return;
      switch (name) {
        case "jump":
          this.tone(260, 0.12, { slide: 510, volume: 0.16, type: "square" });
          break;
        case "coin":
          this.tone(988, 0.07, { volume: 0.12 });
          this.tone(1319, 0.11, { delay: 0.065, volume: 0.12 });
          break;
        case "stomp":
          this.tone(190, 0.09, { slide: 85, volume: 0.18 });
          break;
        case "bump":
          this.tone(115, 0.07, { slide: 80, volume: 0.14 });
          break;
        case "break":
          this.noise(0.13, 0.16);
          this.tone(120, 0.11, { slide: 55, volume: 0.12 });
          break;
        case "powerup":
          [523, 659, 784, 1047].forEach((note, index) =>
            this.tone(note, 0.13, { delay: index * 0.08, volume: 0.11 }),
          );
          break;
        case "powerupAppears":
          [392, 494, 587, 784].forEach((note, index) =>
            this.tone(note, 0.1, { delay: index * 0.055, volume: 0.09 }),
          );
          break;
        case "fire":
          this.tone(780, 0.08, { slide: 290, volume: 0.11, type: "sawtooth" });
          break;
        case "kick":
          this.tone(240, 0.08, { slide: 110, volume: 0.17 });
          break;
        case "hurt":
          this.tone(420, 0.2, { slide: 110, volume: 0.17, type: "sawtooth" });
          break;
        case "death":
          [392, 330, 262, 196, 131].forEach((note, index) =>
            this.tone(note, 0.2, { delay: index * 0.16, volume: 0.13, type: "square" }),
          );
          break;
        case "checkpoint":
          [659, 784, 988].forEach((note, index) =>
            this.tone(note, 0.13, { delay: index * 0.1, volume: 0.11 }),
          );
          break;
        case "goal":
          [523, 659, 784, 1047, 1319].forEach((note, index) =>
            this.tone(note, 0.2, { delay: index * 0.14, volume: 0.14 }),
          );
          break;
        case "unmute":
          this.tone(660, 0.08, { volume: 0.08 });
          this.tone(880, 0.1, { delay: 0.07, volume: 0.08 });
          break;
        default:
          break;
      }
    }

    startMusic() {
      this.wantMusic = true;
      if (!this.context || this.muted || this.musicTimer) return;
      this.musicStep = this.musicStep % 32;
      const melody = [
        72, null, 76, 79, 76, 74, 72, null,
        69, 72, 74, 76, 74, 72, 69, null,
        67, 69, 72, 74, 76, 79, 76, 74,
        72, 69, 67, 69, 72, null, 67, null,
      ];
      const bass = [48, 48, 43, 43, 45, 45, 41, 43];
      const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);
      const tick = () => {
        this.musicTimer = null;
        if (!this.wantMusic || this.muted || !this.context) return;
        const step = this.musicStep;
        const note = melody[step % melody.length];
        if (note) this.tone(midiToHz(note), 0.105, { music: true, volume: 0.115, type: "square" });
        if (step % 4 === 0) {
          this.tone(midiToHz(bass[(step / 4) % bass.length]), 0.22, {
            music: true,
            volume: 0.1,
            type: "triangle",
          });
        }
        if (step % 2 === 1) this.tone(110, 0.035, { music: true, volume: 0.025, type: "square" });
        this.musicStep += 1;
        this.musicTimer = window.setTimeout(tick, 138);
      };
      tick();
    }

    stopMusic() {
      this.wantMusic = false;
      if (this.musicTimer) window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  const audio = new AudioEngine();
  const keys = new Set();
  const pressed = new Set();

  let mode = "title";
  let previousMode = "playing";
  let player = null;
  let solids = [];
  let coins = [];
  let enemies = [];
  let powerups = [];
  let fireballs = [];
  let particles = [];
  let floatingTexts = [];
  let camera = 0;
  let cameraShake = 0;
  let ambientTime = 0;
  let remainingTime = 300;
  let score = 0;
  let coinCount = 0;
  let lives = 3;
  let highScore = Number(safeStoreGet("sol56-high-score", "0")) || 0;
  let checkpoint = 120;
  let checkpointIndex = 0;
  let deathTimer = 0;
  let goalTimer = 0;
  let goalFlagY = 238;
  let toastTimer = 0;
  let solidId = 0;
  let lastFrame = performance.now();

  const goal = { x: 10615, y: 208, poleBottom: GROUND_Y, castleX: 10820 };
  const checkpointMarks = [120, 3650, 7480];
  const enemyLayout = [
    ["goomba", 930], ["goomba", 1325], ["koopa", 2050], ["goomba", 2730],
    ["goomba", 3560], ["koopa", 4290], ["goomba", 4550], ["goomba", 5150],
    ["koopa", 5700], ["goomba", 6600], ["goomba", 6740], ["koopa", 7420],
    ["goomba", 8320], ["koopa", 9050], ["goomba", 9440], ["goomba", 9570],
  ];

  function showOverlay(element, shouldShow) {
    element.classList.toggle("is-visible", shouldShow);
    element.setAttribute("aria-hidden", String(!shouldShow));
  }

  function updateHud() {
    ui.score.textContent = pad(score, 6);
    ui.coins.textContent = pad(coinCount, 2);
    ui.time.textContent = pad(remainingTime, 3);
    ui.lives.textContent = pad(lives, 2);
    canvas.dataset.gameState = mode;
    canvas.dataset.playerX = player ? String(Math.round(player.x)) : "0";
    canvas.dataset.score = String(score);
  }

  function toast(message, seconds = 1.8) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    toastTimer = seconds;
  }

  function addScore(points, x, y) {
    score += points;
    highScore = Math.max(highScore, score);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      floatingTexts.push({ x, y, text: String(points), life: 0.8, vy: -42 });
    }
    updateHud();
  }

  function solid(x, y, w, h, type = "ground", extra = {}) {
    const item = {
      id: ++solidId,
      x,
      y,
      w,
      h,
      type,
      destroyed: false,
      used: false,
      bump: 0,
      content: null,
      ...extra,
    };
    solids.push(item);
    return item;
  }

  function addGround(x1, x2) {
    solid(x1, GROUND_Y, x2 - x1, HEIGHT - GROUND_Y + 120, "ground");
  }

  function addBlockRow(x, y, count, pattern = "brick") {
    for (let i = 0; i < count; i += 1) {
      const token = Array.isArray(pattern) ? pattern[i % pattern.length] : pattern;
      if (token === "gap") continue;
      const block = solid(x + i * 48, y, 48, 48, token === "question" ? "question" : "brick");
      if (token === "question") block.content = i % 3 === 1 ? "power" : "coin";
    }
  }

  function addPipe(x, height, color = "green") {
    solid(x, GROUND_Y - height, 96, height, "pipe", { color });
  }

  function addCoin(x, y, hidden = false) {
    coins.push({ x, y, w: 26, h: 36, collected: false, phase: Math.random() * Math.PI * 2, hidden });
  }

  function addCoinArc(startX, centerY, count, spacing, height) {
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      addCoin(startX + i * spacing, centerY - Math.sin(t * Math.PI) * height);
    }
  }

  function addEnemy(kind, x, y = GROUND_Y) {
    const sizes = kind === "koopa" ? { w: 42, h: 58 } : { w: 46, h: 42 };
    enemies.push({
      kind,
      x,
      y: y - sizes.h,
      w: sizes.w,
      h: sizes.h,
      vx: kind === "koopa" ? -62 : -48,
      vy: 0,
      state: "walk",
      dead: false,
      timer: 0,
      grounded: false,
      facing: -1,
      anim: Math.random() * 5,
    });
  }

  function buildLevel() {
    solids = [];
    coins = [];
    enemies = [];
    powerups = [];
    fireballs = [];
    particles = [];
    floatingTexts = [];
    solidId = 0;

    [
      [0, 1660],
      [1810, 3150],
      [3300, 4700],
      [4880, 6200],
      [6380, 7850],
      [8010, WORLD_WIDTH],
    ].forEach(([from, to]) => addGround(from, to));

    addBlockRow(610, 430, 5, ["brick", "question", "brick", "question", "brick"]);
    addBlockRow(850, 285, 3, ["question", "brick", "question"]);
    addPipe(1160, 96);
    addPipe(1430, 144);
    addCoinArc(1540, 490, 6, 52, 92);

    addBlockRow(1930, 420, 4, ["question", "brick", "brick", "question"]);
    addPipe(2290, 192);
    addBlockRow(2520, 315, 6, ["brick", "question", "brick", "brick", "question", "brick"]);
    addCoinArc(2920, 455, 5, 52, 82);

    addPipe(3450, 96, "teal");
    addBlockRow(3680, 442, 8, ["brick", "brick", "question", "brick", "gap", "question", "brick", "brick"]);
    addBlockRow(3910, 282, 3, ["question", "brick", "question"]);
    addCoinArc(4480, 500, 6, 49, 110);

    addPipe(5010, 144);
    addBlockRow(5220, 398, 5, ["question", "brick", "brick", "question", "brick"]);
    addBlockRow(5510, 260, 4, ["brick", "question", "question", "brick"]);
    addPipe(5910, 214, "teal");
    addCoinArc(6080, 460, 6, 50, 95);

    addBlockRow(6500, 435, 4, ["brick", "question", "brick", "question"]);
    addPipe(6850, 128);
    addBlockRow(7100, 320, 7, ["brick", "brick", "question", "brick", "question", "brick", "brick"]);
    addCoinArc(7610, 490, 6, 50, 105);

    addPipe(8170, 176);
    addBlockRow(8400, 420, 4, ["question", "brick", "question", "brick"]);
    addBlockRow(8730, 280, 7, ["brick", "question", "brick", "brick", "question", "brick", "question"]);
    addCoinArc(9270, 430, 8, 50, 110);

    for (let step = 0; step < 5; step += 1) {
      for (let row = 0; row <= step; row += 1) {
        solid(9760 + step * 48, GROUND_Y - (row + 1) * 48, 48, 48, "stair");
      }
    }
    for (let step = 0; step < 5; step += 1) {
      for (let row = 0; row < 5 - step; row += 1) {
        solid(10096 + step * 48, GROUND_Y - (row + 1) * 48, 48, 48, "stair");
      }
    }

    [
      [520, 555], [575, 530], [630, 505], [690, 500],
      [920, 220], [980, 220], [1040, 220],
      [2040, 355], [2095, 335], [2150, 355],
      [2630, 250], [2690, 230], [2750, 250],
      [3520, 470], [3580, 445], [3640, 470],
      [4040, 215], [4100, 195], [4160, 215],
      [5350, 330], [5410, 310], [5470, 330],
      [6620, 365], [6680, 340], [6740, 365],
      [7240, 255], [7300, 235], [7360, 255],
      [8520, 350], [8580, 330], [8640, 350],
      [8880, 215], [8940, 195], [9000, 215],
      [10380, 535], [10435, 510], [10490, 535],
    ].forEach(([x, y]) => addCoin(x, y));

    enemyLayout.forEach(([kind, x]) => addEnemy(kind, x));

    const powerBlocks = solids.filter((item) => item.type === "question");
    [1, 4, 8, 12, 16, 21].forEach((index) => {
      if (powerBlocks[index]) powerBlocks[index].content = "power";
    });
  }

  function createPlayer(x = checkpoint) {
    return {
      x,
      y: GROUND_Y - 58,
      w: 44,
      h: 58,
      vx: 0,
      vy: 0,
      grounded: false,
      coyote: 0,
      jumpBuffer: 0,
      facing: 1,
      power: 0,
      invulnerable: 0,
      fireCooldown: 0,
      anim: 0,
      previousY: GROUND_Y - 58,
      previousX: x,
    };
  }

  function resetPlayerAfterDeath() {
    enemies = [];
    enemyLayout
      .filter(([, x]) => x > checkpoint + 400)
      .forEach(([kind, x]) => addEnemy(kind, x));
    fireballs = [];
    player = createPlayer(checkpoint);
    camera = clamp(checkpoint - WIDTH * 0.28, 0, WORLD_WIDTH - WIDTH);
    mode = "playing";
    remainingTime = Math.max(120, remainingTime);
    deathTimer = 0;
    audio.startMusic();
    toast(checkpointIndex > 0 ? "从检查点继续！" : "再试一次！", 1.35);
    updateHud();
  }

  function startGame() {
    audio.unlock();
    buildLevel();
    score = 0;
    coinCount = 0;
    lives = 3;
    remainingTime = 300;
    checkpoint = checkpointMarks[0];
    checkpointIndex = 0;
    camera = 0;
    cameraShake = 0;
    goalTimer = 0;
    goalFlagY = 238;
    player = createPlayer();
    mode = "playing";
    showOverlay(ui.start, false);
    showOverlay(ui.pause, false);
    showOverlay(ui.end, false);
    ui.hud.style.opacity = "1";
    audio.startMusic();
    toast("WORLD 5.6–1 · 出发！", 2.1);
    updateHud();
  }

  function togglePause(force) {
    if (!["playing", "paused"].includes(mode)) return;
    const shouldPause = typeof force === "boolean" ? force : mode === "playing";
    if (shouldPause) {
      previousMode = mode;
      mode = "paused";
      keys.clear();
      showOverlay(ui.pause, true);
      audio.stopMusic();
    } else {
      mode = previousMode === "playing" ? "playing" : previousMode;
      showOverlay(ui.pause, false);
      audio.unlock();
      audio.startMusic();
      lastFrame = performance.now();
    }
    updateHud();
  }

  function endGame(won) {
    mode = won ? "won" : "gameover";
    audio.stopMusic();
    highScore = Math.max(highScore, score);
    safeStoreSet("sol56-high-score", highScore);
    ui.endEyebrow.textContent = won ? "COURSE CLEAR!" : "TRY AGAIN!";
    ui.endTitle.textContent = won ? "漂亮通关！" : "冒险还没结束";
    ui.endBadge.textContent = won ? "★" : "×";
    ui.finalScore.textContent = pad(score, 6);
    ui.finalCoins.textContent = pad(coinCount, 2);
    ui.highScore.textContent = pad(highScore, 6);
    showOverlay(ui.end, true);
    updateHud();
  }

  function setPower(nextPower) {
    const next = clamp(nextPower, 0, 2);
    if (next === player.power) return;
    const bottom = player.y + player.h;
    player.power = next;
    player.h = next > 0 ? 74 : 58;
    player.y = bottom - player.h;
  }

  function spawnParticles(x, y, color, count = 8, speed = 240, options = {}) {
    for (let i = 0; i < count; i += 1) {
      const angle = options.radial === false
        ? lerp(-Math.PI * 0.9, -Math.PI * 0.1, Math.random())
        : Math.random() * Math.PI * 2;
      const magnitude = speed * (0.4 + Math.random() * 0.7);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * magnitude,
        vy: Math.sin(angle) * magnitude,
        life: options.life || 0.65 + Math.random() * 0.35,
        maxLife: options.life || 1,
        size: options.size || 4 + Math.random() * 8,
        color,
        gravity: options.gravity ?? 620,
        shape: options.shape || "square",
      });
    }
  }

  function hitBlock(block) {
    if (block.destroyed || block.bump > 0) return;
    if (block.type === "question") {
      if (block.used) {
        audio.sfx("bump");
        block.bump = 0.22;
        return;
      }
      block.used = true;
      block.bump = 0.28;
      if (block.content === "power") {
        spawnPowerup(block);
      } else {
        collectCoinAt(block.x + block.w / 2, block.y - 10, true);
      }
      return;
    }
    if (block.type === "brick") {
      block.bump = 0.22;
      if (player.power > 0) {
        block.destroyed = true;
        cameraShake = Math.max(cameraShake, 8);
        audio.sfx("break");
        addScore(50, block.x + 18, block.y - 8);
        [
          [block.x + 8, block.y + 8, -170, -410],
          [block.x + 34, block.y + 8, 170, -410],
          [block.x + 8, block.y + 34, -120, -280],
          [block.x + 34, block.y + 34, 120, -280],
        ].forEach(([x, y, vx, vy]) => {
          particles.push({
            x, y, vx, vy, life: 0.9, maxLife: 0.9, size: 14,
            color: "#d86b2c", gravity: 1100, shape: "brick",
          });
        });
      } else {
        audio.sfx("bump");
      }
    }
  }

  function spawnPowerup(block) {
    const kind = player.power === 0 ? "mushroom" : "flower";
    powerups.push({
      kind,
      x: block.x + 5,
      y: block.y,
      w: 38,
      h: 40,
      vx: kind === "mushroom" ? 78 : 0,
      vy: 0,
      targetY: block.y - 42,
      state: "emerging",
      phase: 0,
      dead: false,
    });
    audio.sfx("powerupAppears");
  }

  function collectCoinAt(x, y, fromBlock = false) {
    coinCount += 1;
    addScore(100, x - 10, y - 20);
    audio.sfx("coin");
    spawnParticles(x, y, "#ffe56b", 7, 150, { gravity: 260, size: 5 });
    if (fromBlock) {
      floatingTexts.push({ x: x - 5, y: y - 8, text: "●", life: 0.55, vy: -120, coin: true });
    }
    if (coinCount > 0 && coinCount % 25 === 0) {
      lives += 1;
      toast("1 UP！额外生命", 1.5);
      audio.sfx("powerup");
    }
    updateHud();
  }

  function moveWithSolids(entity, dt, canHitBlocks = false) {
    entity.previousX = entity.x;
    entity.previousY = entity.y;
    entity.x += entity.vx * dt;
    let hitWall = false;
    for (const block of solids) {
      if (block.destroyed || !overlap(entity, block)) continue;
      if (entity.vx > 0) entity.x = block.x - entity.w;
      else if (entity.vx < 0) entity.x = block.x + block.w;
      entity.vx = 0;
      hitWall = true;
    }

    entity.y += entity.vy * dt;
    entity.grounded = false;
    for (const block of solids) {
      if (block.destroyed || !overlap(entity, block)) continue;
      const previousBottom = entity.previousY + entity.h;
      const previousTop = entity.previousY;
      if (entity.vy >= 0 && previousBottom <= block.y + 14) {
        entity.y = block.y - entity.h;
        entity.vy = 0;
        entity.grounded = true;
      } else if (entity.vy < 0 && previousTop >= block.y + block.h - 14) {
        entity.y = block.y + block.h;
        entity.vy = 0;
        if (canHitBlocks) hitBlock(block);
      } else {
        const leftPenetration = entity.x + entity.w - block.x;
        const rightPenetration = block.x + block.w - entity.x;
        if (leftPenetration < rightPenetration) entity.x -= leftPenetration;
        else entity.x += rightPenetration;
      }
    }
    return hitWall;
  }

  function isDown(...codes) {
    return codes.some((code) => keys.has(code));
  }

  function consumePress(...codes) {
    for (const code of codes) {
      if (pressed.has(code)) {
        pressed.delete(code);
        return true;
      }
    }
    return false;
  }

  function updatePlayer(dt) {
    const left = isDown("ArrowLeft", "KeyA");
    const right = isDown("ArrowRight", "KeyD");
    const running = isDown("ShiftLeft", "ShiftRight");
    const axis = (right ? 1 : 0) - (left ? 1 : 0);
    const maxSpeed = running ? 430 : 330;
    const acceleration = player.grounded ? 2200 : 1350;

    if (axis !== 0) {
      player.vx += axis * acceleration * dt;
      player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
      player.facing = axis;
    } else {
      const drag = player.grounded ? 0.00045 ** dt : 0.07 ** dt;
      player.vx *= drag;
      if (Math.abs(player.vx) < 2) player.vx = 0;
    }

    if (consumePress("Space", "KeyW", "KeyZ", "ArrowUp")) player.jumpBuffer = 0.13;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? 0.1 : Math.max(0, player.coyote - dt);

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -835;
      player.grounded = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      audio.sfx("jump");
      spawnParticles(player.x + player.w / 2, player.y + player.h, "#f1cf9b", 5, 105, {
        gravity: 160,
        size: 5,
      });
    }
    if (!isDown("Space", "KeyW", "KeyZ", "ArrowUp") && player.vy < -260) player.vy += 1900 * dt;

    player.vy += GRAVITY * dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    moveWithSolids(player, dt, true);

    if (consumePress("KeyX", "KeyJ") && player.power === 2 && player.fireCooldown <= 0) {
      fireballs.push({
        x: player.x + (player.facing > 0 ? player.w - 2 : -16),
        y: player.y + 26,
        w: 18,
        h: 18,
        vx: player.facing * 620,
        vy: -160,
        life: 3,
        bounces: 0,
      });
      player.fireCooldown = 0.3;
      audio.sfx("fire");
    }

    player.x = clamp(player.x, 0, WORLD_WIDTH - player.w);
    player.anim += dt * (2 + Math.abs(player.vx) / 70);

    if (player.y > HEIGHT + 180) startDeath(true);
  }

  function updateCoins(dt) {
    for (const coin of coins) {
      if (coin.collected) continue;
      coin.phase += dt * 6;
      if (overlap(player, coin)) {
        coin.collected = true;
        collectCoinAt(coin.x + coin.w / 2, coin.y + coin.h / 2);
      }
    }
  }

  function updatePowerups(dt) {
    for (const item of powerups) {
      if (item.dead) continue;
      item.phase += dt * 5;
      if (item.state === "emerging") {
        item.y -= 44 * dt;
        if (item.y <= item.targetY) {
          item.y = item.targetY;
          item.state = "active";
        }
      } else if (item.kind === "mushroom") {
        item.vy += GRAVITY * dt;
        const direction = Math.sign(item.vx) || 1;
        const hitWall = moveWithSolids(item, dt, false);
        if (hitWall) item.vx = -direction * 78;
      }

      if (overlap(player, item)) {
        item.dead = true;
        const nextPower = item.kind === "flower" ? 2 : Math.max(1, player.power);
        setPower(nextPower);
        player.invulnerable = 0.8;
        addScore(1000, item.x, item.y - 15);
        spawnParticles(item.x + item.w / 2, item.y + item.h / 2, "#fff4a8", 18, 220, {
          gravity: 180,
          shape: "star",
          size: 7,
        });
        cameraShake = Math.max(cameraShake, 5);
        audio.sfx("powerup");
        toast(item.kind === "flower" ? "火焰能力！按 X 发射" : "SUPER SIZE！", 1.8);
      }
    }
  }

  function stompEnemy(enemy) {
    player.vy = -560;
    player.y = enemy.y - player.h + 4;
    cameraShake = Math.max(cameraShake, 5);
    audio.sfx("stomp");
    if (enemy.kind === "goomba") {
      enemy.state = "squished";
      enemy.timer = 0.38;
      enemy.vx = 0;
      addScore(200, enemy.x, enemy.y - 16);
    } else if (enemy.state === "walk") {
      const bottom = enemy.y + enemy.h;
      enemy.state = "shell";
      enemy.h = 34;
      enemy.y = bottom - enemy.h;
      enemy.vx = 0;
      addScore(200, enemy.x, enemy.y - 16);
    } else if (Math.abs(enemy.vx) < 30) {
      enemy.vx = (player.x < enemy.x ? 1 : -1) * 620;
      player.vy = -430;
      audio.sfx("kick");
      addScore(400, enemy.x, enemy.y - 16);
    } else {
      enemy.vx = 0;
      addScore(400, enemy.x, enemy.y - 16);
    }
  }

  function damagePlayer() {
    if (player.invulnerable > 0 || mode !== "playing") return;
    cameraShake = Math.max(cameraShake, 12);
    if (player.power > 0) {
      setPower(player.power - 1);
      player.invulnerable = 2.2;
      player.vy = -410;
      player.vx = -player.facing * 180;
      audio.sfx("hurt");
      toast("小心！", 0.9);
    } else {
      startDeath(false);
    }
  }

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      enemy.timer -= dt;
      enemy.anim += dt * (3 + Math.abs(enemy.vx) / 100);
      if (enemy.state === "squished") {
        if (enemy.timer <= 0) enemy.dead = true;
        continue;
      }

      enemy.vy += GRAVITY * dt;
      const direction = Math.sign(enemy.vx) || enemy.facing || -1;
      const hitWall = moveWithSolids(enemy, dt, false);
      if (hitWall) {
        const speed = enemy.state === "shell" ? 620 : enemy.kind === "koopa" ? 62 : 48;
        enemy.vx = -direction * speed;
      }
      enemy.facing = Math.sign(enemy.vx) || enemy.facing;
      if (enemy.y > HEIGHT + 180) {
        enemy.dead = true;
        continue;
      }

      if (enemy.state === "shell" && Math.abs(enemy.vx) > 100) {
        for (const other of enemies) {
          if (other === enemy || other.dead || other.state === "squished" || !overlap(enemy, other)) continue;
          other.dead = true;
          spawnParticles(other.x + other.w / 2, other.y + other.h / 2, "#f5d189", 10, 220);
          addScore(500, other.x, other.y - 15);
          audio.sfx("kick");
        }
      }

      if (mode === "playing" && overlap(player, enemy)) {
        const previousBottom = player.previousY + player.h;
        const stomp = player.vy > 120 && previousBottom <= enemy.y + Math.min(22, enemy.h * 0.55);
        if (stomp) {
          stompEnemy(enemy);
        } else if (enemy.state === "shell" && Math.abs(enemy.vx) < 30) {
          enemy.vx = (player.x < enemy.x ? 1 : -1) * 620;
          player.vx = -Math.sign(enemy.vx) * 120;
          audio.sfx("kick");
        } else {
          damagePlayer();
        }
      }
    }
  }

  function updateFireballs(dt) {
    for (const ball of fireballs) {
      if (ball.dead) continue;
      ball.life -= dt;
      ball.vy += GRAVITY * 0.72 * dt;
      ball.x += ball.vx * dt;
      for (const block of solids) {
        if (block.destroyed || !overlap(ball, block)) continue;
        ball.dead = true;
        spawnParticles(ball.x, ball.y, "#ffb52c", 6, 120, { gravity: 180, size: 5 });
        break;
      }
      if (ball.dead) continue;
      ball.y += ball.vy * dt;
      for (const block of solids) {
        if (block.destroyed || !overlap(ball, block)) continue;
        if (ball.vy > 0) {
          ball.y = block.y - ball.h;
          ball.vy = -520;
          ball.bounces += 1;
        } else {
          ball.dead = true;
        }
        break;
      }
      for (const enemy of enemies) {
        if (enemy.dead || enemy.state === "squished" || !overlap(ball, enemy)) continue;
        enemy.dead = true;
        ball.dead = true;
        addScore(300, enemy.x, enemy.y - 12);
        spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffbe35", 12, 240);
        audio.sfx("kick");
        break;
      }
      if (ball.life <= 0 || ball.y > HEIGHT + 100 || ball.bounces > 5) ball.dead = true;
    }
  }

  function updateEffects(dt) {
    for (const block of solids) block.bump = Math.max(0, block.bump - dt);
    for (const particle of particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.vx *= 0.996 ** (dt * 60);
    }
    for (const item of floatingTexts) {
      item.life -= dt;
      item.y += item.vy * dt;
    }
    particles = particles.filter((item) => item.life > 0);
    floatingTexts = floatingTexts.filter((item) => item.life > 0);
    fireballs = fireballs.filter((item) => !item.dead);
    powerups = powerups.filter((item) => !item.dead && item.y < HEIGHT + 200);
  }

  function startDeath(fromPit) {
    if (["dying", "goal", "won", "gameover"].includes(mode)) return;
    mode = "dying";
    deathTimer = 0;
    keys.clear();
    audio.stopMusic();
    audio.sfx("death");
    player.vx = 0;
    player.vy = fromPit ? -680 : -900;
    cameraShake = Math.max(cameraShake, 10);
    updateHud();
  }

  function triggerGoal() {
    if (mode !== "playing") return;
    mode = "goal";
    goalTimer = 0;
    player.invulnerable = 99;
    player.vx = 0;
    player.vy = 0;
    player.x = goal.x - player.w + 14;
    audio.stopMusic();
    audio.sfx("goal");
    const timeBonus = Math.floor(remainingTime) * 20;
    addScore(timeBonus, goal.x - 35, 170);
    toast(`TIME BONUS +${timeBonus}`, 2.2);
    updateHud();
  }

  function updateGoal(dt) {
    goalTimer += dt;
    goalFlagY = lerp(238, 490, clamp(goalTimer / 1.15, 0, 1));
    if (goalTimer < 1.15) {
      player.y = lerp(player.y, GROUND_Y - player.h, dt * 3.3);
    } else if (goalTimer < 3.45) {
      player.x += 150 * dt;
      player.facing = 1;
      player.anim += dt * 7;
      if (Math.random() < dt * 3.8) {
        const x = goal.castleX + 80 + (Math.random() - 0.5) * 260;
        const y = 170 + Math.random() * 180;
        const colors = ["#ff4b55", "#ffd83d", "#55d9ff", "#80f27c"];
        spawnParticles(x, y, colors[Math.floor(Math.random() * colors.length)], 18, 260, {
          gravity: 150,
          shape: "star",
          size: 6,
          life: 1.2,
        });
      }
    } else if (goalTimer >= 4.15) {
      endGame(true);
    }
    camera = clamp(lerp(camera, goal.x - WIDTH * 0.62, dt * 2), 0, WORLD_WIDTH - WIDTH);
  }

  function updateCheckpoints() {
    if (!player) return;
    const nextIndex = checkpointIndex + 1;
    if (nextIndex < checkpointMarks.length && player.x >= checkpointMarks[nextIndex]) {
      checkpointIndex = nextIndex;
      checkpoint = checkpointMarks[nextIndex];
      addScore(500, checkpoint + 10, 420);
      audio.sfx("checkpoint");
      toast("CHECKPOINT！", 1.7);
    }
  }

  function update(dt) {
    ambientTime += dt;
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) ui.toast.classList.remove("show");
    }
    cameraShake = Math.max(0, cameraShake - dt * 25);

    if (mode === "playing") {
      updatePlayer(dt);
      if (mode === "playing") {
        updateCoins(dt);
        updatePowerups(dt);
        updateEnemies(dt);
        updateFireballs(dt);
        updateEffects(dt);
        updateCheckpoints();
        remainingTime = Math.max(0, remainingTime - dt);
        if (remainingTime <= 0) startDeath(false);
        if (player.x + player.w >= goal.x) triggerGoal();
        const cameraTarget = clamp(player.x - WIDTH * 0.36, 0, WORLD_WIDTH - WIDTH);
        camera = lerp(camera, cameraTarget, 1 - Math.pow(0.0008, dt));
      }
    } else if (mode === "dying") {
      deathTimer += dt;
      player.vy += GRAVITY * 0.66 * dt;
      player.y += player.vy * dt;
      player.anim += dt * 5;
      updateEffects(dt);
      if (deathTimer > 2.15) {
        lives -= 1;
        setPower(0);
        if (lives <= 0) endGame(false);
        else resetPlayerAfterDeath();
      }
    } else if (mode === "goal") {
      updateGoal(dt);
      updateEffects(dt);
    } else if (mode === "title") {
      camera = 210 + Math.sin(ambientTime * 0.17) * 90;
      updateEffects(dt);
    } else if (mode === "won" || mode === "gameover") {
      updateEffects(dt);
    }
    updateHud();
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawCloud(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(40, 32, 28, Math.PI, 0);
    ctx.arc(76, 25, 38, Math.PI, 0);
    ctx.arc(118, 35, 26, Math.PI, 0);
    ctx.lineTo(140, 58);
    ctx.lineTo(18, 58);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(139,199,255,0.35)";
    ctx.fillRect(24, 52, 104, 7);
    ctx.restore();
  }

  function drawHill(x, y, width, height, color, spots = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.quadraticCurveTo(width * 0.22, height * 0.06, width * 0.5, 0);
    ctx.quadraticCurveTo(width * 0.78, height * 0.06, width, height);
    ctx.closePath();
    ctx.fill();
    if (spots) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(width * 0.42, height * 0.46, width * 0.035, height * 0.13, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 0.62, height * 0.62, width * 0.03, height * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBush(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#168b49";
    ctx.beginPath();
    ctx.arc(28, 38, 30, Math.PI, 0);
    ctx.arc(62, 28, 39, Math.PI, 0);
    ctx.arc(102, 39, 28, Math.PI, 0);
    ctx.lineTo(130, 58);
    ctx.lineTo(0, 58);
    ctx.fill();
    ctx.fillStyle = "#42bd5d";
    ctx.beginPath();
    ctx.arc(47, 34, 15, Math.PI, 0);
    ctx.arc(80, 30, 17, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawBackground() {
    const progress = clamp(camera / (WORLD_WIDTH - WIDTH), 0, 1);
    const top = [lerp(44, 90, progress), lerp(132, 66, progress), lerp(242, 145, progress)];
    const bottom = [lerp(123, 247, progress), lerp(202, 146, progress), lerp(255, 114, progress)];
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, `rgb(${top.join(",")})`);
    gradient.addColorStop(0.72, `rgb(${bottom.join(",")})`);
    gradient.addColorStop(1, "#f5d28b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const sunX = lerp(WIDTH + 130, WIDTH * 0.78, progress);
    const sunY = lerp(160, 190, progress);
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 90);
    sunGradient.addColorStop(0, "rgba(255,252,197,1)");
    sunGradient.addColorStop(0.34, "rgba(255,220,108,0.92)");
    sunGradient.addColorStop(1, "rgba(255,175,62,0)");
    ctx.fillStyle = sunGradient;
    ctx.fillRect(sunX - 100, sunY - 100, 200, 200);

    for (let i = 0; i < 9; i += 1) {
      const x = mod(i * 410 - camera * 0.12, WIDTH + 560) - 260;
      drawCloud(x, 92 + (i % 3) * 75, 0.65 + (i % 2) * 0.26);
    }

    for (let i = 0; i < 7; i += 1) {
      const x = mod(i * 520 - camera * 0.22, WIDTH + 900) - 420;
      drawHill(x, 380, 440, 240, progress > 0.7 ? "#7561a9" : "#4cb77d", true);
    }
    for (let i = 0; i < 8; i += 1) {
      const x = mod(i * 360 - camera * 0.36, WIDTH + 520) - 240;
      drawHill(x, 440, 320, 180, progress > 0.7 ? "#4f548e" : "#238f67", false);
    }
    for (let i = 0; i < 10; i += 1) {
      const x = mod(i * 330 - camera * 0.66, WIDTH + 460) - 180;
      drawBush(x, 548, 0.78 + (i % 3) * 0.12);
    }
  }

  function blockBumpOffset(block) {
    if (block.bump <= 0) return 0;
    const duration = block.type === "question" ? 0.28 : 0.22;
    return -Math.sin((block.bump / duration) * Math.PI) * 10;
  }

  function drawGround(block) {
    ctx.fillStyle = "#b85c2a";
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = "#efae55";
    ctx.fillRect(block.x, block.y, block.w, 14);
    ctx.fillStyle = "#7a341f";
    ctx.fillRect(block.x, block.y + 14, block.w, 6);
    const startX = Math.floor(Math.max(block.x, camera - 60) / 48) * 48;
    const endX = Math.min(block.x + block.w, camera + WIDTH + 60);
    for (let x = startX; x < endX; x += 48) {
      ctx.strokeStyle = "rgba(103,43,28,0.55)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1, block.y + 21, 46, 46);
      ctx.beginPath();
      ctx.moveTo(x + 24, block.y + 21);
      ctx.lineTo(x + 24, block.y + 44);
      ctx.moveTo(x, block.y + 67);
      ctx.lineTo(x + 48, block.y + 67);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,211,128,0.15)";
      ctx.fillRect(x + 5, block.y + 27, 16, 5);
    }
  }

  function drawBrick(block) {
    const y = block.y + blockBumpOffset(block);
    ctx.fillStyle = "#7d2f22";
    ctx.fillRect(block.x, y, block.w, block.h);
    ctx.fillStyle = "#df7040";
    ctx.fillRect(block.x + 3, y + 3, block.w - 6, block.h - 6);
    ctx.fillStyle = "#f39a58";
    ctx.fillRect(block.x + 5, y + 5, block.w - 10, 5);
    ctx.strokeStyle = "#7d2f22";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(block.x, y + 24);
    ctx.lineTo(block.x + block.w, y + 24);
    ctx.moveTo(block.x + 24, y);
    ctx.lineTo(block.x + 24, y + 24);
    ctx.moveTo(block.x + 12, y + 24);
    ctx.lineTo(block.x + 12, y + 48);
    ctx.moveTo(block.x + 38, y + 24);
    ctx.lineTo(block.x + 38, y + 48);
    ctx.stroke();
  }

  function drawQuestion(block) {
    const y = block.y + blockBumpOffset(block);
    const pulse = block.used ? 0 : Math.sin(ambientTime * 5 + block.x * 0.01) * 8;
    ctx.fillStyle = block.used ? "#756b64" : "#a9690c";
    ctx.fillRect(block.x, y, block.w, block.h);
    ctx.fillStyle = block.used ? "#aa9b8e" : `rgb(255, ${183 + pulse}, 28)`;
    ctx.fillRect(block.x + 4, y + 4, block.w - 8, block.h - 8);
    ctx.fillStyle = block.used ? "#d0c5b8" : "#fff0a3";
    ctx.fillRect(block.x + 7, y + 7, 6, 6);
    ctx.fillRect(block.x + block.w - 13, y + 7, 6, 6);
    ctx.fillRect(block.x + 7, y + block.h - 13, 6, 6);
    ctx.fillRect(block.x + block.w - 13, y + block.h - 13, 6, 6);
    if (!block.used) {
      ctx.fillStyle = "#fff8cf";
      ctx.font = "900 31px Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", block.x + block.w / 2, y + block.h / 2 + 1);
    }
  }

  function drawPipe(block) {
    const main = block.color === "teal" ? "#11a6a0" : "#1aac41";
    const dark = block.color === "teal" ? "#076d74" : "#087d2d";
    const light = block.color === "teal" ? "#69ebce" : "#78ec70";
    ctx.fillStyle = dark;
    ctx.fillRect(block.x + 9, block.y + 15, block.w - 18, block.h - 15);
    ctx.fillStyle = main;
    ctx.fillRect(block.x + 18, block.y + 15, block.w - 36, block.h - 15);
    ctx.fillStyle = light;
    ctx.fillRect(block.x + 24, block.y + 17, 13, block.h - 20);
    ctx.fillStyle = dark;
    ctx.fillRect(block.x, block.y, block.w, 26);
    ctx.fillStyle = main;
    ctx.fillRect(block.x + 6, block.y + 4, block.w - 12, 18);
    ctx.fillStyle = light;
    ctx.fillRect(block.x + 18, block.y + 4, 15, 18);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(block.x + 36, block.y + 5, 6, block.h - 12);
  }

  function drawStair(block) {
    ctx.fillStyle = "#77504b";
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = "#c99b78";
    ctx.fillRect(block.x + 4, block.y + 4, block.w - 8, block.h - 8);
    ctx.fillStyle = "#f0c59b";
    ctx.fillRect(block.x + 7, block.y + 7, block.w - 14, 7);
    ctx.strokeStyle = "#77504b";
    ctx.lineWidth = 3;
    ctx.strokeRect(block.x + 2, block.y + 2, block.w - 4, block.h - 4);
  }

  function drawSolids() {
    for (const block of solids) {
      if (block.destroyed || !visible(block.x, block.w)) continue;
      if (block.type === "ground") drawGround(block);
      else if (block.type === "brick") drawBrick(block);
      else if (block.type === "question") drawQuestion(block);
      else if (block.type === "pipe") drawPipe(block);
      else if (block.type === "stair") drawStair(block);
    }
  }

  function drawCoin(coin) {
    const scaleX = 0.2 + Math.abs(Math.cos(coin.phase)) * 0.8;
    ctx.save();
    ctx.translate(coin.x + coin.w / 2, coin.y + coin.h / 2);
    ctx.scale(scaleX, 1);
    ctx.fillStyle = "#a95b0a";
    ctx.beginPath();
    ctx.ellipse(0, 2, 14, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd52c";
    ctx.beginPath();
    ctx.ellipse(0, -1, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff19a";
    ctx.fillRect(-3, -12, 4, 20);
    ctx.restore();
  }

  function drawCoins() {
    for (const coin of coins) {
      if (!coin.collected && visible(coin.x, coin.w)) drawCoin(coin);
    }
  }

  function drawMushroom(item) {
    const x = item.x;
    const y = item.y;
    ctx.fillStyle = "#7d211f";
    roundedRect(ctx, x, y + 3, item.w, 25, 14);
    ctx.fill();
    ctx.fillStyle = "#ef3634";
    roundedRect(ctx, x + 3, y, item.w - 6, 25, 13);
    ctx.fill();
    ctx.fillStyle = "#fff6dd";
    ctx.fillRect(x + 7, y + 5, 9, 10);
    ctx.fillRect(x + 26, y + 5, 8, 10);
    ctx.fillStyle = "#f3d5a7";
    roundedRect(ctx, x + 9, y + 21, item.w - 18, 18, 5);
    ctx.fill();
    ctx.fillStyle = "#30231f";
    ctx.fillRect(x + 14, y + 27, 3, 5);
    ctx.fillRect(x + 23, y + 27, 3, 5);
  }

  function drawFlower(item) {
    const x = item.x + item.w / 2;
    const y = item.y + item.h / 2 + Math.sin(item.phase) * 2;
    ctx.fillStyle = "#1a9a3c";
    ctx.fillRect(x - 3, y + 6, 6, 20);
    ctx.fillRect(x - 12, y + 13, 9, 5);
    ctx.fillRect(x + 3, y + 13, 9, 5);
    ctx.fillStyle = "#ff3d32";
    [[0, -10], [-10, 0], [10, 0], [0, 10]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy - 5, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#ffd338";
    ctx.beginPath();
    ctx.arc(x, y - 5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#39231d";
    ctx.fillRect(x - 4, y - 7, 2, 3);
    ctx.fillRect(x + 3, y - 7, 2, 3);
  }

  function drawPowerups() {
    for (const item of powerups) {
      if (item.dead || !visible(item.x, item.w)) continue;
      if (item.kind === "mushroom") drawMushroom(item);
      else drawFlower(item);
    }
  }

  function drawGoomba(enemy) {
    const x = enemy.x;
    const y = enemy.state === "squished" ? enemy.y + enemy.h - 17 : enemy.y;
    const h = enemy.state === "squished" ? 17 : enemy.h;
    ctx.fillStyle = "#4d241b";
    roundedRect(ctx, x + 3, y, enemy.w - 6, h - 7, 16);
    ctx.fill();
    ctx.fillStyle = "#9d4b27";
    roundedRect(ctx, x + 6, y + 3, enemy.w - 12, h - 13, 14);
    ctx.fill();
    if (enemy.state !== "squished") {
      ctx.fillStyle = "#f5d6ae";
      ctx.fillRect(x + 10, y + 19, 10, 14);
      ctx.fillRect(x + 27, y + 19, 10, 14);
      ctx.fillStyle = "#17131a";
      ctx.fillRect(x + 15, y + 21, 4, 7);
      ctx.fillRect(x + 28, y + 21, 4, 7);
      const step = Math.sin(enemy.anim * 3) > 0 ? 2 : -2;
      ctx.fillStyle = "#32201d";
      ctx.fillRect(x + 2 + step, y + h - 10, 19, 10);
      ctx.fillRect(x + 25 - step, y + h - 10, 19, 10);
    }
  }

  function drawKoopa(enemy) {
    const x = enemy.x;
    const y = enemy.y;
    if (enemy.state === "shell") {
      ctx.fillStyle = "#155d30";
      roundedRect(ctx, x + 2, y, enemy.w - 4, enemy.h, 14);
      ctx.fill();
      ctx.fillStyle = "#37b84c";
      roundedRect(ctx, x + 6, y + 4, enemy.w - 12, enemy.h - 8, 11);
      ctx.fill();
      ctx.strokeStyle = "#e9ef9b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + enemy.w / 2, y + enemy.h / 2, 10, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = "#f2d15f";
    roundedRect(ctx, x + 9, y, 26, 24, 10);
    ctx.fill();
    ctx.fillStyle = "#173221";
    ctx.fillRect(x + (enemy.facing > 0 ? 27 : 13), y + 7, 4, 6);
    ctx.fillStyle = "#116334";
    roundedRect(ctx, x + 2, y + 18, 36, 31, 13);
    ctx.fill();
    ctx.fillStyle = "#36bd50";
    roundedRect(ctx, x + 7, y + 21, 28, 24, 10);
    ctx.fill();
    const step = Math.sin(enemy.anim * 3) > 0 ? 3 : -1;
    ctx.fillStyle = "#f2d15f";
    ctx.fillRect(x + 3 + step, y + 47, 14, 11);
    ctx.fillRect(x + 25 - step, y + 47, 14, 11);
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      if (enemy.dead || !visible(enemy.x, enemy.w)) continue;
      if (enemy.kind === "goomba") drawGoomba(enemy);
      else drawKoopa(enemy);
    }
  }

  function pixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawPlayerSprite() {
    if (!player || (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0)) return;
    const x = player.x;
    const y = player.y;
    const big = player.power > 0;
    const unit = big ? 4 : 3.35;
    const spriteW = 13 * unit;
    const spriteH = big ? 18 * unit : 16 * unit;
    const run = player.grounded && Math.abs(player.vx) > 25 ? (Math.sin(player.anim * 3) > 0 ? 1 : -1) : 0;
    const jumping = !player.grounded;
    const cap = player.power === 2 ? "#fff5df" : "#ed2d2f";
    const shirt = player.power === 2 ? "#fff5df" : "#e52b2d";
    const overalls = player.power === 2 ? "#e12e2f" : "#176bd1";
    const skin = "#f4b675";
    const hair = "#5a2b1b";

    ctx.save();
    ctx.translate(x + player.w / 2, y + player.h);
    ctx.scale(player.facing, 1);
    ctx.translate(-spriteW / 2, -spriteH);

    pixelRect(3 * unit, 0, 7 * unit, 2 * unit, cap);
    pixelRect(1 * unit, 2 * unit, 11 * unit, 2 * unit, cap);
    pixelRect(2 * unit, 4 * unit, 8 * unit, 4 * unit, skin);
    pixelRect(1 * unit, 4 * unit, 2 * unit, 4 * unit, hair);
    pixelRect(9 * unit, 5 * unit, 2 * unit, 1 * unit, hair);
    pixelRect(8 * unit, 4 * unit, 1 * unit, 1 * unit, "#1c1720");
    pixelRect(8 * unit, 6 * unit, 4 * unit, 1 * unit, hair);
    pixelRect(3 * unit, 8 * unit, 7 * unit, big ? 5 * unit : 4 * unit, shirt);
    pixelRect(4 * unit, 9 * unit, 5 * unit, big ? 6 * unit : 5 * unit, overalls);
    pixelRect(3 * unit, 10 * unit, 2 * unit, 4 * unit, overalls);
    pixelRect(8 * unit, 10 * unit, 2 * unit, 4 * unit, overalls);
    pixelRect(5 * unit, 10 * unit, unit, unit, "#ffd43b");
    pixelRect(8 * unit, 10 * unit, unit, unit, "#ffd43b");
    pixelRect(1 * unit, 9 * unit, 2 * unit, 4 * unit, shirt);
    pixelRect(10 * unit, 9 * unit, 2 * unit, 4 * unit, shirt);
    pixelRect(0, 12 * unit, 2 * unit, 2 * unit, "#fff8e8");
    pixelRect(11 * unit, 12 * unit, 2 * unit, 2 * unit, "#fff8e8");

    const legY = big ? 14 : 13;
    if (jumping) {
      pixelRect(3 * unit, legY * unit, 4 * unit, 2 * unit, overalls);
      pixelRect(7 * unit, (legY + 1) * unit, 4 * unit, 2 * unit, overalls);
      pixelRect(2 * unit, (legY + 1) * unit, 4 * unit, 2 * unit, hair);
      pixelRect(9 * unit, (legY + 2) * unit, 4 * unit, 2 * unit, hair);
    } else {
      pixelRect((3 + run) * unit, legY * unit, 3 * unit, 3 * unit, overalls);
      pixelRect((7 - run) * unit, legY * unit, 3 * unit, 3 * unit, overalls);
      pixelRect((2 + run) * unit, (legY + 2) * unit, 4 * unit, 2 * unit, hair);
      pixelRect((7 - run) * unit, (legY + 2) * unit, 4 * unit, 2 * unit, hair);
    }

    ctx.restore();
  }

  function drawFireballs() {
    for (const ball of fireballs) {
      const x = ball.x + ball.w / 2;
      const y = ball.y + ball.h / 2;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 18);
      glow.addColorStop(0, "#fffbd2");
      glow.addColorStop(0.3, "#ffd540");
      glow.addColorStop(0.65, "#ff5b22");
      glow.addColorStop(1, "rgba(255,50,20,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 20, y - 20, 40, 40);
      ctx.fillStyle = "#fff5b0";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCheckpoint(x, active) {
    ctx.fillStyle = "#e9edf6";
    ctx.fillRect(x, 390, 8, GROUND_Y - 390);
    ctx.fillStyle = active ? "#ffd83b" : "#8093aa";
    ctx.beginPath();
    ctx.moveTo(x + 8, 400);
    ctx.lineTo(x + 66, 419);
    ctx.lineTo(x + 8, 440);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = active ? "#fff7bd" : "#a9bacd";
    ctx.font = "900 22px Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", x + 29, 426);
  }

  function drawCastle() {
    const x = goal.castleX;
    const baseY = GROUND_Y;
    ctx.fillStyle = "#6d4c5a";
    ctx.fillRect(x, baseY - 210, 280, 210);
    ctx.fillStyle = "#aa7468";
    ctx.fillRect(x + 18, baseY - 194, 244, 194);
    const towers = [0, 102, 204];
    for (const offset of towers) {
      ctx.fillStyle = "#5d4053";
      ctx.fillRect(x + offset, baseY - 260, 76, 66);
      for (let i = 0; i < 3; i += 1) ctx.fillRect(x + offset + i * 28, baseY - 280, 20, 28);
      ctx.fillStyle = "#c18a78";
      ctx.fillRect(x + offset + 9, baseY - 252, 58, 58);
    }
    ctx.fillStyle = "#342638";
    roundedRect(ctx, x + 102, baseY - 112, 78, 112, 36);
    ctx.fill();
    ctx.fillStyle = "#ffe35a";
    ctx.fillRect(x + 135, baseY - 56, 8, 8);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        if ((row + col) % 2 === 0) {
          ctx.fillStyle = "rgba(91,52,55,0.25)";
          ctx.fillRect(x + 26 + col * 46 + (row % 2) * 12, baseY - 178 + row * 46, 30, 20);
        }
      }
    }
    ctx.fillStyle = "#e72e3a";
    ctx.fillRect(x + 137, baseY - 342, 7, 70);
    ctx.beginPath();
    ctx.moveTo(x + 144, baseY - 338);
    ctx.lineTo(x + 217, baseY - 316);
    ctx.lineTo(x + 144, baseY - 292);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff4ab";
    ctx.font = "900 20px Arial Black, sans-serif";
    ctx.fillText("5.6", x + 174, baseY - 310);
  }

  function drawGoal() {
    ctx.fillStyle = "#f6f3d9";
    ctx.fillRect(goal.x, goal.y, 9, goal.poleBottom - goal.y);
    ctx.fillStyle = "#fff7b6";
    ctx.beginPath();
    ctx.arc(goal.x + 4.5, goal.y - 9, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cda72e";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#ef3140";
    ctx.beginPath();
    ctx.moveTo(goal.x + 9, goalFlagY);
    ctx.lineTo(goal.x + 102, goalFlagY + 26);
    ctx.lineTo(goal.x + 9, goalFlagY + 56);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff2a4";
    ctx.font = "900 24px Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", goal.x + 42, goalFlagY + 36);
    drawCastle();
  }

  function drawWorldDecor() {
    for (let i = 1; i < checkpointMarks.length; i += 1) {
      if (visible(checkpointMarks[i], 70)) drawCheckpoint(checkpointMarks[i], checkpointIndex >= i);
    }
    if (visible(350, 200)) {
      ctx.fillStyle = "#8b512b";
      ctx.fillRect(360, 500, 12, 110);
      ctx.fillStyle = "#f2d7a0";
      ctx.fillRect(318, 472, 105, 56);
      ctx.strokeStyle = "#70401f";
      ctx.lineWidth = 5;
      ctx.strokeRect(318, 472, 105, 56);
      ctx.fillStyle = "#71351f";
      ctx.font = "900 19px Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("5.6–1", 370, 507);
    }
    if (visible(goal.x, 500)) drawGoal();
  }

  function drawEffects() {
    for (const particle of particles) {
      if (!visible(particle.x, particle.size)) continue;
      const alpha = clamp(particle.life / Math.max(0.001, particle.maxLife), 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate((1 - alpha) * 4);
      ctx.fillStyle = particle.color;
      if (particle.shape === "star") {
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const radius = i % 2 === 0 ? particle.size : particle.size * 0.42;
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else if (particle.shape === "brick") {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.7);
        ctx.strokeStyle = "#78341f";
        ctx.lineWidth = 2;
        ctx.strokeRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.7);
      } else {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      }
      ctx.restore();
    }
    for (const item of floatingTexts) {
      if (!visible(item.x, 60)) continue;
      ctx.save();
      ctx.globalAlpha = clamp(item.life / 0.3, 0, 1);
      ctx.fillStyle = item.coin ? "#ffe14b" : "#fff";
      ctx.strokeStyle = "#252044";
      ctx.lineWidth = 5;
      ctx.font = item.coin ? "900 27px Arial Black, sans-serif" : "900 18px Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(item.text, item.x, item.y);
      ctx.fillText(item.text, item.x, item.y);
      ctx.restore();
    }
  }

  function draw() {
    drawBackground();
    const shakeX = cameraShake > 0 ? (Math.random() - 0.5) * cameraShake : 0;
    const shakeY = cameraShake > 0 ? (Math.random() - 0.5) * cameraShake * 0.55 : 0;
    ctx.save();
    ctx.translate(-Math.round(camera) + shakeX, shakeY);
    drawWorldDecor();
    drawSolids();
    drawCoins();
    drawPowerups();
    drawEnemies();
    drawFireballs();
    drawPlayerSprite();
    drawEffects();
    ctx.restore();

    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.45, HEIGHT * 0.22, WIDTH / 2, HEIGHT / 2, WIDTH * 0.7);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.75, "rgba(3,7,24,0.02)");
    vignette.addColorStop(1, "rgba(3,7,24,0.24)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function frame(now) {
    const dt = Math.min(1 / 30, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (mode !== "paused") update(dt);
    draw();
    pressed.clear();
    requestAnimationFrame(frame);
  }

  function keyDown(code, repeat = false) {
    if (!keys.has(code) && !repeat) pressed.add(code);
    keys.add(code);
  }

  function keyUp(code) {
    keys.delete(code);
  }

  const controlledKeys = new Set([
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
    "KeyA", "KeyD", "KeyW", "KeyZ", "KeyX", "KeyJ", "KeyM",
    "KeyP", "KeyR", "Escape", "Enter",
  ]);

  window.addEventListener("keydown", (event) => {
    if (controlledKeys.has(event.code)) event.preventDefault();
    if (event.code === "KeyM" && !event.repeat) {
      audio.unlock();
      audio.toggle();
      return;
    }
    if ((event.code === "KeyP" || event.code === "Escape") && !event.repeat) {
      togglePause();
      return;
    }
    if (event.code === "KeyR" && !event.repeat && mode !== "title") {
      startGame();
      return;
    }
    if ((event.code === "Enter" || event.code === "Space") && !event.repeat && ["title", "won", "gameover"].includes(mode)) {
      startGame();
      return;
    }
    keyDown(event.code, event.repeat);
  });

  window.addEventListener("keyup", (event) => keyUp(event.code));
  window.addEventListener("blur", () => {
    keys.clear();
    pressed.clear();
    if (mode === "playing") togglePause(true);
  });

  ui.startButton.addEventListener("click", startGame);
  ui.pauseButton.addEventListener("click", () => togglePause());
  ui.resumeButton.addEventListener("click", () => togglePause(false));
  ui.restartFromPauseButton.addEventListener("click", startGame);
  ui.restartButton.addEventListener("click", startGame);
  ui.soundButton.addEventListener("click", () => {
    audio.unlock();
    audio.toggle();
  });

  document.querySelectorAll("[data-key]").forEach((button) => {
    const code = button.dataset.key;
    const press = (event) => {
      event.preventDefault();
      audio.unlock();
      button.classList.add("is-pressed");
      keyDown(code, false);
    };
    const release = (event) => {
      event.preventDefault();
      button.classList.remove("is-pressed");
      keyUp(code);
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && mode === "playing") togglePause(true);
  });

  buildLevel();
  player = createPlayer(470);
  player.power = 1;
  player.h = 74;
  player.y = GROUND_Y - player.h;
  showOverlay(ui.start, true);
  showOverlay(ui.pause, false);
  showOverlay(ui.end, false);
  ui.hud.style.opacity = "0.52";
  updateHud();

  window.__SOL56_GAME__ = {
    version: "1.0.0",
    getState: () => ({
      mode,
      x: Math.round(player?.x || 0),
      y: Math.round(player?.y || 0),
      score,
      coins: coinCount,
      lives,
      time: Math.round(remainingTime),
      muted: audio.muted,
    }),
    start: startGame,
    mute: (value) => audio.setMuted(value),
    pause: togglePause,
    qaWarpToGoal: () => {
      if (mode === "playing") {
        player.x = goal.x - player.w - 2;
        player.y = GROUND_Y - player.h;
        camera = goal.x - WIDTH * 0.6;
      }
    },
  };

  requestAnimationFrame(frame);
})();
