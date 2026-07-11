/**
 * Super Mario Bros. tribute — original engine (Composer 2.5)
 * Canvas renderer + tile physics + entity simulation
 */
(() => {
  "use strict";

  const SZ = 16;
  const VW = 320;
  const VH = 192;
  const ZOOM = 2.5;

  const PAL = {
    sky: "#5c94fc",
    dirt: "#c84c0c",
    grass: "#00a800",
    brick: "#b83800",
    brickLine: "#6b1800",
    brickHi: "#fca060",
    coinGold: "#f8b800",
    coinHi: "#fff0a0",
    qGold: "#f8c030",
    qShadow: "#c87800",
    qUsed: "#9a9a9a",
    pipe: "#00a800",
    pipeHi: "#80d010",
    pipeIn: "#006800",
    cloud: "#fcfcfc",
    hill: "#00a800",
    hillHi: "#80d010",
    bush: "#00a800",
    marioHat: "#e40000",
    marioOver: "#0038f0",
    marioFace: "#fca044",
    marioHair: "#6b3000",
    goomba: "#c84c0c",
    goombaFeet: "#5c2800",
    flag: "#00b000",
    castle: "#686868",
    white: "#fcfcfc",
    black: "#000000",
  };

  const BLOCK = {
    AIR: 0,
    FLOOR: 1,
    BRICK: 2,
    QUESTION: 3,
    QUESTION_USED: 4,
    STEEL: 5,
    PIPE_UL: 6,
    PIPE_UR: 7,
    PIPE_DL: 8,
    PIPE_DR: 9,
    POLE: 10,
    POLE_TOP: 11,
    CASTLE: 12,
  };

  const SOLID = new Set([
    BLOCK.FLOOR, BLOCK.BRICK, BLOCK.QUESTION, BLOCK.QUESTION_USED,
    BLOCK.STEEL, BLOCK.PIPE_UL, BLOCK.PIPE_UR, BLOCK.PIPE_DL, BLOCK.PIPE_DR,
    BLOCK.CASTLE,
  ]);

  // ---- Level composer (segment DSL) ----
  function composeWorld() {
    const cols = 212;
    const rows = 12;
    const grid = Array.from({ length: rows }, () => new Uint8Array(cols));

    const set = (c, r, id) => {
      if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = id;
    };

    const floor = (c0, c1, r = rows - 1) => {
      for (let c = c0; c < c1; c++) set(c, r, BLOCK.FLOOR);
    };

    const pipe = (c, tall) => {
      const base = rows - 2;
      for (let h = 0; h < tall; h++) {
        const r = base - h;
        if (h === tall - 1) {
          set(c, r, BLOCK.PIPE_UL);
          set(c + 1, r, BLOCK.PIPE_UR);
        } else {
          set(c, r, BLOCK.PIPE_DL);
          set(c + 1, r, BLOCK.PIPE_DR);
        }
      }
    };

    const pyramid = (c0, height) => {
      for (let h = 0; h < height; h++) {
        for (let w = 0; w <= h; w++) set(c0 + w, rows - 2 - h, BLOCK.STEEL);
      }
    };

    // Ground with classic pits
    floor(0, 71);
    floor(73, 88);
    floor(91, 158);
    floor(160, cols);

    // Platforms & blocks
    [[18, 4, BLOCK.QUESTION], [22, 4, BLOCK.BRICK], [23, 4, BLOCK.QUESTION],
     [24, 4, BLOCK.BRICK], [25, 4, BLOCK.QUESTION], [23, 1, BLOCK.QUESTION],
     [80, 4, BLOCK.BRICK], [81, 4, BLOCK.QUESTION], [82, 4, BLOCK.BRICK],
     [98, 4, BLOCK.BRICK], [99, 4, BLOCK.BRICK], [100, 4, BLOCK.QUESTION],
     [103, 1, BLOCK.BRICK], [104, 1, BLOCK.BRICK], [105, 1, BLOCK.BRICK],
     [124, 4, BLOCK.QUESTION], [127, 4, BLOCK.BRICK], [128, 4, BLOCK.QUESTION],
     [129, 4, BLOCK.BRICK]].forEach(([c, r, b]) => set(c, r, b));

    pyramid(145, 4);
    pyramid(153, 4);
    pyramid(186, 8);

    pipe(31, 2);
    pipe(42, 3);
    pipe(51, 4);
    pipe(62, 4);
    pipe(168, 2);
    pipe(184, 2);

    // Flag zone
    for (let r = 1; r <= 7; r++) set(200, rows - 1 - r, BLOCK.POLE);
    set(200, 0, BLOCK.POLE_TOP);
    set(200, rows - 2, BLOCK.STEEL);

    // Castle tiles (drawn separately but collision block at end)
    for (let r = rows - 5; r < rows; r++) {
      for (let c = 208; c < 212; c++) set(c, r, BLOCK.CASTLE);
    }

    const loot = new Map([
      ["18,4", "coin"], ["23,4", "coin"], ["25,4", "coin"], ["23,1", "shroom"],
      ["81,4", "coin"], ["100,4", "coin"], ["124,4", "coin"], ["128,4", "shroom"],
    ]);

    const scenery = {
      clouds: [[6, 1], [17, 2], [34, 1], [58, 2], [76, 1], [102, 2],
               [128, 1], [156, 2], [178, 1], [196, 2]],
      hills: [[2, 0], [52, 0], [104, 0], [162, 0]],
      shrubs: [[14, 0], [27, 0], [47, 0], [68, 0], [118, 0], [142, 0]],
    };

    const foes = [
      [24, 9], [44, 9], [55, 9], [56, 9], [84, 9], [101, 9], [102, 9],
      [119, 9], [120, 9], [176, 9],
    ].map(([c, r]) => ({ c, r }));

    return { grid, cols, rows, loot, scenery, foes };
  }

  // ---- Drawing primitives ----
  class Painter {
    constructor(ctx) {
      this.c = ctx;
    }

    px(x, y, w, h, color) {
      this.c.fillStyle = color;
      this.c.fillRect(Math.floor(x), Math.floor(y), w, h);
    }

    cloud(x, y) {
      this.px(x, y + 5, 36, 7, PAL.cloud);
      this.px(x + 8, y, 20, 8, PAL.cloud);
      this.px(x + 4, y + 3, 10, 6, PAL.cloud);
      this.px(x + 22, y + 3, 10, 6, PAL.cloud);
    }

    hill(x, groundY) {
      const steps = [8, 16, 24, 16, 8];
      for (let i = 0; i < steps.length; i++) {
        const h = steps[i];
        this.px(x + i * 10, groundY - h, 12, h, i % 2 ? PAL.hillHi : PAL.hill);
      }
    }

    shrub(x, groundY) {
      this.px(x, groundY - 10, 34, 10, PAL.bush);
      this.px(x + 9, groundY - 16, 16, 8, PAL.bush);
    }

    tile(id, x, y, bump = 0) {
      y += bump;
      const p = this.px.bind(this);
      switch (id) {
        case BLOCK.FLOOR:
          p(x, y, SZ, SZ, PAL.dirt);
          p(x, y, SZ, 4, PAL.grass);
          p(x + 4, y + 10, 2, 2, PAL.brickLine);
          p(x + 11, y + 7, 2, 2, PAL.brickLine);
          break;
        case BLOCK.BRICK:
          p(x, y, SZ, SZ, PAL.brick);
          p(x, y, SZ, 2, PAL.brickHi);
          p(x, y + 7, SZ, 1, PAL.brickLine);
          p(x + 7, y, 1, 7, PAL.brickLine);
          p(x + 7, y + 8, 1, 8, PAL.brickLine);
          break;
        case BLOCK.QUESTION:
        case BLOCK.QUESTION_USED: {
          const active = id === BLOCK.QUESTION;
          const main = active ? PAL.qGold : PAL.qUsed;
          const inner = active ? PAL.qShadow : "#707070";
          p(x, y, SZ, SZ, main);
          p(x + 1, y + 1, SZ - 2, SZ - 2, inner);
          p(x + 2, y + 2, SZ - 4, SZ - 4, main);
          p(x + 1, y + 1, 2, 2, PAL.white);
          p(x + SZ - 3, y + 1, 2, 2, PAL.white);
          p(x + 1, y + SZ - 3, 2, 2, PAL.white);
          p(x + SZ - 3, y + SZ - 3, 2, 2, PAL.white);
          if (active) {
            p(x + 6, y + 4, 5, 2, PAL.white);
            p(x + 10, y + 6, 2, 3, PAL.white);
            p(x + 8, y + 9, 2, 2, PAL.white);
            p(x + 8, y + 12, 2, 2, PAL.white);
          } else {
            p(x + 6, y + 6, 4, 4, "#505050");
          }
          break;
        }
        case BLOCK.STEEL:
          p(x, y, SZ, SZ, "#b0b0b0");
          p(x + 1, y + 1, SZ - 2, SZ - 2, "#d8d8d8");
          p(x + 2, y + 2, SZ - 4, SZ - 4, "#909090");
          break;
        case BLOCK.PIPE_UL:
        case BLOCK.PIPE_UR:
        case BLOCK.PIPE_DL:
        case BLOCK.PIPE_DR: {
          const left = id === BLOCK.PIPE_UL || id === BLOCK.PIPE_DL;
          const cap = id === BLOCK.PIPE_UL || id === BLOCK.PIPE_UR;
          if (cap) {
            p(x - (left ? 1 : 0), y, SZ + 1, SZ, PAL.pipe);
            p(x - (left ? 1 : 0), y, SZ + 1, 3, PAL.pipeHi);
            p(x + (left ? 2 : 0), y + 3, SZ - 2, SZ - 3, PAL.pipeIn);
          } else {
            p(x, y, SZ, SZ, PAL.pipe);
            p(x + (left ? 2 : 0), y, SZ - 2, SZ, PAL.pipeIn);
          }
          if (left) p(x, y, 2, SZ, PAL.pipeHi);
          else p(x + SZ - 2, y, 2, SZ, "#004800");
          break;
        }
        default:
          break;
      }
    }

    castle(x, groundY) {
      const p = this.px.bind(this);
      p(x, groundY - 48, 48, 48, PAL.castle);
      p(x + 10, groundY - 64, 10, 16, PAL.castle);
      p(x + 28, groundY - 64, 10, 16, PAL.castle);
      p(x + 18, groundY - 24, 14, 24, "#404040");
      p(x + 20, groundY - 20, 10, 20, PAL.black);
      for (let i = 0; i < 6; i++) p(x, groundY - 8 * (i + 1), 48, 1, "#808080");
    }

    flagPole(camX, world, flagY) {
      const x = 200 * SZ - camX;
      const gy = (world.rows - 1) * SZ;
      for (let i = 1; i <= 7; i++) {
        this.px(x + 7, gy - i * SZ, 2, SZ, PAL.white);
      }
      this.px(x + 5, 0, 6, 6, PAL.coinGold);
      this.px(x + 9, flagY, 16, 11, PAL.flag);
      this.px(x + 11, flagY + 2, 4, 3, PAL.white);
    }

    hero(ent, frame) {
      const { x, y, w, h, dir, grounded, vx, tall, dying } = ent;
      const p = this.px.bind(this);
      const run = grounded && Math.abs(vx) > 0.25;
      const leg = Math.floor(frame / 6) % 3;
      const jump = !grounded;

      this.c.save();
      if (dir < 0) {
        this.c.translate(x + w, y);
        this.c.scale(-1, 1);
      } else {
        this.c.translate(x, y);
      }

      if (dying) {
        p(1, 2, 12, 4, PAL.marioHat);
        p(2, 6, 10, 8, PAL.marioOver);
        return this.c.restore();
      }

      p(2, 0, 10, 3, PAL.marioHat);
      p(1, 2, 12, 2, PAL.marioHat);
      p(3, 4, 9, 5, PAL.marioFace);
      p(2, 4, 2, 4, PAL.marioHair);
      p(3, 3, 3, 1, PAL.marioHair);
      p(9, 5, 2, 2, PAL.black);
      p(8, 7, 5, 1, PAL.marioHair);

      if (tall) {
        p(3, 10, 8, 8, PAL.marioOver);
        p(2, 9, 4, 5, PAL.marioHat);
        p(8, 9, 4, 5, PAL.marioHat);
        if (jump) {
          p(3, 18, 4, 6, PAL.marioOver);
          p(8, 18, 4, 6, PAL.marioOver);
        } else if (run) {
          const poses = [[2, 18], [4, 18], [3, 18]];
          const r = poses[leg];
          p(r[0], 18, 4, 6, PAL.marioOver);
          p(9 - leg, 18, 4, 6, PAL.marioOver);
        } else {
          p(3, 18, 4, 6, PAL.marioOver);
          p(8, 18, 4, 6, PAL.marioOver);
        }
        p(2, h - 2, 5, 2, PAL.marioHair);
        p(8, h - 2, 5, 2, PAL.marioHair);
      } else {
        p(3, 9, 8, 3, PAL.marioOver);
        p(2, 9, 3, 3, PAL.marioHat);
        p(9, 9, 3, 3, PAL.marioHat);
        if (jump) {
          p(3, 12, 4, 3, PAL.marioOver);
          p(8, 12, 4, 3, PAL.marioOver);
        } else if (run) {
          p(leg % 2 ? 2 : 4, 12, 4, 3, PAL.marioOver);
          p(leg % 2 ? 9 : 7, 12, 4, 3, PAL.marioOver);
        } else {
          p(3, 12, 4, 3, PAL.marioOver);
          p(8, 12, 4, 3, PAL.marioOver);
        }
        p(2, 14, 5, 2, PAL.marioHair);
        p(8, 14, 5, 2, PAL.marioHair);
      }
      this.c.restore();
    }

    walker(ent) {
      const x = ent.x;
      const y = ent.y;
      const p = this.px.bind(this);
      if (ent.squish > 0) {
        p(x, y + 10, ent.w, 4, PAL.goomba);
        p(x + 1, y + 10, ent.w - 2, 2, PAL.goombaFeet);
        return;
      }
      p(x + 1, y + 2, 12, 10, PAL.goomba);
      p(x + 2, y, 10, 4, PAL.goomba);
      const step = Math.floor(ent.anim) % 2;
      if (step) {
        p(x, y + 12, 6, 2, PAL.goombaFeet);
        p(x + 8, y + 12, 6, 2, PAL.goombaFeet);
      } else {
        p(x + 1, y + 12, 6, 2, PAL.goombaFeet);
        p(x + 7, y + 12, 6, 2, PAL.goombaFeet);
      }
      p(x + 3, y + 4, 3, 4, PAL.white);
      p(x + 8, y + 4, 3, 4, PAL.white);
      p(x + 4, y + 5, 2, 3, PAL.black);
      p(x + 9, y + 5, 2, 3, PAL.black);
      p(x + 2, y + 3, 4, 1, PAL.goombaFeet);
      p(x + 8, y + 3, 4, 1, PAL.goombaFeet);
    }

    mushroom(it) {
      const p = this.px.bind(this);
      p(it.x + 1, it.y, 12, 8, PAL.marioHat);
      p(it.x + 3, it.y + 2, 3, 3, PAL.white);
      p(it.x + 9, it.y + 2, 2, 2, PAL.white);
      p(it.x + 3, it.y + 8, 8, 6, PAL.marioFace);
      p(it.x + 5, it.y + 10, 2, 2, PAL.black);
      p(it.x + 8, it.y + 10, 2, 2, PAL.black);
    }

    coinSpin(it, tick) {
      const phase = Math.floor(tick / 5) % 4;
      const w = phase === 1 || phase === 3 ? 4 : 10;
      const x = it.x + (10 - w) / 2;
      this.px(x, it.y, w, 12, PAL.coinGold);
      if (w > 4) this.px(it.x + 3, it.y + 2, 2, 8, PAL.coinHi);
    }
  }

  // ---- Physics helpers ----
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function tileAt(world, px, py) {
    const c = Math.floor(px / SZ);
    const r = Math.floor(py / SZ);
    if (c < 0 || r < 0 || c >= world.cols || r >= world.rows) return BLOCK.AIR;
    return world.grid[r][c];
  }

  function solidTiles(world, box) {
    const out = [];
    const c0 = Math.floor(box.x / SZ);
    const r0 = Math.floor(box.y / SZ);
    const c1 = Math.floor((box.x + box.w - 0.01) / SZ);
    const r1 = Math.floor((box.y + box.h - 0.01) / SZ);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (c < 0 || r < 0 || c >= world.cols || r >= world.rows) continue;
        const id = world.grid[r][c];
        if (SOLID.has(id)) out.push({ c, r, id });
      }
    }
    return out;
  }

  // ---- Main game ----
  class MarioGame {
    constructor() {
      this.canvas = document.getElementById("screen");
      this.ctx = this.canvas.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
      this.paint = new Painter(this.ctx);
      this.audio = new GameAudio();
      this.menu = document.getElementById("menu");
      this.soundBtn = document.getElementById("sound-toggle");
      this.soundLabel = document.getElementById("sound-label");
      this.hud = {
        score: document.getElementById("hud-score"),
        coins: document.getElementById("hud-coins"),
        time: document.getElementById("hud-time"),
        lives: document.getElementById("hud-lives"),
      };

      this.keys = {};
      this.mode = "title";
      this.world = composeWorld();
      this.cam = 0;
      this.tick = 0;
      this.timer = 400;
      this.timerAcc = 0;
      this.score = 0;
      this.coinCount = 0;
      this.lives = 3;
      this.bumps = [];
      this.fx = [];
      this.floats = [];
      this.pickups = [];
      this.foes = [];
      this.flagY = 2 * SZ;
      this.invincible = 0;

      this.hero = this.spawnHero();
      this.bindInput();
      this.resetFoes();
      this.refreshHud();
      this.syncSoundUi();

      this.last = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }

    spawnHero() {
      return {
        x: 3 * SZ,
        y: 8 * SZ,
        w: 13,
        h: 15,
        vx: 0,
        vy: 0,
        dir: 1,
        grounded: false,
        holdJump: false,
        tall: false,
        dying: false,
        atFlag: false,
        walkAnim: 0,
      };
    }

    resetFoes() {
      this.foes = this.world.foes.map((f) => ({
        x: f.c * SZ,
        y: f.r * SZ - 2,
        w: 14,
        h: 14,
        dir: -1,
        vy: 0,
        alive: true,
        squish: 0,
        anim: 0,
      }));
    }

    newLife() {
      this.hero = this.spawnHero();
      this.pickups = [];
      this.bumps = [];
      this.fx = [];
      this.floats = [];
      this.cam = 0;
      this.timer = 400;
      this.timerAcc = 0;
      this.invincible = 90;
      this.resetFoes();
    }

    fullReset() {
      this.world = composeWorld();
      this.score = 0;
      this.coinCount = 0;
      this.lives = 3;
      this.newLife();
    }

    bindInput() {
      const down = (e) => {
        this.keys[e.code] = true;
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
        if (e.code === "KeyM") this.toggleSound();
        if (e.code === "KeyR") { this.fullReset(); this.beginPlay(); }
        if (e.code === "Enter" || e.code === "Space") {
          if (this.mode === "title" || this.mode === "over" || this.mode === "clear") {
            if (this.mode === "over" || this.mode === "clear") this.fullReset();
            this.beginPlay();
          }
        }
        if (e.code === "KeyP") {
          if (this.mode === "play") {
            this.mode = "pause";
            this.audio.sfxPause();
            this.audio.stopMusic();
            this.showMenu("PAUSED", "PRESS P TO RESUME");
          } else if (this.mode === "pause") {
            this.mode = "play";
            this.hideMenu();
            this.audio.startMusic();
          }
        }
      };
      const up = (e) => { this.keys[e.code] = false; };
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      this.canvas.addEventListener("pointerdown", async () => {
        await this.audio.init();
        if (["title", "over", "clear"].includes(this.mode)) {
          if (this.mode !== "title") this.fullReset();
          this.beginPlay();
        }
      });
      this.soundBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleSound();
      });
    }

    async toggleSound() {
      await this.audio.init();
      this.audio.flipMute();
      this.syncSoundUi();
    }

    syncSoundUi() {
      const m = this.audio.muted;
      this.soundBtn.classList.toggle("muted", m);
      this.soundLabel.textContent = m ? "OFF" : "ON";
    }

    showMenu(line1, line2) {
      this.menu.classList.remove("hidden");
      this.menu.querySelector(".logo").innerHTML = line1;
      this.menu.querySelector(".world-tag").textContent = line2 || "";
      this.menu.querySelector(".press-start").textContent =
        line1 === "PAUSED" ? "PRESS P TO RESUME" : "PRESS ENTER TO START";
    }

    hideMenu() {
      this.menu.classList.add("hidden");
    }

    async beginPlay() {
      await this.audio.init();
      this.mode = "play";
      this.hideMenu();
      this.audio.startMusic();
    }

    bumpOf(c, r) {
      const b = this.bumps.find((x) => x.c === c && x.r === r);
      return b ? b.off : 0;
    }

    addPoints(n, x, y) {
      this.score += n;
      if (x != null) this.floats.push({ x, y, text: String(n), life: 45 });
    }

    popCoin(c, r) {
      this.pickups.push({ kind: "coin", x: c * SZ + 3, y: r * SZ, vy: -4, life: 30 });
      this.coinCount++;
      this.addPoints(200, c * SZ, r * SZ);
      this.audio.sfxCoin();
      if (this.coinCount >= 100) {
        this.coinCount = 0;
        this.lives++;
        this.audio.sfxGrow();
      }
    }

    releaseShroom(c, r) {
      this.pickups.push({
        kind: "shroom", x: c * SZ, y: r * SZ - 2, w: 14, h: 14,
        vx: 0.75, vy: -1.2, rise: 18,
      });
      this.audio.sfxGrow();
    }

    strikeBlock(c, r, fromBelow) {
      if (!fromBelow) return;
      const id = this.world.grid[r][c];
      const key = `${c},${r}`;
      if (id === BLOCK.QUESTION) {
        this.world.grid[r][c] = BLOCK.QUESTION_USED;
        this.bumps.push({ c, r, off: 0, vy: -2.5 });
        this.audio.sfxKick();
        const loot = this.world.loot.get(key) || "coin";
        if (loot === "shroom" && !this.hero.tall) this.releaseShroom(c, r);
        else this.popCoin(c, r);
      } else if (id === BLOCK.BRICK) {
        this.bumps.push({ c, r, off: 0, vy: -2 });
        if (this.hero.tall) {
          this.world.grid[r][c] = BLOCK.AIR;
          this.audio.sfxCrush();
          this.addPoints(50, c * SZ, r * SZ);
          for (let i = 0; i < 4; i++) {
            this.fx.push({
              x: c * SZ + 8, y: r * SZ + 8,
              vx: (i % 2 ? 1 : -1) * (1.2 + Math.random()),
              vy: -2.5 - Math.random() * 2,
              life: 28, color: PAL.brick,
            });
          }
        } else {
          this.audio.sfxKick();
        }
      } else if (id === BLOCK.QUESTION_USED || id === BLOCK.STEEL) {
        this.audio.sfxKick();
        this.bumps.push({ c, r, off: 0, vy: -1.5 });
      }
    }

    hurtHero() {
      if (this.hero.dying || this.invincible > 0) return;
      if (this.hero.tall) {
        this.hero.tall = false;
        this.hero.h = 15;
        this.invincible = 120;
        this.audio.sfxKick();
        return;
      }
      this.hero.dying = true;
      this.hero.vy = -8;
      this.hero.vx = 0;
      this.lives--;
      this.audio.sfxDie();
      this.mode = "dying";
      setTimeout(() => {
        this.mode = this.lives <= 0 ? "over" : "title";
        this.showMenu(
          this.lives <= 0 ? "GAME OVER" : `MARIO ×${this.lives}`,
          this.lives <= 0 ? "PRESS ENTER" : "PRESS ENTER TO CONTINUE"
        );
        if (this.lives > 0) this.newLife();
      }, 2000);
    }

    stomp(foe) {
      foe.alive = false;
      foe.squish = 22;
      this.hero.vy = -4.5;
      this.hero.holdJump = false;
      this.addPoints(100, foe.x, foe.y);
      this.audio.sfxStomp();
    }

    moveBody(body, gravity, onHeadHit) {
      body.vy += gravity;
      if (body.vy > 8) body.vy = 8;

      body.x += body.vx;
      let hits = solidTiles(this.world, body);
      for (const h of hits) {
        const left = h.c * SZ;
        const right = left + SZ;
        if (body.vx > 0) body.x = left - body.w;
        else if (body.vx < 0) body.x = right;
        body.vx = 0;
      }

      body.y += body.vy;
      body.grounded = false;
      hits = solidTiles(this.world, body);
      for (const h of hits) {
        const top = h.r * SZ;
        const bot = top + SZ;
        if (body.vy > 0) {
          body.y = top - body.h;
          body.vy = 0;
          body.grounded = true;
        } else if (body.vy < 0) {
          body.y = bot;
          body.vy = 0;
          if (onHeadHit) onHeadHit(h.c, h.r);
        }
      }
    }

    updateHero() {
      const h = this.hero;
      if (h.dying) {
        h.vy += 0.35;
        h.y += h.vy;
        return;
      }

      if (h.atFlag) {
        const gy = (this.world.rows - 1) * SZ;
        if (h.y + h.h < gy) {
          h.y += 1.6;
        } else {
          h.x += 1.4;
          h.dir = 1;
          if (h.x > 207 * SZ) {
            this.mode = "clear";
            this.audio.sfxClear();
            this.showMenu("COURSE CLEAR!", "PRESS ENTER");
          }
        }
        return;
      }

      const left = this.keys.ArrowLeft || this.keys.KeyA;
      const right = this.keys.ArrowRight || this.keys.KeyD;
      const jumpKey = this.keys.Space || this.keys.KeyZ || this.keys.ArrowUp || this.keys.KeyW;
      const run = this.keys.KeyX || this.keys.ShiftLeft;

      const accel = run ? 0.2 : 0.13;
      const cap = run ? 2.7 : 1.7;

      if (left) { h.vx -= accel; h.dir = -1; }
      if (right) { h.vx += accel; h.dir = 1; }
      if (!left && !right) h.vx *= 0.82;
      if (Math.abs(h.vx) < 0.04) h.vx = 0;
      h.vx = Math.max(-cap, Math.min(cap, h.vx));

      if (jumpKey && h.grounded && !h.holdJump) {
        h.vy = -7;
        h.grounded = false;
        h.holdJump = true;
        this.audio.sfxJump();
      }
      if (jumpKey && h.holdJump && h.vy < 0) h.vy -= 0.32;
      if (!jumpKey) h.holdJump = false;

      this.moveBody(h, 0.42, (c, r) => this.strikeBlock(c, r, true));

      if (Math.abs(h.vx) > 0.2 && h.grounded) h.walkAnim++;

      if (h.y > this.world.rows * SZ + 32) this.hurtHero();

      const poleX = 200 * SZ;
      if (!h.atFlag && h.x + h.w > poleX && h.x < poleX + 10) {
        h.atFlag = true;
        h.x = poleX - 5;
        h.vx = 0;
        this.audio.stopMusic();
        this.audio.sfxFlag();
        this.addPoints(Math.floor(this.timer / 10) * 50);
        this.flagY = h.y;
      }

      if (this.invincible > 0) this.invincible--;
    }

    updateFoe(f) {
      if (f.squish > 0) { f.squish--; return; }
      if (!f.alive) return;

      f.anim += 0.12;
      f.vx = f.dir * 0.6;

      const edgeX = f.dir < 0 ? f.x - 2 : f.x + f.w + 2;
      const below = tileAt(this.world, edgeX, f.y + f.h + 2);
      if (!SOLID.has(below)) f.dir *= -1;

      const prevX = f.x;
      this.moveBody(f, 0.42, null);
      if (f.x === prevX && f.grounded) f.dir *= -1;

      if (f.y > this.world.rows * SZ) f.alive = false;

      const hero = this.hero;
      if (hero.dying || hero.atFlag || !f.alive) return;
      if (!overlap(hero, f)) return;

      if (hero.vy > 0 && hero.y + hero.h - f.y < 12) this.stomp(f);
      else this.hurtHero();
    }

    updatePickups() {
      for (const it of this.pickups) {
        if (it.kind === "coin") {
          it.y += it.vy;
          it.vy += 0.22;
          it.life--;
        } else if (it.kind === "shroom") {
          if (it.rise > 0) {
            it.y -= 0.55;
            it.rise--;
            continue;
          }
          it.vy += 0.42;
          it.x += it.vx;
          let hits = solidTiles(this.world, it);
          for (const h of hits) {
            if (it.vx > 0) it.x = h.c * SZ - it.w;
            else it.x = h.c * SZ + SZ;
            it.vx *= -1;
          }
          it.y += it.vy;
          hits = solidTiles(this.world, it);
          for (const h of hits) {
            if (it.vy > 0) { it.y = h.r * SZ - it.h; it.vy = 0; }
          }
          if (overlap(this.hero, it) && !this.hero.dying) {
            it.dead = true;
            if (!this.hero.tall) {
              this.hero.tall = true;
              this.hero.h = 24;
              this.hero.y -= 9;
              this.addPoints(1000, this.hero.x, this.hero.y);
              this.audio.sfxGrow();
            } else {
              this.addPoints(1000, this.hero.x, this.hero.y);
              this.audio.sfxCoin();
            }
          }
          if (it.y > this.world.rows * SZ + 40) it.dead = true;
        }
      }
      this.pickups = this.pickups.filter((it) => {
        if (it.dead) return false;
        if (it.kind === "coin") return it.life > 0;
        return true;
      });
    }

    updateFx() {
      for (const p of this.fx) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.life--;
      }
      this.fx = this.fx.filter((p) => p.life > 0);

      for (const f of this.floats) {
        f.y -= 0.55;
        f.life--;
      }
      this.floats = this.floats.filter((f) => f.life > 0);

      for (const b of this.bumps) {
        b.off += b.vy;
        b.vy += 0.38;
        if (b.off >= 0) { b.off = 0; b.done = true; }
      }
      this.bumps = this.bumps.filter((b) => !b.done);
    }

    refreshHud() {
      this.hud.score.textContent = String(this.score).padStart(6, "0");
      this.hud.coins.textContent = `×${String(this.coinCount).padStart(2, "0")}`;
      this.hud.time.textContent = String(Math.max(0, Math.ceil(this.timer)));
      this.hud.lives.textContent = `×${String(this.lives).padStart(2, "0")}`;
    }

    update(dt) {
      this.tick++;
      if (this.mode === "play") {
        this.timerAcc += dt;
        if (this.timerAcc >= 500) {
          this.timerAcc = 0;
          this.timer--;
          if (this.timer <= 0) { this.timer = 0; this.hurtHero(); }
        }
        this.updateHero();
        this.foes.forEach((f) => this.updateFoe(f));
        this.updatePickups();
      } else if (this.mode === "dying") {
        this.updateHero();
      }
      this.updateFx();

      const target = this.hero.x - VW * 0.38;
      this.cam += (target - this.cam) * 0.12;
      const maxCam = this.world.cols * SZ - VW;
      this.cam = Math.max(0, Math.min(this.cam, maxCam));

      if (this.hero.atFlag) {
        this.flagY = Math.min(this.flagY + 1.2, this.hero.y);
      }

      this.refreshHud();
    }

    render() {
      const ctx = this.ctx;
      ctx.setTransform(ZOOM, 0, 0, ZOOM, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = PAL.sky;
      ctx.fillRect(0, 0, VW, VH);

      const gy = (this.world.rows - 1) * SZ;
      const parallax = this.cam * 0.55;

      for (const [cx, cy] of this.world.scenery.clouds) {
        this.paint.cloud(cx * SZ - parallax, cy * SZ + 10);
      }
      for (const [hx] of this.world.scenery.hills) {
        this.paint.hill(hx * SZ - this.cam, gy);
      }
      for (const [bx] of this.world.scenery.shrubs) {
        this.paint.shrub(bx * SZ - this.cam, gy);
      }

      const c0 = Math.floor(this.cam / SZ);
      const c1 = Math.min(this.world.cols - 1, c0 + Math.ceil(VW / SZ) + 2);
      for (let r = 0; r < this.world.rows; r++) {
        for (let c = c0; c <= c1; c++) {
          const id = this.world.grid[r][c];
          if (id === BLOCK.AIR || id === BLOCK.POLE || id === BLOCK.POLE_TOP) continue;
          if (id === BLOCK.CASTLE) continue;
          this.paint.tile(id, c * SZ - this.cam, r * SZ, this.bumpOf(c, r));
        }
      }

      this.paint.castle(208 * SZ - this.cam, gy);
      this.paint.flagPole(this.cam, this.world, this.flagY);

      for (const it of this.pickups) {
        if (it.kind === "shroom") this.paint.mushroom(it);
        else this.paint.coinSpin(it, this.tick);
      }
      for (const f of this.foes) this.paint.walker(f);

      if (!(this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0)) {
        this.paint.hero(this.hero, this.hero.walkAnim);
      }

      for (const p of this.fx) {
        this.paint.px(p.x - this.cam, p.y, 3, 3, p.color);
      }

      ctx.fillStyle = "#fff";
      ctx.font = "6px monospace";
      for (const f of this.floats) {
        ctx.globalAlpha = Math.min(1, f.life / 22);
        ctx.fillText(f.text, f.x - this.cam, f.y);
        ctx.globalAlpha = 1;
      }
    }

    loop(now) {
      const dt = Math.min(50, now - this.last);
      this.last = now;
      this.update(dt);
      this.render();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  new MarioGame();
})();
