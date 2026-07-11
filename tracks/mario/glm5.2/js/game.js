// ============================================================
// Game Engine - Main game loop, rendering, camera, HUD
// ============================================================

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.state = STATE_TITLE;
        this.canvas = canvas;

        // Game stats
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.timeTimer = 0;

        // Camera
        this.camera = { x: 0, y: 0 };

        // Entities
        this.player = null;
        this.entities = [];
        this.bumpAnims = [];

        // Level
        this.levelData = null;
        this.level = null;

        // Animation
        this.qBlockFrame = 0;
        this.qBlockTimer = 0;
        this.frameCount = 0;

        // Transitions
        this.transitionTimer = 0;

        // Coin counter for multi-coin blocks
        this.multiCoinBlocks = {};

        // Flag animation
        this.flagY = 3 * TILE_SIZE; // starts at top of flagpole
        this.flagSliding = false;

        this._init();
    }

    _init() {
        this.levelData = buildLevel1();
        this.level = this.levelData.grid;
    }

    startGame() {
        this.state = STATE_PLAYING;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.timeTimer = 0;
        this.startLevel();
        audio.init();
        audio.resume();
        audio.playTheme();
    }

    startLevel() {
        // Rebuild level
        this.levelData = buildLevel1();
        this.level = this.levelData.grid;

        // Reset camera
        this.camera = { x: 0, y: 0 };

        // Reset entities
        this.entities = [];
        this.bumpAnims = [];
        this.multiCoinBlocks = {};

        // Create player
        this.player = new Player(
            this.levelData.startX,
            this.levelData.startY
        );
        this.player.state = 'spawning';
        this.player.spawnTimer = 0;

        // Spawn enemies
        for (const e of this.levelData.enemies) {
            const ex = e.x * TILE_SIZE;
            const ey = e.y * TILE_SIZE;
            if (e.type === 'goomba') {
                this.entities.push(new Goomba(ex, ey));
            } else if (e.type === 'koopa') {
                this.entities.push(new Koopa(ex, ey));
            }
        }

        // Spawn floating coins from level data
        for (let row = 0; row < this.level.length; row++) {
            for (let col = 0; col < this.level[row].length; col++) {
                if (this.level[row][col] === TILE.COIN) {
                    this.entities.push(new Coin(col * TILE_SIZE, row * TILE_SIZE));
                    this.level[row][col] = TILE.EMPTY; // Remove from grid, handled by entity
                }
            }
        }

        this.time = 400;
        this.timeTimer = 0;
        this.flagY = 3 * TILE_SIZE;
        this.flagSliding = false;
        audio.playTheme();
    }

    restartLevel() {
        if (this.lives <= 0) {
            this.state = STATE_GAME_OVER;
            audio.sfxGameOver();
            showGameOverScreen();
            return;
        }
        this.startLevel();
    }

    // ---- Tile solidity ----
    isSolidTile(tile) {
        switch (tile) {
            case TILE.GROUND:
            case TILE.GROUND_TOP:
            case TILE.GROUND_FILL:
            case TILE.BRICK:
            case TILE.QUESTION_COIN:
            case TILE.QUESTION_MUSHROOM:
            case TILE.QUESTION_1UP:
            case TILE.QUESTION_MULTI:
            case TILE.USED:
            case TILE.HARD:
            case TILE.PIPE_TL:
            case TILE.PIPE_TR:
            case TILE.PIPE_BL:
            case TILE.PIPE_BR:
            case TILE.FLAGPOLE_BASE:
                return true;
            default:
                return false;
        }
    }

    // ---- Scoring ----
    addScore(amount) {
        this.score += amount;
        if (this.score >= 10000 && this.lives < 99) {
            // Extra life at 10000 (simplified)
        }
    }

    addCoin() {
        this.coins++;
        if (this.coins >= 100) {
            this.coins -= 100;
            this.lives++;
            audio.sfxOneUp();
        }
    }

    addLife() {
        this.lives++;
    }

    // ---- Spawning helpers ----
    spawnCoinPop(col, row) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        this.entities.push(new CoinPop(x, y - 16));
    }

    spawnMushroom(col, row) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        this.entities.push(new Mushroom(x, y));
    }

    spawn1UpMushroom(col, row) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        this.entities.push(new OneUpMushroom(x, y));
    }

    spawnBrickPieces(col, row) {
        const x = col * TILE_SIZE + 4;
        const y = row * TILE_SIZE;
        this.entities.push(new BrickPiece(x, y, -2, -8));
        this.entities.push(new BrickPiece(x + 8, y, 2, -8));
        this.entities.push(new BrickPiece(x, y, -1.5, -6));
        this.entities.push(new BrickPiece(x + 8, y, 1.5, -6));
    }

    spawnScorePopup(x, y, text) {
        this.entities.push(new ScorePopup(x, y, text));
    }

    bumpAnimation(col, row) {
        this.bumpAnims.push(new BumpAnim(col, row));
    }

    // ---- Event callbacks ----
    onPlayerDeath() {
        this.stopMusic = true;
    }

    onPlayerDeathComplete() {
        this.lives--;
        this.restartLevel();
    }

    onFlagpoleHit(player) {
        // Start flag sliding
        this.flagSliding = true;

        // Score based on height
        const groundY = (this.levelData.groundY - 1) * TILE_SIZE;
        const heightRatio = 1 - (player.y / groundY);
        let score = 100;
        if (heightRatio > 0.8) score = 5000;
        else if (heightRatio > 0.6) score = 2000;
        else if (heightRatio > 0.4) score = 800;
        else if (heightRatio > 0.2) score = 400;
        this.addScore(score);
        this.spawnScorePopup(player.x, player.y, String(score));
    }

    onLevelComplete() {
        this.state = STATE_WIN;
        audio.sfxGameComplete();
        // Time bonus
        const timeBonus = this.time * 50;
        this.score += timeBonus;
        showWinScreen(this.score);
    }

    // ---- Update ----
    update() {
        if (this.state !== STATE_PLAYING && this.state !== STATE_DYING) return;

        this.frameCount++;

        // Question block animation
        this.qBlockTimer++;
        if (this.qBlockTimer >= 12) {
            this.qBlockTimer = 0;
            this.qBlockFrame = (this.qBlockFrame + 1) % 3;
        }

        // Time countdown
        if (this.player && this.player.state === 'normal') {
            this.timeTimer++;
            if (this.timeTimer >= 24) { // ~2.5 seconds per game second
                this.timeTimer = 0;
                this.time--;
                if (this.time <= 0) {
                    this.time = 0;
                    this.player.die(this);
                }
            }
        }

        // Update player
        if (this.player) {
            this.player.update(this);
        }

        // Update entities
        for (const entity of this.entities) {
            if (!entity.dead) {
                entity.update(this);
            }
        }

        // Remove dead entities
        this.entities = this.entities.filter(e => !e.dead);

        // Update bump animations
        for (const bump of this.bumpAnims) {
            bump.update();
        }
        this.bumpAnims = this.bumpAnims.filter(b => !b.dead);

        // Update flag slide
        if (this.flagSliding) {
            this.flagY += 3;
            const maxFlagY = (this.levelData.groundY - 2) * TILE_SIZE;
            if (this.flagY >= maxFlagY) {
                this.flagY = maxFlagY;
                this.flagSliding = false;
            }
        }

        // Update camera
        this.updateCamera();
    }

    updateCamera() {
        if (!this.player) return;

        // Camera follows player horizontally
        const targetX = this.player.x - SCREEN_W * 0.35;
        if (targetX > this.camera.x) {
            this.camera.x = targetX;
        }

        // Clamp camera
        const maxCamX = this.levelData.width * TILE_SIZE - SCREEN_W;
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.x > maxCamX) this.camera.x = maxCamX;

        // Fixed vertical (no vertical scrolling in this level)
        this.camera.y = 0;
    }

    // ---- Rendering ----
    draw() {
        const ctx = this.ctx;

        // Clear with sky color
        ctx.fillStyle = '#5C94FC';
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

        if (this.state === STATE_TITLE) return;

        // Draw scenery (behind tiles)
        this.drawScenery();

        // Draw tiles
        this.drawTiles();

        // Draw entities
        for (const entity of this.entities) {
            entity.draw(ctx, this.camera);
        }

        // Draw player
        if (this.player) {
            this.player.draw(ctx, this.camera);
        }

        // Draw flag on flagpole
        this.drawFlag();

        // Draw castle
        this.drawCastle();

        // Draw HUD
        this.drawHUD();
    }

    drawCastle() {
        const ctx = this.ctx;
        const castleCol = this.levelData.castleCol;
        const groundY = this.levelData.groundY;
        const cx = castleCol * TILE_SIZE - this.camera.x;
        const cy = (groundY - 5) * TILE_SIZE;
        const cw = 5 * TILE_SIZE;
        const ch = 5 * TILE_SIZE;

        if (cx < -cw || cx > SCREEN_W + cw) return;

        const brick = '#BCBCBC';
        const brickDark = '#7C7C7C';
        const black = '#000000';

        // Main body
        ctx.fillStyle = brick;
        ctx.fillRect(cx, cy + 8, cw, ch - 8);

        // Battlements (crenellated top)
        ctx.fillRect(cx, cy + 8, 8, 8);
        ctx.fillRect(cx + 16, cy + 8, 8, 8);
        ctx.fillRect(cx + 32, cy + 8, 8, 8);
        ctx.fillRect(cx + 48, cy + 8, 8, 8);
        ctx.fillRect(cx + 64, cy + 8, 8, 8);
        // Cut out between battlements
        // (already cut by only drawing the solid parts)

        // Brick texture
        ctx.fillStyle = brickDark;
        for (let row = 0; row < ch; row += 8) {
            ctx.fillRect(cx, cy + row + 8, cw, 1);
        }
        for (let row = 0; row < ch; row += 8) {
            const offset = (Math.floor(row / 8) % 2) * 8;
            for (let col = offset; col < cw; col += 16) {
                ctx.fillRect(cx + col, cy + row + 8, 1, 8);
            }
        }

        // Door (arched)
        const doorW = 16;
        const doorH = 24;
        const doorX = cx + (cw - doorW) / 2;
        const doorY = cy + ch - doorH;
        ctx.fillStyle = black;
        ctx.fillRect(doorX, doorY + 8, doorW, doorH - 8);
        // Arch
        ctx.fillRect(doorX + 2, doorY + 4, doorW - 4, 4);
        ctx.fillRect(doorX + 4, doorY + 2, doorW - 8, 2);
        ctx.fillRect(doorX + 6, doorY, doorW - 12, 2);

        // Window
        ctx.fillStyle = black;
        const winX = cx + cw / 2 - 4;
        ctx.fillRect(winX, cy + 20, 8, 8);

        // Tower window (left and right)
        ctx.fillRect(cx + 8, cy + 24, 8, 8);
        ctx.fillRect(cx + cw - 16, cy + 24, 8, 8);
    }

    drawFlag() {
        const ctx = this.ctx;
        const flagCol = this.levelData.flagCol;
        const fx = flagCol * TILE_SIZE - this.camera.x;
        const fy = this.flagY - this.camera.y;

        if (fx < -20 || fx > SCREEN_W + 20) return;

        // Draw triangular flag (green/white) pointing left
        ctx.fillStyle = '#43A047';
        for (let i = 0; i < 7; i++) {
            const w = 7 - Math.abs(i - 3);
            ctx.fillRect(fx - w, fy + i, w, 1);
        }
        // White ball detail
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(fx - 5, fy + 2, 2, 2);
    }

    drawScenery() {
        const ctx = this.ctx;
        const camX = this.camera.x;

        for (const s of this.levelData.scenery) {
            const sx = s.x * TILE_SIZE - camX;
            const sy = s.y * TILE_SIZE;

            // Skip if off-screen
            if (sx < -100 || sx > SCREEN_W + 100) continue;

            if (s.type === 'cloud') {
                drawCloud(ctx, sx, sy, s.size);
            } else if (s.type === 'bush') {
                drawBush(ctx, sx, sy, s.size);
            } else if (s.type === 'hill') {
                drawHill(ctx, sx, sy, s.size);
            }
        }
    }

    drawTiles() {
        const ctx = this.ctx;
        const camX = this.camera.x;

        // Calculate visible tile range
        const startCol = Math.floor(camX / TILE_SIZE);
        const endCol = Math.ceil((camX + SCREEN_W) / TILE_SIZE);
        const startRow = 0;
        const endRow = this.level.length;

        // Get bump offsets
        const bumpOffsets = {};
        for (const bump of this.bumpAnims) {
            bumpOffsets[bump.row + '_' + bump.col] = bump.offset;
        }

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (col < 0 || col >= this.levelData.width) continue;

                const tile = this.level[row] ? this.level[row][col] : TILE.EMPTY;
                if (tile === TILE.EMPTY) continue;

                const tx = col * TILE_SIZE - camX;
                let ty = row * TILE_SIZE - this.camera.y;
                const bumpKey = row + '_' + col;
                if (bumpOffsets[bumpKey] !== undefined) {
                    ty += bumpOffsets[bumpKey];
                }

                this.drawTile(ctx, tile, tx, ty, col, row);
            }
        }
    }

    drawTile(ctx, tile, x, y, col, row) {
        switch (tile) {
            case TILE.GROUND_TOP:
                drawGroundBlock(ctx, x, y);
                break;
            case TILE.GROUND_FILL:
                // Draw filled ground (darker, no grass)
                ctx.fillStyle = '#B07040';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#8A4800';
                ctx.fillRect(x + 14, y, 2, 16);
                ctx.fillRect(x, y + 14, 16, 2);
                break;
            case TILE.GROUND:
                drawGroundBlock(ctx, x, y);
                break;
            case TILE.BRICK:
                drawBrickBlock(ctx, x, y);
                break;
            case TILE.QUESTION_COIN:
            case TILE.QUESTION_MUSHROOM:
            case TILE.QUESTION_1UP:
            case TILE.QUESTION_MULTI:
                drawQuestionBlock(ctx, x, y, this.qBlockFrame);
                break;
            case TILE.USED:
                drawUsedBlock(ctx, x, y);
                break;
            case TILE.HARD:
                drawHardBlock(ctx, x, y);
                break;
            case TILE.PIPE_TL:
                drawPipeTopLeft(ctx, x, y);
                break;
            case TILE.PIPE_TR:
                drawPipeTopRight(ctx, x, y);
                break;
            case TILE.PIPE_BL:
                drawPipeBodyLeft(ctx, x, y);
                break;
            case TILE.PIPE_BR:
                drawPipeBodyRight(ctx, x, y);
                break;
            case TILE.FLAGPOLE_TOP:
                drawFlagpoleTop(ctx, x, y);
                drawFlagpolePole(ctx, x, y + 6);
                break;
            case TILE.FLAGPOLE:
                drawFlagpolePole(ctx, x, y);
                break;
            case TILE.FLAGPOLE_BASE:
                // Base of flagpole
                ctx.fillStyle = '#43A047';
                ctx.fillRect(x + 4, y, 8, 16);
                ctx.fillStyle = '#1B6020';
                ctx.fillRect(x + 4, y + 12, 8, 4);
                drawFlagpolePole(ctx, x, y);
                break;
            case TILE.CASTLE:
                // Castle drawn separately in drawCastle()
                break;
        }
    }

    drawHUD() {
        const ctx = this.ctx;

        // Text style - small font for NES resolution
        ctx.fillStyle = '#FCFCFC';
        ctx.font = '8px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // MARIO + score
        ctx.fillText('MARIO', 16, 8);
        ctx.fillText(String(this.score).padStart(6, '0'), 16, 16);

        // Coins - draw small coin icon
        const coinX = 88;
        const coinY = 16;
        ctx.fillStyle = '#FBC02D';
        ctx.fillRect(coinX, coinY + 1, 6, 6);
        ctx.fillStyle = '#C89000';
        ctx.fillRect(coinX + 2, coinY + 2, 2, 4);
        ctx.fillStyle = '#FCFCFC';
        ctx.fillText('x' + String(this.coins).padStart(2, '0'), coinX + 8, coinY);

        // WORLD
        ctx.fillText('WORLD', 120, 8);
        ctx.fillText(' 1-1', 128, 16);

        // TIME
        ctx.fillText('TIME', 168, 8);
        ctx.fillText(String(this.time).padStart(3, '0'), 176, 16);

        // LIVES - draw small Mario head icon
        const lifeX = 208;
        const lifeY = 16;
        // Mini Mario icon (8x8)
        ctx.fillStyle = '#E52521';
        ctx.fillRect(lifeX + 1, lifeY, 4, 2);     // hat
        ctx.fillRect(lifeX, lifeY + 1, 6, 1);
        ctx.fillStyle = '#FFA876';
        ctx.fillRect(lifeX, lifeY + 3, 6, 3);     // face
        ctx.fillStyle = '#000000';
        ctx.fillRect(lifeX + 1, lifeY + 3, 1, 1); // eye
        ctx.fillRect(lifeX + 3, lifeY + 4, 2, 1); // mustache
        ctx.fillStyle = '#4A6ACE';
        ctx.fillRect(lifeX, lifeY + 6, 6, 2);     // body
        ctx.fillStyle = '#FCFCFC';
        ctx.fillText('x' + this.lives, lifeX + 8, lifeY);

        // Mute indicator
        if (audio.muted) {
            ctx.fillStyle = '#FCFCFC';
            ctx.font = '8px "Courier New", monospace';
            ctx.fillText('MUTE', SCREEN_W - 30, 8);
        }

        // Pause overlay
        if (this.state === STATE_PAUSED) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
            ctx.fillStyle = '#FCFCFC';
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSE', SCREEN_W / 2, SCREEN_H / 2 - 8);
            ctx.font = '8px "Courier New", monospace';
            ctx.fillText('PRESS P TO RESUME', SCREEN_W / 2, SCREEN_H / 2 + 8);
            ctx.textAlign = 'left';
        }
    }
}
